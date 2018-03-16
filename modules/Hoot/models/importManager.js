/*******************************************************************************************************
 * File: import.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/14/18
 *******************************************************************************************************/

import API from '../util/api';

/**
 * Manages data imports and job statuses
 *
 * @constructor
 */
class ImportManager {
    constructor() {
        this.intervals = {};
        this.queryInterval = 1000;
    }

    importDirectory() {

    }

    importData( data ) {
        return API.upload( data )
            .then( resp => this.importStatus( resp[ 0 ].jobid ) );
    }

    importStatus( jobId ) {
        return new Promise( res => {
            this.intervals[ jobId ] = setInterval( async () => {
                let { status } = await API.getJobStatus( jobId );

                if ( status !== 'running' ) {
                    clearInterval( this.intervals[ jobId ] );
                    res( status );
                }
            }, this.queryInterval );
        } );
    }
}

export default new ImportManager();