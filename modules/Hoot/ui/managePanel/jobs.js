
import Tab from './tab';

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
            let jobs = await Hoot.api.getJobs();

            this.populateJobs( jobs );
        } catch ( e ) {
            window.console.log( 'Unable to retrieve jobs' );
            throw new Error( e );
        }
    }

/*
{
"jobId": "bb266d64-5251-4c67-a2ca-347f26892055",
"jobType": "delete",
"userId": 2631622,
"mapId": 8,
"start": 1552411634022,
"end": 1552411634144,
"status": "complete",
"percentcomplete": 100
}
*/
    populateJobs( jobs ) {
        let table = this.jobsTable
            .selectAll('table')
            .data([0]);
        table = table.enter()
                .append('table')
                .merge(table);

        table.selectAll('tr.head')
            .data([0])
            .enter().append('tr')
            .classed('head', true)
            .selectAll('th')
            .data([
                'Job Type',
                'Output',
                'Owner',
                'Status',
                'Started',
                'Duration',
                'Percent Complete',
                // 'Actions'
                ])
            .enter().append('th')
            .text(d => d);

        let rows = table
            .selectAll( 'tr.jobs-item' )
            .data( jobs, d => d.jobId );

        rows.exit().remove();

        rows = rows
            .enter()
            .append( 'tr' )
            .classed( 'jobs-item keyline-bottom', true )
            .merge(rows);

        let cells = rows.selectAll( 'td' )
            .data(d => {
                let props = [];

                let map = Hoot.layers.findBy( 'id', d.mapId );

                props.push(d.jobType);
                props.push(map ? map.name : 'Unknown');
                props.push(
                    (Hoot.config.users[ d.userId ]) ?
                        Hoot.config.users[ d.userId ].display_name :
                        'No user for ' + d.userId);
                props.push(d.status);
                //props.push(moment( d.start ).fromNow());
                //props.push(moment.duration( ((d.end) ? d.end : )
                props.push(d.start);
                props.push(d.end);
                props.push(d.percentcomplete);

                return props;
            });

        cells.exit().remove();

        cells = cells
            .enter().append( 'td' )
            .merge(cells);
        cells.text( d => d );

    }

}

