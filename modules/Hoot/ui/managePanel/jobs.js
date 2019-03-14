
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
        this.poller = window.setInterval( this.loadJobs.bind(this), 5000 );
    }

    deactivate() {
        window.clearInterval(this.poller);
    }

    createJobsTable() {
        this.jobsTable = this.panelWrapper
            .append( 'div' )
            .classed( 'jobs-table keyline-all fill-white', true );
    }

    async loadJobs() {
        try {
            let jobsHistory = await Hoot.api.getJobsHistory();
            await Hoot.layers.refreshLayers();
            this.populateJobsHistory( jobsHistory );
        } catch ( e ) {
            window.console.log( 'Unable to retrieve jobs' );
            throw new Error( e );
        }
    }

    populateJobsHistory( jobs ) {
        let table = this.jobsTable
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

                let map = Hoot.layers.findBy( 'id', d.mapId );

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

                props.push({icon: typeIcon, text: d.jobType.toUpperCase()});
                props.push({text: map ? map.name : 'Map no longer exists'});
                props.push({icon: statusIcon});
                props.push({text: moment( d.start ).fromNow()});
                props.push({text: moment.duration( d.end - d.start ).humanize()});
                props.push({icon: 'clear', action: () => {
                    Hoot.api.deleteJobStatus(d.jobId)
                        .then( resp => this.loadJobs() )
                        .catch( err => {
                            // TODO: response - unable to create new folder
                        } );
                }});

                return props;
            });

        cells.exit().remove();

        let cellsEnter = cells
            .enter().append( 'td' );
        cellsEnter.append('i')
            .classed( 'material-icons', true );
        cellsEnter.append('span');
        cells = cells.merge(cellsEnter);

        cells.selectAll('i')
            .text( d => d.icon )
            .on('click', d => d.action());
        cells.selectAll('span')
            .text( d => d.text );

    }

}

