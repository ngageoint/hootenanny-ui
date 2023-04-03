import Tab from './tab';
import { d3combobox } from '../d3.combobox';
import FormFactory from '../../tools/formFactory';
import OverpassQueryPanel from '../../tools/overpassQueryPanel';
import { polyStringFromGeom } from '../../tools/utilities';

/**
 * Creates the tasking manager tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TaskingManagerPanel extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Tasking Manager';
        this.id   = 'taskingManagerPanel';
        this.operationName = 'taskingManager';
        this.currentProject = null;
        this.formFactory = new FormFactory();

        this.deriveTypeOpts = {
            name: 'deriveType',
            readonly: 'readonly',
            options: [
                { deriveType: 'Adds only', description: `Add all data from ${Hoot.config.secondaryLabel} in the specified area into ${Hoot.config.referenceLabel}` },
                { deriveType: 'Cut & Replace', description: `Replace the ${Hoot.config.referenceLabel} data in this region with ${Hoot.config.secondaryLabel} data` },
                { deriveType: 'Differential', description: `Add the features from ${Hoot.config.secondaryLabel} that don't exist in ${Hoot.config.referenceLabel}` },
                { deriveType: 'Differential w/Tags', description: `Add the features from ${Hoot.config.secondaryLabel} that don't exist in ${Hoot.config.referenceLabel} but allow tag modifications of existing` }
            ]
        };

        // what tasking manager state number stands for
        this.taskingManagerStatus = {
            1: 'Partially conflated',
            2: 'Done',
            3: 'Validated'
        };

        // trigger for run all tasks loop to stop
        this.cancelRunning = false;

        this.tmVersion = null;
    }

    render() {
        super.render();

        this.createTables();

        this.initDiffForms();

        return this;
    }

    async initDiffForms() {
        // form for cut and replace options
        this.cutReplaceOptions = {
            title: 'Options',
            form: [],
            button: {
                text: 'Done',
                id: 'DoneBtn',
                disabled: null,
                onClick: () => {
                    this.ADV_OPTIONS = this.formFactory.getAdvOpts(this.form, cutReplaceOpts);
                    if ( this.form ) this.form.remove();
                }
            }
        };

        //Add advanced options to form
        const cutReplaceOpts = await Hoot.api.getAdvancedChangesetOptions();
        if ( cutReplaceOpts ) {
            this.cutReplaceOptions.form = this.cutReplaceOptions.form.concat(cutReplaceOpts.map(this.formFactory.advOpt2DomMeta));
        }

        // form for differential options
        this.differentialOptions = {
            title: 'Options',
            form: [],
            button: {
                text: 'Done',
                id: 'DoneBtn',
                disabled: null,
                onClick: () => {
                    this.ADV_OPTIONS = this.formFactory.getAdvOpts(this.form, differentialOpts);
                    if ( this.form ) this.form.remove();
                }
            }
        };

        //Add advanced options to form
        const differentialOpts = await Hoot.api.getAdvancedOptions('differential');
        if ( differentialOpts ) {
            this.differentialOptions.form = this.differentialOptions.form.concat(differentialOpts.map(this.formFactory.advOpt2DomMeta));
        }
    }

    async activate( pageNumber ) {
        this.loadingState( this.projectsTable, true );

        // If version is set then we know which call to make
        if ( this.tmVersion === 4 ) {
            this.projectList = await Hoot.api.getTM4Projects( pageNumber );
        } else if ( this.tmVersion === 2 ) {
            this.projectList = await Hoot.api.getTMProjects( pageNumber );
        } else {
            // await for the tm4 project list
            this.projectList = await Hoot.api.getTM4Projects( pageNumber );
            this.tmVersion = 4;

            // if no result from tm4 then try tm2 project list
            if ( this.projectList.status === 400 ) {
                this.projectList = await Hoot.api.getTMProjects( pageNumber );
                this.tmVersion = 2;
            }
        }

        if ( this.projectList.status === 400 ) {
            Hoot.message.alert( this.projectList );
            this.loadingState( this.projectsTable, false );
        } else if ( this.projectList ) {
            // this seems to happen if there are no visible conflation projects
            if ( !this.projectList.features ) {
                this.projectList.features = [];
            }
            this.projectList.features = this.projectList.features.filter( task => task.properties.hoot_map_id || task.properties.hootMapId );
            this.loadProjectsTable( this.projectList.features );
        }

        if ( this.projectList.pagination ) {
            this.createPagination();
        }
    }

    createTables() {
        this.projectsContainer = this.panelWrapper.append( 'div' )
            .classed( 'taskingManager-projects', true );

        this.paginationContainer = this.projectsContainer.append( 'div' )
            .classed( 'taskingManager-table-paginate', true );

        this.projectsContainer.append( 'h3' )
            .text( 'Tasking Manager Projects' );

        this.projectsTable = this.projectsContainer.append( 'div' )
            .classed( 'taskingManager-table keyline-all', true );

        // Initially hidden
        this.tasksContainer = this.panelWrapper.append( 'div' )
            .classed( 'taskingManager-tasks hidden', true );
        this.tasksContainer.append( 'div' )
            .classed( 'taskHeader', true )
            .append( 'h3' )
            .classed( 'taskHeader-title', true );

        this.tasksTable = this.tasksContainer.append( 'div' )
            .classed( 'taskingManager-table tasks-table keyline-all', true );
    }

    createPagination() {
        this.paginationContainer.selectAll( 'a' ).remove();
        this.paginationContainer.selectAll( 'span' ).remove();

        const paginationInfo = this.projectList.pagination,
            self = this;
        let currentPage = paginationInfo.page,
            totalPages = paginationInfo.pages;

        function addButton( pageNum ) {
            let btn;
            if ( pageNum ) {
                btn = self.paginationContainer.append( 'a' )
                    .text( pageNum )
                    .attr( 'data-id', pageNum )
                    .classed( 'current-page', pageNum === currentPage )
                    .on( 'click', () => {
                        self.activate( pageNum );
                    });
            } else {
                btn = self.paginationContainer.append( 'span' )
                    .classed( 'disabled', true )
                    .text( '...' );
            }

            btn.classed( 'button', true );
        }

        this.paginationContainer.append('span')
            .classed( 'pagination-title', true )
            .text('Page: ');

        if ( totalPages <= 6 ) {
            for ( let pageNum = 1; pageNum <= totalPages; pageNum++ ) {
                addButton( pageNum );
            }
        }
        else {
            // always print first page
            addButton( 1 );

            // add '...' is page > 3
            if ( currentPage > 3 ) {
                addButton();
            }
            // special case where last page is selected
            if (currentPage === totalPages) {
                addButton(currentPage - 2);
            }
            // print previous number button if currentPage > 2
            if (currentPage > 2) {
                addButton(currentPage - 1);
            }
            // print current page number button as long as it not the first or last page
            if (currentPage !== 1 && currentPage !== totalPages) {
                addButton(currentPage);
            }
            // print next number button if currentPage < lastPage - 1
            if (currentPage < totalPages - 1) {
                addButton(currentPage + 1);
            }
            // special case where first page is selected...
            if (currentPage === 1) {
                addButton(currentPage + 2);
            }
            // print '...' if currentPage is < lastPage -2
            if (currentPage < totalPages - 2) {
                addButton();
            }
            // always print last page button if there is more than 1 page
            addButton( totalPages );
        }
    }

    loadProjectsTable( projects ) {
        this.projectsTable.selectAll( '.taskingManager-item' ).remove();

        let items = this.projectsTable.selectAll( '.taskingManager-item' )
            .data( projects );

        items.exit().remove();

        items = items.enter()
            .append( 'div' )
            .attr( 'id', d =>  d.id || d.properties.projectId )
            .classed( 'taskingManager-item fill-white keyline-bottom', true );

        let header = items
            .append( 'div' )
            .classed( 'taskingManager-header flex justify-between align-center', true );
        header.append( 'div' )
            .classed( 'taskingManager-title', true )
            .append( 'a' )
            .text( project => `#${project.id} ${project.properties.name}` )
            .on( 'click', (d3_event, project) => {
                this.loadTaskTable( project );
            } );

        let body = items.append( 'div' )
            .classed( 'taskingManager-body', true );

        let description = body.append( 'div' )
            .classed( 'taskingManager-description', true );
        description.append( 'span' )
            .text( project => project.properties.short_description );

        let details = body.append( 'div' )
            .classed( 'taskingManager-details', true );
        details.append( 'span' ).text( project => {
            let author = project.properties.author,
                created = project.properties.created || project.properties.lastUpdated;
            created = new Date( created ).toLocaleDateString();

            return `Created by ${author} - Created on ${created}`;
        } );

        this.loadingState( this.projectsTable );
    }

    createDeriveDropdown() {
        let enter = this.tasksContainer.select( '.taskHeader' )
            .selectAll( '.changeset-control' )
            .data( [ this.deriveTypeOpts ] )
            .enter();

        let dropdownContainer = enter.append( 'div' )
            .classed( 'changeset-control', true );

        this.deriveDropdown = dropdownContainer.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Select derive type' )
            .attr( 'id', d => d.name )
            .attr( 'name', d => d.name )
            .attr( 'readonly', d => d.readonly )
            .call( d3combobox().data( this.deriveTypeOpts.options.map( data => {
                    return {
                        value: data.deriveType,
                        title: data.description
                    };
                } )
            ) )
            .on('change', () => {
                this.callback = () => {
                    if ( this.overpassQueryContainer && this.overpassQueryContainer.select( '#customQueryToggle' ).property( 'checked' ) ) {
                        this.customQuery = this.overpassQueryContainer.select( 'textarea' ).property( 'value' );
                    } else {
                        this.customQuery = null;
                    }

                    if (this.deriveDropdown.property('value') === 'Cut & Replace'
                        && this.cutReplaceOptions.form.length > 0) {
                        let formId = 'cutReplaceForm';
                        this.form = this.formFactory.generateForm('body', formId, this.cutReplaceOptions);
                    } else if (this.deriveDropdown.property('value').includes( 'Differential' )
                        && this.differentialOptions.form.length > 0) {
                        let formId = 'differentialForm';
                        this.form = this.formFactory.generateForm('body', formId, this.differentialOptions);
                    } else {
                        // currently only cut & replace will have advanced options so clear it when other option is selected
                        this.ADV_OPTIONS = null;
                    }
                };

                new OverpassQueryPanel( this ).render();

            });
    }

    isDeriveSelected() {
        const deriveType = this.deriveDropdown.property( 'value' );

        if ( !deriveType ) {
            const alert = {
                message: 'Need to select a derive type',
                type: 'warn'
            };

            Hoot.message.alert( alert );
        }

        return deriveType;
    }

    setTaskStatus( taskId, status ) {
        const taskContainer = this.tasksContainer.select( `#task_${ taskId }` );
        const taskData = taskContainer.datum();

        const buttonsContainer = taskContainer.select( '.taskingManager-action-buttons' );
        buttonsContainer.selectAll( 'button' ).property( 'disabled', status === 'Running' );

        if ( !status ) {
            let taskState;
            if ( this.tmVersion === 4 ) {
                let state = taskData.properties.state || taskData.properties.taskStatus;
                taskState = (state.charAt(0).toUpperCase() + state.substr(1).toLowerCase()).replaceAll('_', ' ');
            } else {
                taskState = this.taskingManagerStatus[ taskData.properties.state ];
            }

            status = taskState ? taskState : this.timeoutTasks.includes( taskId ) ? 'Timed out' : '';
        } else {
            // If state is an option in tasking manager, set the task to this new state
            const value = Object.values( this.taskingManagerStatus ).indexOf( status );
            if ( value > -1 ) {
                taskData.properties.state = Object.keys( this.taskingManagerStatus )[ value ];
            }
        }

        taskContainer.attr( 'status', status );
        taskContainer.select( '.task-status' ).text( status );

        return status;
    }

    executeTask( task, syncCheck ) {
        let mapId = this.currentProject.properties.hootMapId || this.currentProject.properties.hoot_map_id;
        let coordinates = polyStringFromGeom( task );
        const taskId = task.id || task.properties.taskId;
        let params = {
            uploadResult: true
        };

        if ( !syncCheck ) {
            const deriveType = this.isDeriveSelected();
            if ( !deriveType ) { return; }

            params.deriveType = deriveType;
        }

        const data = {
            bounds: coordinates,
            taskInfo: `taskingManager:${ this.currentProject.id }_${ taskId }`,
            customQuery : this.customQuery,
            ADV_OPTIONS: this.ADV_OPTIONS,
            comment: this.currentProject.properties.changesetComment || ''
        };

        if ( mapId && mapId > -1 && Hoot.layers.findBy( 'id', mapId )) {
            switch ( params.deriveType ) {
                case 'Adds only': {
                    data.input1 = mapId;
                    break;
                }
                case 'Cut & Replace': {
                    data.input2 = mapId;
                    params.replacement = true;
                    break;
                }
                case 'Differential': {
                    data.input2 = mapId;
                    break;
                }
                case 'Differential w/Tags': {
                    data.APPLY_TAGS = true;
                    data.input2 = mapId;
                    break;
                }
            }
        }

        this.setTaskStatus( taskId, 'Running' );

        let executeCommand;
        if ( syncCheck ) {
            this.setTaskStatus( taskId, 'Waiting for Overpass to sync' );
            executeCommand = Hoot.api.overpassSyncCheck( `${ this.currentProject.id }_${ taskId }` );
        } else {
            executeCommand = Hoot.api.deriveChangeset( data, params );
        }

        return executeCommand
            .then( async resp => {
                let status;

                if ( resp.status === 200 ) {
                    if ( this.tmVersion === 4 ) {
                        status = 'Conflated';
                        await Hoot.api.markTM4TaskDone( this.currentProject.id, taskId, 'CONFLATED' );
                    } else {
                        status = 'Done';
                        await Hoot.api.markTaskDone( this.currentProject.id, taskId );
                    }
                } else {
                    await this.refreshTimeoutTaskList();

                    if ( this.timeoutTasks.includes( taskId ) ) {
                        Hoot.message.alert( resp );
                        this.setTaskStatus( taskId, 'Timed out' );
                        this.lockedTaskButtons( taskId );
                        resp.status = 502; //set status to gateway timeout
                        return resp;
                    } else {
                        status = 'Partially conflated';

                        let validateRequest;
                        if ( this.tmVersion === 4 ) {
                            validateRequest = Hoot.api.markTM4TaskDone( this.currentProject.id, taskId, 'PARTIALLY_CONFLATED' );
                        } else {
                            const formData = new FormData();
                            formData.set( 'comment', 'Hootenanny failure' );
                            formData.set( 'invalidate', 'true' );
                            validateRequest = Hoot.api.validateTask( this.currentProject.id, taskId, formData );
                        }

                        validateRequest.then( resp => {
                                const alert = {
                                    message: resp.msg,
                                    type: resp.success ? 'success' : 'error'
                                };

                                Hoot.message.alert( alert );
                            } );

                        resp.message += ' Check the jobs panel if you want to download the diff-error file.';
                    }
                }
                Hoot.message.alert( resp );
                this.setTaskStatus( taskId, status );
                this.unlockedTaskButtons( taskId );

                return resp;
            } )
            .catch( err => {
                console.error( err );

                const errMessage =  {
                    message : err.data || `${ params.deriveType } changeset failed`,
                    status  : err.status,
                    type    : err.type
                };

                Hoot.message.alert( errMessage );
            });
    }

    lockedTaskButtons( taskId ) {
        const container = this.tasksContainer.select( `#task_${ taskId }` ).select( '.taskingManager-action-buttons' );
        container.selectAll( 'button' ).remove();

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Unlock' )
            .on( 'click', (d3_event, task) => this.setLockState( task, false ) );

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Run' )
            .on( 'click', async task => {
                this.executeTask( task );
            });

        if ( this.timeoutTasks.includes(taskId) ) {
            container.append( 'button' )
                .classed( 'primary text-light', true )
                .text( 'Resume' )
                .on( 'click', async task => {
                    this.executeTask( task, true );
                });
        }
    }

    unlockedTaskButtons( taskId ) {
        const container = this.tasksContainer.select( `#task_${ taskId }` ).select( '.taskingManager-action-buttons' );
        container.selectAll( 'button' ).remove();

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Lock' )
            .on( 'click', (d3_event, task) => this.setLockState( task, true ) );
    }

    setLockState( task, lockStatus ) {
        let taskLock, taskId;

        if ( this.tmVersion === 4 ) {
            taskId = task.properties.taskId;
            taskLock = Hoot.api.setTM4TaskLock( this.currentProject.id, taskId, lockStatus );
        } else {
            taskId = task.id;
            taskLock = Hoot.api.setTaskLock( this.currentProject.id, taskId, lockStatus );
        }

        return taskLock.then( resp => {
                Hoot.message.alert(resp);

                if ( resp.type === 'success' ) {
                    if ( lockStatus ) {
                        this.lockedTaskButtons( taskId );
                        this.setTaskStatus( taskId, 'Locked' );
                    } else {
                        this.unlockedTaskButtons( taskId );
                        this.setTaskStatus( taskId, '' );
                    }
                }
            } );
    }

    async sleep( milliseconds ) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async runTasks( taskList ) {
        const deriveType = this.isDeriveSelected();
        if ( !deriveType ) { return; }

        this.setupCancelBtn();

        const myList = taskList.nodes();

        for ( const container of myList ) {
            if ( this.cancelRunning ) {
                break;
            }

            const task = d3.select( container ).select( '.taskingManager-action-buttons' ).datum();

            await this.setLockState( task, true );
            const response = await this.executeTask( task, this.timeoutTasks.includes( task.id ) );

            // When timeout occurs we have to stop
            // to ensure that next task data pulled is not stale
            // We also halt on partially conflated tasks so the diff-error osc can be manually applied
            if ( response.status === 502 || response.status === 500 ) {
                await this.refreshTimeoutTaskList();
                break;
            }
        }

        this.setupRunAllBtn();
    }

    runAllOptionsModal() {
        const options = [ 'Ready', 'Partially conflated' ];

        let metadata = {
            title: 'Task Filter',
            button: {
                text: 'Submit',
                id: 'SubmitBtn',
                disabled: null,
                onClick: () => {
                    const selectedOptions = options.filter( option => {
                        return container.select( `#${ option.replaceAll(' ', '_') }` ).property( 'checked' );
                    } );

                    const unRunTasks = this.tasksTable.selectAll( '.taskingManager-item' ).filter( function() {
                        const container = d3.select( this );
                        return selectedOptions.includes( container.attr( 'status' ) );
                    } );

                    this.runTasks( unRunTasks );
                    optionsForm.remove();
                }
            }
        };

        const optionsForm = new FormFactory().generateForm( 'body', 'runAllTasksFilter', metadata );
        this.submitButton = d3.select( `#${ metadata.button.id }` );

        const container = optionsForm
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'button-wrap user-input', true );

        options.forEach( option => {
            container.append( 'label' )
                .classed( 'pad0y', true )
                .text( option )
                    .append( 'input' )
                    .attr( 'id', option.replaceAll(' ', '_') )
                    .attr( 'type', 'checkbox' )
                    .property( 'checked', true );

        } );
    }

    setupRunAllBtn() {
        this.cancelRunning = false;

        this.tasksContainer.select( '.runAllBtn' )
            .property( 'disabled', false )
            .text( this.timeoutTasks.length > 0 ? 'Resume' : 'Run all' )
            .on( 'click', () => {
                let containsLocked = this.tasksTable.select( '[status="Locked"]' ).empty();
                if ( containsLocked ) {
                    this.runAllOptionsModal();
                } else {
                    let alert = {
                        message: 'All tasks need to be unlocked.',
                        type: 'error'
                    };

                    Hoot.message.alert( alert );
                }
            } );
    }

    setupCancelBtn() {
        const tmPanel = this;

        this.tasksContainer.select( '.runAllBtn' )
            .text( 'Cancel' )
            .on( 'click', function() {
                tmPanel.cancelRunning = true;

                d3.select( this ).property( 'disabled', true );
            } );
    }

    async refreshTimeoutTaskList() {
        const tasksRequest = await Hoot.api.getTimeoutTasks( this.currentProject.id );
        this.timeoutTasks = tasksRequest.data;
    }

    async loadTaskTable( project ) {
        this.loadingState( this.tasksContainer, true );
        this.tasksContainer.classed( 'hidden', false );

        const tmPanel = this;
        this.tasksTable.selectAll( '.taskingManager-item' ).remove();
        this.tasksContainer.select( '.changeset-control' ).remove();
        this.currentProject = project;

        this.tasksContainer.select( '.taskHeader-title' )
            .text( `#${ this.currentProject.id } ${ this.currentProject.properties.name }`);

        let tasksList;
        if ( this.tmVersion === 4 ) {
            tasksList = await Hoot.api.getTM4Tasks( this.currentProject.id );
            // store the changeset comment
            this.currentProject.properties.changesetComment = tasksList.changesetComment;
            tasksList = tasksList.tasks;
            tasksList.features.sort( (a, b) => (a.properties.taskId > b.properties.taskId) ? 1 : -1 );
        } else {
            tasksList = await Hoot.api.getTMTasks( this.currentProject.id );
            tasksList.features.sort( (a, b) => (a.id > b.id) ? 1 : -1 );
        }

        await this.refreshTimeoutTaskList();

        let items = this.tasksTable.selectAll( '.taskingManager-item' )
            .data( tasksList.features );

        items.exit().remove();

        items = items.enter()
            .append( 'div' )
            .attr( 'id', d => {
                const taskId = d.id || d.properties.taskId;
                return 'task_' + taskId;
            } )
            .classed( 'taskingManager-item fill-white keyline-bottom', true );

        items.append( 'div' )
            .classed( 'task-title', true )
            .text( task => {
                const taskId = task.id || task.properties.taskId;
                return `Task #${ taskId }`;
            } );

        items.append( 'div' )
            .classed( 'task-status', true )
            .text( task => {
                const taskId = task.id || task.properties.taskId;
                const status = ( task.properties.locked || task.properties.lockedBy ) ? 'Locked' :
                    this.timeoutTasks.includes(taskId) ? 'Timed out' : null;

                return this.setTaskStatus( taskId, status );
            } );

        items.append( 'div' )
            .classed( 'taskingManager-action-buttons', true );

        items.each( function( task ) {
            const taskId = task.id || task.properties.taskId;
            if ( task.properties.locked || task.properties.lockedBy ) {
                tmPanel.lockedTaskButtons( taskId );
            } else {
                tmPanel.unlockedTaskButtons( taskId );
            }
        } );

        let runAllTasks = this.tasksContainer.select( '.taskHeader' )
            .selectAll( 'button.runAllBtn' )
            .data([0]);

        const enter = runAllTasks.enter()
            .append( 'button' )
            .classed( 'runAllBtn alert text-light', true )
            .text( 'Run all' )
            .property( 'disabled', !this.tasksTable.select( '[status="Running"]' ).empty() );
        this.setupRunAllBtn();

        runAllTasks.merge(enter);

        this.createDeriveDropdown();

        this.loadingState( this.tasksContainer );
    }

    loadingState( container, showLoading ) {
        const overlay = container.select( '.grail-loading' );
        overlay.remove();

        if ( showLoading ) {
            // Add overlay with spinner
            container.insert( 'div', '.modal-footer' )
                .classed('grail-loading', true);
        }
    }
}

