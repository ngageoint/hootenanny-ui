
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

        // window.setInterval(this.loadJobs, 90000);
        this.loadJobs();

        return this;
    }

    activate() {
        console.log('active');
    }

    deactivate() {
        console.log('deactive');
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
        let instance = this;

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

        // let buttonContainer = basemapItem
        //     .append( 'div' )
        //     .classed( 'button-container fr', true );

        // buttonContainer
        //     .append( 'button' )
        //     .classed( 'keyline-left _icon', true )
        //     .on( 'click', function( d ) {
        //         let button = d3.select( this );

        //         d3.event.stopPropagation();
        //         d3.event.preventDefault();

        //         if ( d.status === 'disabled' ) {
        //             Hoot.api.enableBasemap( d ).then( () => {
        //                 button
        //                     .classed( 'closedeye', false )
        //                     .classed( 'openeye', true );

        //                 d.status = 'enabled';

        //                 instance.renderBasemap( d );
        //             } );
        //         } else {
        //             Hoot.api.disableBasemap( d ).then( () => {
        //                 button
        //                     .classed( 'closedeye', true )
        //                     .classed( 'openeye', false );

        //                 d.status = 'disabled';

        //                 Hoot.context.background().removeBackgroundSource( d );
        //             } );
        //         }
        //     } )
        //     .select( function( d ) {
        //         let button = d3.select( this );

        //         if ( d.status === 'processing' ) {
        //             //TODO: get back to this
        //             window.console.log( 'processing' );
        //         } else if ( d.status === 'failed' ) {
        //             window.console.log( 'failed' );
        //         } else if ( d.status === 'disabled' ) {
        //             button.classed( 'closedeye', true );
        //             button.classed( 'openeye', false );
        //         } else {
        //             button.classed( 'closedeye', false );
        //             button.classed( 'openeye', true );
        //             // basemaps is already enabled, so just render it in the UI
        //             instance.renderBasemap( d );
        //         }
        //     } );

        // buttonContainer
        //     .append( 'button' )
        //     .classed( 'keyline-left _icon trash', true )
        //     .on( 'click', function( d ) {
        //         d3.event.stopPropagation();
        //         d3.event.preventDefault();

        //         let r = confirm( `Are you sure you want to delete: ${ d.name }?` );
        //         if ( !r ) return;

        //         Hoot.api.deleteBasemap( d.name )
        //             .then( () => instance.loadBasemaps() );
        //     } );
    }

}

