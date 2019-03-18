
import Tab          from './tab';
import moment       from 'moment';

/**
 * Creates the jobs tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Jobs extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Jobs';
        this.id   = 'util-jobs';
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
    }

    deactivate() {
        window.clearInterval(this.poller);
    }

    createJobsTable() {
        this.panelWrapper
            .append( 'h3' )
            .text( 'Running Jobs' );
        this.jobsRunningTable = this.panelWrapper
            .append( 'div' )
            .classed( 'jobs-table jobs-running keyline-all fill-white', true );
        this.panelWrapper
            .append( 'h3' )
            .classed( 'jobs-history', true )
            .text( 'Jobs History' );
        this.jobsHistoryTable = this.panelWrapper
            .append( 'div' )
            .classed( 'jobs-table jobs-history keyline-all fill-white', true );
    }

    async loadJobs() {

        try {
            let jobsRunning = await Hoot.api.getJobsRunning();
            let jobsHistory = await Hoot.api.getJobsHistory();
            await Hoot.layers.refreshLayers();
            this.populateJobsHistory( jobsHistory );
            this.populateJobsRunning( jobsRunning );
        } catch ( e ) {
            window.console.log( 'Unable to retrieve jobs' );
            throw new Error( e );
        }
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
                'Duration',
                'Percent Complete',
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

                let typeIcon;
                switch(d.jobType) {
                    case 'import':
                        typeIcon = 'publish';
                        break;
                    case 'export':
                        typeIcon = 'get_app';
                        break;
                    case 'conflate':
                        typeIcon = 'layers';
                        break;
                    case 'clip':
                        typeIcon = 'crop';
                        break;
                    case 'attributes':
                        typeIcon = 'list_alt';
                        break;
                    case 'basemap':
                        typeIcon = 'map';
                        break;
                    case 'delete':
                        typeIcon = 'delete';
                        break;
                    case 'unknown':
                    default:
                        typeIcon = 'help';
                        break;
                }

                props.push({
                    i: [{icon: typeIcon, action: () => {} }],
                    span: [{text: d.jobType.toUpperCase()}]
                });

                let owner = Hoot.users.getNameForId(d.userId);
                props.push({
                    i: [],
                    span: [{text: owner}]
                });

                props.push({
                    i: [],
                    span: [{text: moment( d.start ).fromNow()}]
                });
                props.push({
                    i: [],
                    span: [{text: moment.duration( d.end - d.start ).humanize()}]
                });


                props.push({
                    i: [{
                        title: 'cancel job',
                        icon: 'cancel',
                        action: () => {
                            Hoot.api.cancelJob(d.jobId)
                                .then( resp => this.loadJobs() )
                                .catch( err => {
                                    // TODO: response - unable to cancel job
                                } );
                        }
                    }],
                    span: []
                });

                return props;
            });

        cells.exit().remove();

        let cellsEnter = cells
            .enter().append( 'td' );

        cells = cells.merge(cellsEnter);

        let i = cells.selectAll( 'i' )
            .data( d => d.i );
        i.exit().remove();
        i.enter().insert('i', 'span')
            .classed( 'material-icons', true )
            .merge(i)
            .text( d => d.icon )
            .attr('title', d => d.title )
            .on('click', d => d.action());

        let span = cells.selectAll('span')
            .data( d => d.span);
        span.exit().remove();
        span.enter().append('span')
            .merge(span)
            .text( d => d.text );

    }


    populateJobsHistory( jobs ) {
        let table = this.jobsHistoryTable
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
                'Output',
                'Status',
                'Started',
                'Duration',
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

                let typeIcon;
                switch(d.jobType) {
                    case 'import':
                        typeIcon = 'publish';
                        break;
                    case 'export':
                        typeIcon = 'get_app';
                        break;
                    case 'conflate':
                        typeIcon = 'layers';
                        break;
                    case 'clip':
                        typeIcon = 'crop';
                        break;
                    case 'attributes':
                        typeIcon = 'list_alt';
                        break;
                    case 'basemap':
                        typeIcon = 'map';
                        break;
                    case 'delete':
                        typeIcon = 'delete';
                        break;
                    case 'unknown':
                    default:
                        typeIcon = 'help';
                        break;
                }

                props.push({
                    i: [{icon: typeIcon, action: () => {} }],
                    span: [{text: d.jobType.toUpperCase()}]
                });

                //Handle the map name & add to map icon
                let map = Hoot.layers.findBy( 'id', d.mapId );

                if (map) {
                    let refLayer = Hoot.layers.findLoadedBy('refType', 'primary') ? 2 : 0;
                    let secLayer = Hoot.layers.findLoadedBy('refType', 'secondary') ? 1 : 0;
                    let refType;
                    //use bitwise comparison to see which layers are already loaded
                    switch(refLayer | secLayer) {
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
                        props.push({
                            i: [{
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
                            }],
                            span: [{text: map.name}]
                        });
                    } else {
                        props.push({
                            i: [],
                            span: [{text: map.name}]
                        });
                    }

                } else {
                    props.push({
                        i: [],
                        span: [{text: 'Map no longer exists'}]
                    });
                }


                let statusIcon;
                switch(d.status) {
                    case 'running':
                        statusIcon = 'autorenew';
                        break;
                    case 'complete':
                        statusIcon = 'check_circle_outline';
                        break;
                    case 'failed':
                        statusIcon = 'error';
                        break;
                    case 'cancelled':
                        statusIcon = 'cancel';
                        break;
                    case 'unknown':
                    default:
                        statusIcon = 'help';
                        break;
                }

                props.push({
                    i: [{
                        icon: statusIcon,
                        action: () => {
                            if (d.status === 'failed') {
                                Hoot.api.getJobError(d.jobId)
                                    .then( resp => {
                                        let type = 'error';
                                        let message = resp.errors.join('\n');
                                        Hoot.message.alert( { message, type } );
                                    } )
                                    .catch( err => {
                                        // TODO: response - unable to get error
                                    } );
                            }
                        }
                    }],
                    span: []
                });
                props.push({
                    i: [],
                    span: [{text: moment( d.start ).fromNow()}]
                });
                props.push({
                    i: [],
                    span: [{text: moment.duration( d.end - d.start ).humanize()}]
                });
                props.push({
                    i: [{
                        title: 'clear job',
                        icon: 'clear',
                        action: () => {
                            Hoot.api.deleteJobStatus(d.jobId)
                                .then( resp => this.loadJobs() )
                                .catch( err => {
                                    // TODO: response - unable to clear job
                                } );
                        }
                    }],
                    span: []
                });

                return props;
            });

        cells.exit().remove();

        let cellsEnter = cells
            .enter().append( 'td' );

        cells = cells.merge(cellsEnter);

        let i = cells.selectAll( 'i' )
            .data( d => d.i );
        i.exit().remove();
        i.enter().insert('i', 'span')
            .classed( 'material-icons', true )
            .merge(i)
            .text( d => d.icon )
            .attr('title', d => d.title )
            .on('click', d => d.action());

        let span = cells.selectAll('span')
            .data( d => d.span);
        span.exit().remove();
        span.enter().append('span')
            .merge(span)
            .text( d => d.text );

    }

}

