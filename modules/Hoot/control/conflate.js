/*******************************************************************************************************
 * File: conflate.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/9/18
 *******************************************************************************************************/

import API from './api';

class Conflate {
    constructor() {
        this.intervals     = {};
        this.queryInterval = 1000;
    }

    conflate( data ) {
        return API.conflate( data )
            .then( resp => this.conflateStatus( resp.jobid ) );
    }

    conflateStatus( jobId ) {
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

export default new Conflate();