import Tab            from './tab';
import Filtering      from './jobs/filtering';
import Paging         from './jobs/paging';
import ProgressBar    from 'progressbar.js';
import ChangesetStats from '../modals/changesetStats';
import JobCommandInfo from '../modals/jobCommandInfo';
import GrailDatasetPicker from '../modals/grailDatasetPicker';
import { duration } from '../../tools/utilities';
import { utilKeybinding }    from '../../../util/keybinding';
import { select as d3_select } from 'd3-selection';

const getJobTypeIcon = Symbol('getJobTypeIcon');

/**
 * Creates the jobs tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Jobs extends Tab {
    constructor( instance ) {
        super( instance );

        this.keybinding = utilKeybinding('jobs');

        this.name = 'Jobs';
        this.id   = 'util-jobs';

        this.josmOsm = 'JOSM .osm';

        this.privileges = Hoot.user().privileges;

        this.params = {
            sort: '-start',
            offset: null,
            limit: 25,
            jobType: null,
            status: null,
            groupJobId: null
        };

        this.filtering = new Filtering(this);
        this.paging = new Paging(this);

        this.jobTypeIcon = {
            import: 'publish',
            export: 'get_app',
            conflate: 'layers',
            clip: 'crop',
            attributes: 'list_alt',
            basemap: 'map',
            delete: 'delete',
            derive_changeset: 'change_history',
            upload_changeset: 'cloud_upload',
            bulk_add: 'add_to_photos',
            bulk_replace: 'flip_to_front',
            bulk_differential: 'change_history',
            unknown: 'help'
        };

        this.statusIcon = {
            // running: 'autorenew',
            complete: 'check_circle_outline',
            failed: 'warning',
            cancelled: 'cancel',
            unknown: 'help'
        };

        this.columnFilters = {
            jobType: this.jobTypeIcon,
            status: this.statusIcon
        };

        this.lastClick = 0;
    }

    resetParams( reload ) {
        this.params = {
            sort: '-start',
            offset: null,
            limit: 25,
            jobType: null,
            status: null,
            groupJobId: null
        };

        if ( reload ) {
            this.updateResetFilterBtn();
            this.loadJobs();
            this.selectNone();
        }
    }

    updateResetFilterBtn() {
        let hasFilter = false;

        Object.keys( this.columnFilters ).forEach( filterOpt => {
            const param = this.params[filterOpt];
            if ( param !== null && param !== '' ) {
                hasFilter = true;
            }
        });

        hasFilter = hasFilter || !!this.params.groupJobId;

        this.panelWrapper.select( '#resetFiltersBtn' ).property( 'disabled', !hasFilter );
    }

    selectNone() {
        this.jobsHistoryTable.selectAll('tr.jobs-item')
            .classed('selected', false);
    }

    setLimit(limit) {
        this.params.limit = limit;
        this.loadJobs();
    }

    setSort(sort) {
        this.params.sort = sort;
        this.loadJobs();
        this.selectNone();
    }

    setFilter(column, values) {
        this.params[column] = values;

        this.updateResetFilterBtn();
        this.loadJobs();
        this.selectNone();
    }

    setPage(page) {
        this.params.offset = (page - 1) * this.params.limit;
        this.loadJobs();
        this.selectNone();
    }

    getPages() {
        return Math.ceil(this.total / this.params.limit) || 1; //still need page 1 for zero results
    }

    setGroupJobId(groupJobId) {
        this.params.groupJobId = groupJobId;

        this.updateResetFilterBtn();
        this.loadJobs();
        this.selectNone();
    }

    render() {
        super.render();
        this.createJobsTable();
        this.loadJobs();
        return this;
    }

    activate() {
        this.loadJobs();
        this.poller = window.setInterval( this.loadJobs.bind(this), 5000 );

        let that = this;
        this.keybinding
            .on('⌫', (d3_event) => this.deleteJobs(d3_event, that))
            .on('⌦', (d3_event) => this.deleteJobs(d3_event, that));
        d3_select(document)
            .call(this.keybinding);
    }

    deactivate() {
        window.clearInterval(this.poller);

        this.keybinding
            .off('⌫')
            .off('⌦');
        d3_select(document)
            .call(this.keybinding);
    }

    createJobsTable() {
        this.panelWrapper
            .append( 'h3' )
            .text( 'Running Jobs' );

        this.jobsRunningTable = this.panelWrapper
            .append( 'div' )
            .classed( 'jobs-table jobs-running keyline-all fill-white', true );

        let header = this.panelWrapper
            .append( 'h3' )
            .classed( 'jobs-history', true )
            .text( 'Jobs History' );
        let pager = header.append('div')
            .classed('paging fr', true);
        this.paging.render(pager);

        header.append('button')
            .attr( 'id', 'resetFiltersBtn' )
            .property( 'disabled', true )
            .classed('resetFilters button fr primary text-light', true)
            .text( 'Reset Filters')
            .on( 'click', () => this.resetParams( true ));

        this.jobsHistoryTable = this.panelWrapper
            .append( 'div' )
            .classed( 'jobs-table jobs-history keyline-all fill-white', true );
    }

    async deleteJobs(d3_event, self) {
        function deleteJobs() {
            d3_select('#util-jobs').classed('wait', true);
            Promise.all( delIds.map( id => Hoot.api.deleteJobStatus(id)) )//rate limit?
                .then( resp => self.loadJobs() )
                .finally( () => {
                    self.selectNone();
                    d3_select('#util-jobs').classed('wait', false);
                });
        }

        let delIds = self.jobsHistoryTable.selectAll('tr.jobs-item.selected')
            .data().map(d => d.jobId);

        if (d3_event.shiftKey) { //omit confirm prompt
            deleteJobs();
        } else {
            let message = `Are you sure you want to clear the ${delIds.length} selected job records?`,
                confirm = await Hoot.message.confirm( message );

            if ( confirm ) {
                deleteJobs();
            }
        }
    }

    async loadJobs() {
        let jobsRunning = await Hoot.api.getJobsRunning();
        let jobsHistory = await Hoot.api.getJobsHistory(this.params);

        if ( jobsHistory.total > this.total ) {
            await Hoot.layers.refreshLayers();
        }
        this.total = jobsHistory.total;
        this.paging.updatePages();
        this.populateJobsHistory( jobsHistory );
        this.populateJobsRunning( jobsRunning );
    }

    [getJobTypeIcon](type) {
        return this.jobTypeIcon[type] || 'help';
    }

    populateJobsRunning( jobs ) {
        let table = this.jobsRunningTable
            .selectAll('table')
            .data([0]);
        let tableEnter = table.enter()
                .append('table');

        let thead = tableEnter
            .append('thead');
        thead.selectAll('tr')
            .data([0])
            .enter().append('tr')
            .selectAll('th')
            .data([
                'Job Type',
                'Owner',
                'Started',
                'Progress',
                'Actions'
            ])
            .enter().append('th')
            .text(d => d);

        table = table.merge(tableEnter);

        let tbody = table.selectAll('tbody')
            .data([0]);
        tbody.exit().remove();
        tbody = tbody.enter()
            .append('tbody')
            .merge(tbody);

        let rows = tbody
            .selectAll( 'tr.jobs-item' )
            .data( jobs, d => d.jobId );

        rows.exit().remove();

        let rowsEnter = rows
            .enter()
            .append( 'tr' )
            .classed( 'jobs-item keyline-bottom', true );

        rows = rows.merge(rowsEnter);

        let cells = rows.selectAll( 'td' )
            .data(d => {
                let props = [];

                //this data is an array of objects
                //  {
                //    i: [{/* array of icon props */ }],
                //    span: [{/* array of text props */ }]
                //  `}

                //Job Type
                props.push({
                    i: [{icon: this[getJobTypeIcon](d.jobType), action: () => {} }],
                    span: [{text: d.jobType.toUpperCase()}]
                });

                //Owner
                let owner = Hoot.users.getNameForId(d.userId);
                props.push({
                    span: [{text: owner}]
                });

                //Start
                props.push({
                    span: [{ text: duration(d.start, Date.now(), true) }]
                });

                //Progress bar
                props.push({
                    span: [{ text: Math.round(d.percentcomplete) + '%' }],
                    progress: [{ percent: d.percentcomplete }]
                });

                //Actions
                let actions = [];
                let user = JSON.parse( localStorage.getItem( 'user' ) );


                if (d.userId === user.id || Hoot.users.isAdmin()) {
                    //Get logging for the job
                    actions.push({
                        title: 'view log',
                        icon: 'subject',
                        action: async () => {
                            this.commandDetails = new JobCommandInfo(d.jobId, true);
                            this.commandDetails.render();

                            Hoot.events.once( 'modal-closed', () => {
                                this.commandDetails.deactivate();
                                delete this.commandDetails;
                            });
                        }
                    });

                    //Add a cancel button
                    actions.push({
                        title: 'cancel job',
                        icon: 'cancel',
                        action: async () => {
                            let message = 'Are you sure you want to cancel this job?',
                            confirm = await Hoot.message.confirm( message );

                            if ( confirm ) {
                                d3_select('#util-jobs').classed('wait', true);
                                Hoot.api.cancelJob(d.jobId)
                                    .then( resp => this.loadJobs() )
                                    .finally( () => d3_select('#util-jobs').classed('wait', false));
                            }
                        }
                    });
                }

                props.push({
                    i: actions
                });

                return props;
            });

        cells.exit().remove();

        let cellsEnter = cells
            .enter().append( 'td' )
            .classed('progress', d => d.progress);

        cells = cells.merge(cellsEnter);

        let i = cells.selectAll( 'i' )
            .data( d => (d.i) ? d.i : [] );
        i.exit().remove();
        i.enter().insert('i', 'span')
            .classed( 'material-icons', true )
            .merge(i)
            .text( d => d.icon )
            .attr('title', d => d.title )
            .on('click', d => d.action());

        let progressbar = cells.selectAll('div')
            .data( d => (d.progress) ? d.progress : [] );
        progressbar.exit().remove();
        let pgEnter = progressbar.enter().append('div')
            .classed('job-progress', true);
        pgEnter.each(function(d) {
            let pb = new ProgressBar.Line(this, {
                color: 'rgb(112, 146, 255)',
                strokeWidth: 3,
                trailWidth: 1,
            });
            pb.animate(d.percent / 100);
            //I feel yucky doing this, but need
            //the ref in the merge below
            this.pb = pb;
        });

        progressbar.merge(pgEnter)
            .each( function(d) {
                this.pb.animate(d.percent / 100);
            });


        let span = cells.selectAll('span')
            .data( d => (d.span) ? d.span : [] );
        span.exit().remove();
        span.enter().append('span')
            .merge(span)
            .text( d => d.text );

    }


    populateJobsHistory( jobs ) {
        // if you're on a page that no longer has data, go to last page with data
        if ( jobs.total > 0 && jobs.jobs.length === 0 && (this.paging.getCurrentPage() >= this.getPages() )
            // or your current page is greater than the number of pages
            // like when you change the page size from the last page
            || ( this.paging.getCurrentPage() > this.getPages()) ) {
            this.paging.setPage( this.getPages() );
        }

        const columnInfo = [
            { column: 'jobType', label: 'Job Type', sort: 'type' },
            { label: 'Information' },
            { column: 'status', label: 'Status', sort: 'status' },
            { label: 'Started', sort: 'start' },
            { label: 'Duration', sort: 'duration' },
            { label: 'Actions' }
        ];

        let that = this;
        let table = this.jobsHistoryTable
            .selectAll('table')
            .data([0]);
        let tableEnter = table.enter()
                .append('table');

        let colGroup = tableEnter.append( 'colgroup' );
        columnInfo.forEach( col => {
            colGroup.append( 'col' )
                .style( 'width', col.width );
        });

        let thead = tableEnter
            .append('thead');
        let th = thead.selectAll('tr')
            .data([0])
            .enter().append('tr')
            .selectAll('th')
            .data(columnInfo)
            .enter().append('th')
            .classed('sort', d => d.sort)
            .classed('filter', d => this.columnFilters[d.column])
            .on('click', d => {
                if (d.sort) {
                    let dir = (this.params.sort || '').slice(0,1),
                        col = (this.params.sort || '').slice(1),
                        newSort;

                    if (col === d.sort) {
                        newSort = ((dir === '+') ? '-' : '+') + col;
                    } else {
                        newSort = '-' + d.sort;
                    }

                    this.setSort(newSort);
                }
            })
            .on('contextmenu', openFilter);

        function openFilter(d3_event, d) {
            d3_event.stopPropagation();
            d3_event.preventDefault();

            if (that.columnFilters[d.column]) {
                let filterData = {
                    label: d.column[0].toUpperCase() + d.column.slice(1).split(/(?=[A-Z])/).join(' '),
                    column: d.column,
                    selected: that.params[d.column],
                    values: Object.entries(that.columnFilters[d.column])
                };

                that.filtering.render(d3_event, filterData);
            }
        }

        th.append('span')
            .text(d => d.label);

        th.each(function(d) {
            if (that.columnFilters[d.column]) {
                d3_select(this).append('i')
                    .classed( 'filter material-icons', true )
                    .text('menu_open')
                    .attr('title', 'filter')
                    .on('click', openFilter);
            }
        });

        th.append('i')
            .classed( 'sort material-icons', true );

        table.selectAll('i.sort')
            .text(d => {
                let dir = (this.params.sort || '').slice(0,1),
                    col = (this.params.sort || '').slice(1);

                if (col === d.sort) {
                    return ((dir === '+') ? 'arrow_drop_up' : 'arrow_drop_down');
                }
                return '';
            })
            .attr('title', 'sort');

        table = table.merge(tableEnter);

        let tbody = table.selectAll('tbody')
            .data([0]);
        tbody.exit().remove();
        tbody = tbody.enter()
            .append('tbody')
            .merge(tbody);

        let rows = tbody
            .selectAll( 'tr.jobs-item' )
            .data( jobs.jobs );

        rows.exit().remove();

        let rowsEnter = rows
            .enter()
            .append( 'tr' )
            .classed( 'jobs-item keyline-bottom', true )
            .on('click', function(d3_event, d, i) {
                let r = d3_select(this);
                if (d3_event.ctrlKey || d3_event.metaKey) {
                    //Toggle current row
                    r.classed('selected', !r.classed('selected'));
                    that.lastClick = i;
                } else if (d3_event.shiftKey) {
                    //Unselect everything
                    tbody.selectAll('tr').classed('selected', false);

                    //Select all rows between this and last click selected
                    let min = Math.min(that.lastClick, i);
                    let max = Math.max(that.lastClick, i);
                    tbody.selectAll('tr')
                        .each(function(r, k) {
                            if (min <= k && k <= max) {
                                d3_select(this).classed('selected', true);
                            }
                        });
                } else {
                    //Unselect everything
                    tbody.selectAll('tr').classed('selected', false);

                    //Select current row
                    r.classed('selected', true);
                    that.lastClick = i;
                }
            });

        rows = rows.merge(rowsEnter);

        let cells = rows.selectAll( 'td' )
            .data(d => {
                let props = [];

                //this data is an array of objects
                //  {
                //    i: [{/* array of icon props */ }],
                //    span: [{/* array of text props */ }]
                //  `}

                //Job Type
                props.push({
                    i: [{icon: this[getJobTypeIcon](d.jobType)}],
                    span: [{text: d.jobType.toUpperCase()}]
                });

                let map = Hoot.layers.findBy( 'id', d.mapId ),
                    jobInfo = [],
                    jobTags = d.tags;

                if ( jobTags ) {
                    let inputInfo = '',
                        outputInfo = '';

                    // Set input info
                    if ( jobTags.taskInfo ) {
                        inputInfo += jobTags.taskInfo;
                    } else if ( jobTags.input1 || jobTags.input2 ) {
                        let input1 = Hoot.layers.findBy( 'id', parseInt(jobTags.input1, 10) ),
                            input2 = Hoot.layers.findBy( 'id', parseInt(jobTags.input2, 10) );

                        inputInfo += input1 ? input1.name : '';
                        inputInfo += input2 ? ' • ' + input2.name : '';
                    } else if ( jobTags.bounds ){
                        inputInfo += jobTags.bounds;
                    } else if ( jobTags.parentId ) {
                        inputInfo += jobTags.parentId;
                    }

                    if ( inputInfo !== '' ) {
                        jobInfo.push( inputInfo );
                    }

                    // used for showing conflation type if exists
                    if ( jobTags.conflationType ) {
                        jobInfo.push( jobTags.conflationType + ' conflation' );
                    }

                    // Set output info
                    if ( map ) {
                        outputInfo += map.name;
                    } else if ( jobTags && jobTags.deriveType ) {
                        outputInfo += jobTags.deriveType;
                    }

                    // Set export info
                    if ( jobTags.outputname ) {
                        outputInfo += jobTags.outputname;
                        if ( jobTags.outputtype ) {
                            outputInfo += '.' + jobTags.outputtype;
                        }
                    }

                    // Set delete info
                    if ( jobTags.layername ) {
                        outputInfo += jobTags.layername;
                    }

                    if ( outputInfo !== '' ) {
                        jobInfo.push( outputInfo );
                    }
                }

                const jobInfoTitle = jobInfo.join( ' ➜ ' );
                const jobInfoText = jobInfoTitle.length > 100 ? jobInfoTitle.substr(0, 100) + '...' : jobInfoTitle;
                // Job Info
                props.push({
                    span: [{
                        text: jobInfoText,
                        title: jobInfoTitle
                    }]
                });

                //Status
                let statusIcon = this.statusIcon[d.status] || 'help';

                if (d.status === 'failed') {
                    props.push({
                        i: [{
                            icon: statusIcon,
                            title: 'show error',
                            action: () => {
                                Hoot.api.getJobError(d.jobId)
                                    .then( resp => {
                                        let type = 'error';
                                        let message = resp.errors.join('\n');
                                        Hoot.message.alert( { message, type } );
                                    } );
                            }
                        }]
                    });
                } else {
                    props.push({
                        i: [{ icon: statusIcon }]
                    });
                }

                //Start
                props.push({
                    span: [{text: duration(d.start, Date.now(), true) }]
                });

                //Duration
                props.push({
                    span: [{text: duration(d.start, d.end) }]
                });

                //Actions
                let actions = [];

                //Get logging for the job
                actions.push({
                    title: 'view log',
                    icon: 'subject',
                    action: async () => {
                        this.commandDetails = new JobCommandInfo(d.jobId);
                        this.commandDetails.render();

                        Hoot.events.once( 'modal-closed', () => delete this.commandDetails );
                    }
                });

                actions.push({
                    title: 'show related',
                    icon: 'linear_scale',
                    action: () => {
                        this.setGroupJobId( d.jobId );
                    }
                });

                if (map) {

                    let refLayer = Hoot.layers.findLoadedBy('refType', 'primary') ? 2 : 0;
                    let secLayer = Hoot.layers.findLoadedBy('refType', 'secondary') ? 1 : 0;
                    let refType;
                    //use bitwise comparison to see which layers are already loaded
                    switch (refLayer | secLayer) {
                        case 0:
                        case 1:
                            refType = 'reference';
                            break;
                        case 2:
                            refType = 'secondary';
                            break;
                        case 3:
                        default:
                            refType = null;
                            break;
                    }

                    if (refType) {
                        //Add to map
                        actions.push({
                            title: `add to map as ${refType}`,
                            icon: 'add_circle_outline',
                            action: () => {
                                let params = {
                                    name: map.name,
                                    id: d.mapId
                                };

                                Hoot.ui.sidebar.forms[ refType ].submitLayer( params )
                                    .then( () => {
                                        let message = `${refType} layer added to map: <u>${map.name}</u>`,
                                            type    = 'info';

                                        Hoot.message.alert( { message, type } );

                                        this.loadJobs();
                                    } );
                            }
                        });
                    }

                }

                // Only advanced user may perform these
                if (this.privileges && this.privileges.advanced === 'true') {

                    // If the upload changeset job is marked having conflicts
                    // add action to download conflicted changes
                    if (//d.statusDetail.toUpperCase() === 'CONFLICTS' &&
                        (d.jobType.toUpperCase() === 'UPLOAD_CHANGESET' || d.jobType.toUpperCase().includes('BULK'))) {

                        actions.push({
                            title: 'download conflicted changes',
                            icon: 'archive',
                            action: async () => {
                                const name = d.jobType.toUpperCase().includes('BULK') ? d.jobId : d.tags.parentId;
                                let param = {
                                    input: name,
                                    inputtype: 'changesets',
                                    outputname: name,
                                    outputtype: 'zip'
                                };

                                Hoot.api.exportDataset(param)
                                    .then( resp => {
                                        self.jobId = resp.data.jobid;

                                        return Hoot.api.statusInterval( self.jobId );
                                    } )
                                    .then( async resp => {
                                        if (resp.data && resp.data.status !== 'cancelled') {
                                            await Hoot.api.saveDataset( self.jobId, param.outputname );
                                        }
                                        return resp;
                                    } )
                                    .catch( err => {
                                        console.error(err);
                                        Hoot.message.alert( err );
                                        return false;
                                    } );
                            }
                        });

                    }

                    // If the changeset is not stale (i.e. has already been applied)
                    if (d.statusDetail.toUpperCase() !== 'STALE') {

                        // Add action for upload of changeset
                        if (d.jobType.toUpperCase() === 'DERIVE_CHANGESET'
                            && d.tags.deriveType !== this.josmOsm) {//can't upload JOSM osm xml
                            actions.push({
                                title: 'upload changeset',
                                icon: 'cloud_upload',
                                action: async () => {
                                    Hoot.api.changesetStats(d.jobId)
                                        .then( resp => {
                                            this.changesetStats = new ChangesetStats( d, resp.data ).render();

                                            Hoot.events.once( 'modal-closed', () => delete this.changesetStats );
                                        } )
                                        .catch( err => {
                                            console.error(err);
                                            Hoot.message.alert( err );
                                            return false;
                                        } );
                                }
                            });
                        }

                        // For Conflate jobs add action to derive changeset
                        if (d.jobType.toUpperCase() === 'CONFLATE') {
                            let currentLayer = Hoot.layers.findBy( 'id', d.mapId );

                            if (currentLayer && currentLayer.grailMerged) {
                                //Derive a changeset as JOSM osm xml with action attibutes
                                actions.push({
                                    title: `derive ${this.josmOsm.toLowerCase()}`,
                                    icon: 'edit_location_alt',
                                    action: async () => {
                                        const tagsInfo = await Hoot.api.getMapTags(currentLayer.id);

                                        const data  = {};
                                        data.input1 = parseInt(tagsInfo.input1, 10);
                                        data.input2 = d.mapId;
                                        data.parentId = d.jobId;
                                        data.output = tagsInfo.params.OUTPUT_NAME;

                                        if (currentLayer.bounds) { data.bounds = currentLayer.bounds; }
                                        if ( d.tags && d.tags.taskInfo ) { data.taskInfo = d.tags.taskInfo; }

                                        const params = {
                                            deriveType : this.josmOsm
                                        };

                                        Hoot.api.deriveChangeset( data, params )
                                            .then( resp => Hoot.message.alert( resp ) );
                                    }
                                });
                                //Derive a changeset as osmChange .osc
                                actions.push({
                                    title: 'derive changeset',
                                    icon: 'change_history',
                                    action: async () => {
                                        const tagsInfo = await Hoot.api.getMapTags(currentLayer.id);

                                        const data  = {};
                                        data.input1 = parseInt(tagsInfo.input1, 10);
                                        data.input2 = d.mapId;
                                        data.parentId = d.jobId;

                                        if (currentLayer.bounds) { data.bounds = currentLayer.bounds; }
                                        if ( d.tags && d.tags.taskInfo ) { data.taskInfo = d.tags.taskInfo; }

                                        const params = {
                                            deriveType : 'Merged changeset'
                                        };

                                        Hoot.api.deriveChangeset( data, params )
                                            .then( resp => Hoot.message.alert( resp ) );
                                    }
                                });
                            }
                        }

                        // For conflate or import or clip jobs add action for
                        // creating an adds-only changeset
                        // or a replacement changeset
                        if (d.jobType.toUpperCase() === 'CONFLATE'
                            || d.jobType.toUpperCase() === 'IMPORT'
                            || d.jobType.toUpperCase() === 'CLIP'
                            ) {
                            let currentLayer = Hoot.layers.findBy( 'id', d.mapId );

                            if (currentLayer && !currentLayer.grailReference) {
                                actions.push({
                                    title: 'derive changeset [adds only]',
                                    icon: 'add_to_photos',
                                    action: async () => {
                                        const data  = {};
                                        data.input1 = d.mapId;
                                        data.parentId = d.jobId;
                                        if ( d.tags && d.tags.taskInfo ) { data.taskInfo = d.tags.taskInfo; }

                                        const params = {
                                            deriveType : 'Adds only'
                                        };

                                        Hoot.api.deriveChangeset( data, params )
                                            .then( resp => Hoot.message.alert( resp ) );
                                    }
                                });

                                actions.push({
                                    title: 'derive changeset replacement',
                                    icon: 'flip_to_front',
                                    action: async () => {
                                        const params = {
                                            deriveType : 'Cut & Replace'
                                        };
                                        if ( d.tags && d.tags.taskInfo ) {
                                            params.taskInfo = d.tags.taskInfo;
                                        }

                                        let gpr = new GrailDatasetPicker(currentLayer, d.jobId, params);
                                        gpr.render();
                                    }
                                });
                            }
                        }
                    }

                    // Add action for download of changeset
                    // users can do this even after the changeset has been applied
                    if (d.jobType.toUpperCase() === 'DERIVE_CHANGESET') {

                        if (d.statusDetail.toUpperCase() === 'STALE') {
                            actions.push({
                                title: 'view changeset stats',
                                icon: 'library_books',
                                action: async () => {
                                    Hoot.api.changesetStats(d.jobId)
                                        .then( resp => {
                                            this.changesetStats = new ChangesetStats( d, resp.data, true ).render();

                                            Hoot.events.once( 'modal-closed', () => delete this.changesetStats );
                                        } )
                                        .catch( err => {
                                            console.error(err);
                                            Hoot.message.alert( err );
                                            return false;
                                        } );
                                }
                            });
                        }

                        //download changeset
                        actions.push({
                            title: 'download changeset',
                            icon: 'archive',
                            action: async () => {
                                Hoot.api.saveChangeset( d.jobId,
                                    (d.tags.deriveType === this.josmOsm) ? d.tags.output : 'diff',
                                    (d.tags.deriveType === this.josmOsm) ? 'osm' : 'osc')
                                    .catch( err => {
                                        console.error(err);
                                        Hoot.message.alert( err );
                                        return false;
                                    } );
                            }
                        });

                        //open in josm
                        if (d.tags.deriveType === this.josmOsm) {
                            actions.push({
                                title: 'open in josm',
                                icon: 'map',
                                action: async () => {
                                    Hoot.api.openExportInJosm( d.jobId,
                                        (d.tags.deriveType === this.josmOsm) ? d.tags.output : 'diff',
                                        (d.tags.deriveType === this.josmOsm) ? 'osm' : 'osc')
                                        .catch( err => {
                                            console.error(err);
                                            Hoot.message.alert( err );
                                            return false;
                                        } );
                                }
                            });
                        }
                    }

                }

                // Add action for download of export if the job status has the output name recorded
                // users can then do this after initial download that occurs when the export job completes
                if (d.jobType.toUpperCase() === 'EXPORT' && d.tags && d.tags.outputname ) {
                    actions.push({
                        title: 'download export',
                        icon: 'get_app',
                        action: async () => {
                            Hoot.api.saveDataset( d.jobId, d.tags.outputname + '.' + d.tags.outputtype )
                                .catch( err => {
                                    // console.error(err);
                                    if (!err.message) {
                                        err.message = 'Export file not found.';
                                    }
                                    Hoot.message.alert( err );
                                    return false;
                                } );
                        }
                    });
                    actions.push({
                        title: 'open in josm',
                        icon: 'map',
                        action: async () => {
                            Hoot.api.openExportInJosm( d.jobId, d.tags.outputname, d.tags.outputtype )
                                .catch( err => {
                                    console.error(err);
                                    Hoot.message.alert( err );
                                    return false;
                                } );
                        }
                    });
                }

                props.push({
                    i: actions
                });

                return props;
            });

        cells.exit().remove();

        let cellsEnter = cells
            .enter().append( 'td' );

        cells = cells.merge(cellsEnter);

        let i = cells.selectAll( 'i' )
            .data( d => (d.i) ? d.i : [] );
        i.exit().remove();
        i.enter().insert('i', 'span')
            .classed( 'material-icons', true )
            .classed( 'action', d => d.action)
            .merge(i)
            .text( d => d.icon )
            .attr('title', d => d.title )
            .on('click', d => {
                if ( d.action ) {
                    d.action();
                }
            });

        let span = cells.selectAll('span')
            .data( d => (d.span) ? d.span : [] );
        span.exit().remove();
        span.enter().append('span')
            .merge(span)
            .attr( 'title', d => d.title ? d.title : '' )
            .text( d => d.text );

    }

}
