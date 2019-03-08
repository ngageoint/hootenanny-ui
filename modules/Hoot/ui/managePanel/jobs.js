
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

    populateJobs( jobs ) {

        let rows = this.jobsTable
            .selectAll( '.jobs-item' )
            .data( jobs, d => d.name );

        rows.exit().remove();

        let jobItem = rows
            .enter()
            .append( 'div' )
            .classed( 'jobs-item keyline-bottom', true );

        rows = rows.merge( jobItem );

        jobItem
            .append( 'span' )
            .text( d => d.jobId );

    }

}

