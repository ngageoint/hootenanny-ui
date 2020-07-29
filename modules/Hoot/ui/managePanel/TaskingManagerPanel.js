import Tab from './tab';
import { geoExtent as GeoExtent } from '../../../geo';
import { d3combobox } from '../../../lib/hoot/d3.combobox';
import FormFactory from '../../tools/formFactory';

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
        this.currentProject = null;
        this.formFactory = new FormFactory();

        this.deriveTypeOpts = {
            name: 'deriveType',
            readonly: 'readonly',
            options: [
                { deriveType: 'Adds only', description: `Add all data from ${Hoot.config.secondaryLabel} in the specified area into ${Hoot.config.referenceLabel}` },
                { deriveType: 'Cut & Replace', description: `Replace the ${Hoot.config.referenceLabel} data in this region with ${Hoot.config.secondaryLabel} data` },
                { deriveType: 'Differential', description: `Add the features from ${Hoot.config.secondaryLabel} that don't exist in ${Hoot.config.referenceLabel}` }
            ]
        };

        // what tasking manager state number stands for
        this.taskingManagerStatus = {
            1: 'Invalidated',
            2: 'Done',
            3: 'Validated'
        };

        // trigger for run all tasks loop to stop
        this.cancelRunning = false;
    }

    render() {
        super.render();

        // fire off the request but don't wait for it so we don't hold up the UI from being rendered
        this.projectList = Hoot.api.getTMProjects();
        this.createTables();

        this.initCutReplaceForm();

        return this;
    }

    async initCutReplaceForm() {
        // form for cut and replace options
        this.cutReplaceOptions = {
            title: 'Options',
            form: [],
            button: {
                text: 'Done',
                id: 'DoneBtn',
                disabled: null,
                onClick: () => {
                    this.ADV_OPTIONS = this.formFactory.getAdvOpts(this.form, advOpts);
                    if ( this.form ) this.form.remove();
                }
            }
        };

        //Add advanced options to form
        const advOpts = await Hoot.api.getAdvancedChangesetOptions();
        this.cutReplaceOptions.form = this.cutReplaceOptions.form.concat(advOpts.map(this.formFactory.advOpt2DomMeta));

    }

    async activate() {
        // await for the list
        this.projectList = await this.projectList;

        if ( this.projectList ) {
            this.projectList.features = this.projectList.features.filter( task => task.properties.hoot_map_id );

            this.loadProjectsTable( this.projectList.features );
        }
    }

    createTables() {
        const projectsDiv = this.panelWrapper.append( 'div' )
            .classed( 'taskingManager-projects', true );
        projectsDiv.append( 'h3' )
            .text( 'Tasking Manager Projects' );

        this.projectsTable = projectsDiv.append( 'div' )
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

    loadProjectsTable( projects ) {
        let items = this.projectsTable.selectAll( '.taskingManager-item' )
            .data( projects );

        items.exit().remove();

        items = items.enter()
            .append( 'div' )
            .attr( 'id', d => d.id )
            .classed( 'taskingManager-item fill-white keyline-bottom', true );

        let header = items
            .append( 'div' )
            .classed( 'taskingManager-header flex justify-between align-center', true );
        header.append( 'div' )
            .classed( 'taskingManager-title', true )
            .append( 'a' )
            .text( project => `#${project.id} ${project.properties.name}` )
            .on( 'click', project => {
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
            let { created, author } = project.properties;
            created = new Date( created ).toLocaleDateString();

            return `Created by ${author} - Created on ${created}`;
        } );
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
                if ( this.deriveDropdown.property( 'value' ) === 'Cut & Replace' ) {
                    let formId = 'cutReplaceForm';
                    this.form  = this.formFactory.generateForm( 'body', formId, this.cutReplaceOptions );
                } else {
                    // currently only cut & replace will have advanced options so clear it when other option is selected
                    this.ADV_OPTIONS = null;
                }

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
            let taskState = this.taskingManagerStatus[ taskData.properties.state ];
            status = taskState ? taskState : '';
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

    executeTask( task ) {
        const deriveType = this.isDeriveSelected();
        if ( !deriveType ) { return; }

        let coordinates = task.geometry.coordinates[0][0];
        let extLayer = new GeoExtent([ coordinates[0][0], coordinates[0][1] ], [ coordinates[2][0], coordinates[2][1] ]);

        const params = {
            deriveType: deriveType,
            uploadResult: true
        };

        const data = {
            BBOX: extLayer.toParam(),
            taskInfo: `taskingManager:${ this.currentProject.id }_${ task.id }`,
            ADV_OPTIONS: this.ADV_OPTIONS
        };

        this.setTaskStatus( task.id, 'Running' );

        return Hoot.api.deriveChangeset( data, params )
            .then( async resp => {
                Hoot.message.alert( resp );
                let status;

                if ( resp.status === 200 ) {
                    status = 'Done';

                    await Hoot.api.markTaskDone( this.currentProject.id, task.id );
                } else {
                    status = 'Invalidated';

                    const formData = new FormData();
                    formData.set( 'comment', 'Hootenanny failure' );
                    formData.set( 'invalidate', 'true' );

                    await Hoot.api.validateTask( this.currentProject.id, task.id, formData )
                        .then( resp => {
                            const alert = {
                                message: resp.msg,
                                type: resp.success ? 'success' : 'error'
                            };

                            Hoot.message.alert( alert );
                        } );
                }

                this.setTaskStatus( task.id, status );
                this.unlockedTaskButtons( task.id );
            } );
    }

    lockedTaskButtons( taskId ) {
        const container = this.tasksContainer.select( `#task_${ taskId }` ).select( '.taskingManager-action-buttons' );
        container.selectAll( 'button' ).remove();

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Unlock' )
            .on( 'click', task => this.setLockState( task, false ) );

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Run' )
            .on( 'click', task => {
                this.executeTask( task );
            });
    }

    unlockedTaskButtons( taskId ) {
        const container = this.tasksContainer.select( `#task_${ taskId }` ).select( '.taskingManager-action-buttons' );
        container.selectAll( 'button' ).remove();

        container.append( 'button' )
            .classed( 'primary text-light', true )
            .text( 'Lock' )
            .on( 'click', task => this.setLockState( task, true ) );
    }

    setLockState( task, lockStatus ) {
        return Hoot.api.setTaskLock( this.currentProject.id, task.id, lockStatus )
            .then( resp => {
                Hoot.message.alert(resp);

                if ( resp.type === 'success' ) {
                    if ( lockStatus ) {
                        this.lockedTaskButtons( task.id );
                        this.setTaskStatus( task.id, 'Locked' );
                    } else {
                        this.unlockedTaskButtons( task.id );
                        this.setTaskStatus( task.id, '' );
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

        this.tasksContainer.select( '.runAllBtn' );
        this.setupCancelBtn();

        const myList = taskList.nodes();
        let onfirstJob = true;

        for ( const container of myList ) {
            if ( this.cancelRunning ) {
                break;
            }

            // Needed to allow newly pushed data to sync before working on next task
            // Adds only doesnt rely on recently pushed data so dont need to wait for that
            if ( !onfirstJob && deriveType !== 'Adds only' ) {
                await this.sleep( Hoot.api.runTasksInterval );
            }

            const task = d3.select( container ).select( '.taskingManager-action-buttons' ).datum();

            await this.setLockState( task, true );
            await this.executeTask( task );

            onfirstJob = false;
        }

        this.setupRunAllBtn();
    }

    setupRunAllBtn() {
        this.cancelRunning = false;

        this.tasksContainer.select( '.runAllBtn' )
            .property( 'disabled', false )
            .text( 'Run all' )
            .on( 'click', () => {
                let containsLocked = this.tasksTable.select( '[status="Locked"]' ).empty();
                const unRunTasks = this.tasksTable.selectAll( '.taskingManager-item' ).filter( function() {
                    const container = d3.select( this );
                    return container.attr( 'status' ) !== 'Done' && container.attr( 'status' ) !== 'Validated';
                } );

                if ( containsLocked ) {
                    this.runTasks( unRunTasks );
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

    async loadTaskTable( project ) {
        const tmPanel = this;
        this.tasksTable.selectAll( '.taskingManager-item' ).remove();
        this.currentProject = project;

        this.tasksContainer.select( '.taskHeader-title' )
            .text( `#${ this.currentProject.id } ${ this.currentProject.properties.name }`);

        const tasksList = await Hoot.api.getTMTasks( this.currentProject.id );
        tasksList.features.sort( (a, b) => (a.id > b.id) ? 1 : -1 );

        let items = this.tasksTable.selectAll( '.taskingManager-item' )
            .data( tasksList.features );

        items.exit().remove();

        items = items.enter()
            .append( 'div' )
            .attr( 'id', d => 'task_' + d.id )
            .classed( 'taskingManager-item fill-white keyline-bottom', true );

        items.append( 'div' )
            .classed( 'task-title', true )
            .text( task => `Task #${ task.id }` );

        items.append( 'div' )
            .classed( 'task-status', true )
            .text( task => {
                const status = task.properties.locked ? 'Locked' : null;
                return this.setTaskStatus( task.id, status );
            } );

        items.append( 'div' )
            .classed( 'taskingManager-action-buttons', true );

        items.each( function( task ) {
            if ( task.properties.locked ) {
                tmPanel.lockedTaskButtons( task.id );
            } else {
                tmPanel.unlockedTaskButtons( task.id );
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

        this.tasksContainer.classed( 'hidden', false );
    }
}

