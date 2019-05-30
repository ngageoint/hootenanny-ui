import Tab            from './tab';
import dayjs from 'dayjs';
import ProgressBar    from 'progressbar.js';
import JobCommandInfo from '../modals/jobCommandInfo';

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

        this.name = 'Jobs';
        this.id   = 'util-jobs';
    }

    duration(start, end, started) {
        let duration,
            diff = dayjs(end).diff(dayjs(start), 'seconds');

        function calcDiff(diff, unit) {
            diff = Math.floor(diff);
            let calc;
            if (diff < 1) {
                calc = `less than a ${unit}`;
            } else if (diff === 1) {
                let article = unit === 'hour' ? 'an' : 'a';
                calc = `${article} ${unit}`;
            } else if (diff < 5) {
                calc = `a few ${unit}s`;
            } else {
                calc = `${diff} ${unit}s`;
            }
            return calc;
        }

        if (diff < 60) {
            duration = calcDiff(diff, 'second');
        } else if ((diff / 60) < 60) {
            duration = calcDiff(Math.floor(diff / 60), 'minute');
        } else if ((diff / 3600) < 24) {
            duration = calcDiff(Math.floor(diff / 3600), 'hour');
        } else {
            duration = calcDiff(Math.floor(diff / 86400), 'day');
        }

        if (started) {
            duration += ' ago';
        }

        return duration;
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
        let jobsRunning = await Hoot.api.getJobsRunning();
        let jobsHistory = await Hoot.api.getJobsHistory();
        await Hoot.layers.refreshLayers();
        this.populateJobsHistory( jobsHistory );
        this.populateJobsRunning( jobsRunning );
    }

    [getJobTypeIcon](type) {
        let typeIcon;
        switch (type) {
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
        return typeIcon;
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
                    span: [{ text: this.duration(d.start, Date.now(), true) }]
                });

                //Progress bar
                props.push({
                    span: [{ text: Math.round(d.percentcomplete) + '%' }],
                    progress: [{ percent: d.percentcomplete }]
                });

                //Actions
                let actions = [];
                let user = JSON.parse( localStorage.getItem( 'user' ) );


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

                if (d.userId === user.id) {
                    actions.push({
                        title: 'cancel job',
                        icon: 'cancel',
                        action: () => {
                            d3.select('#util-jobs').classed('wait', true);
                            Hoot.api.cancelJob(d.jobId)
                                .then( resp => this.loadJobs() )
                                .finally( () => d3.select('#util-jobs').classed('wait', false));
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

                //Job Type
                props.push({
                    i: [{icon: this[getJobTypeIcon](d.jobType), action: () => {} }],
                    span: [{text: d.jobType.toUpperCase()}]
                });

                //Output
                let map = Hoot.layers.findBy( 'id', d.mapId );

                if (map) {
                    props.push({
                        span: [{text: map.name}]
                    });
                } else {
                    props.push({
                        span: [{text: 'Map no longer exists'}]
                    });
                }

                //Status
                let statusIcon;
                switch (d.status) {
                    case 'running':
                        statusIcon = 'autorenew';
                        break;
                    case 'complete':
                        statusIcon = 'check_circle_outline';
                        break;
                    case 'failed':
                        statusIcon = 'warning';
                        break;
                    case 'cancelled':
                        statusIcon = 'cancel';
                        break;
                    case 'unknown':
                    default:
                        statusIcon = 'help';
                        break;
                }

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
                    span: [{text: this.duration(d.start, Date.now(), true) }]
                });

                //Duration
                props.push({
                    span: [{text: this.duration(d.start, d.end) }]
                });

                //Actions
                let actions = [];

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
/* Comment this out for now
*  the call to map tags actually updates the last accessed datetime
*  which is not desireable as it's one of the info properties shown
                    //Get info
                    actions.push({
                        title: `show info`,
                        icon: 'info',
                        action: () => {
                            Hoot.api.getMapTags(d.mapId)
                                .then( tags => {
                                    let type = 'info';
                                    let lines = [];
                                    if (tags.lastAccessed) lines.push(`Last accessed: ${moment(tags.lastAccessed.replace( /[-:]/g, '' )).fromNow()}`);
                                    if (tags.input1Name) lines.push(`Reference: ${tags.input1Name}`);
                                    if (tags.input2Name) lines.push(`Secondary: ${tags.input2Name}`);
                                    if (tags.params) {
                                        let params = JSON.parse(tags.params.replace(/\\"/g, '"'));
                                        lines.push(`Conflation type: ${params.CONFLATION_TYPE}`);
                                    }

                                    let message = lines.join('<br>');
                                    Hoot.message.alert( { message, type } );
                                } );
                        }
                    });
*/
                }

                //Clear job
                actions.push({
                    title: 'clear job',
                    icon: 'clear',
                    action: async () => {
                        let self = this;
                        function deleteJob(id) {
                            d3.select('#util-jobs').classed('wait', true);
                            Hoot.api.deleteJobStatus(id)
                                .then( resp => self.loadJobs() )
                                .finally( () => d3.select('#util-jobs').classed('wait', false));
                        }
                        if (d3.event.shiftKey) { //omit confirm prompt
                            deleteJob(d.jobId);
                        } else {
                            let message = 'Are you sure you want to clear this job record?',
                            confirm = await Hoot.message.confirm( message );

                            if ( confirm ) {
                                deleteJob(d.jobId);
                            }
                        }

                    }
                });

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
            .text( d => d.text );

    }

}
