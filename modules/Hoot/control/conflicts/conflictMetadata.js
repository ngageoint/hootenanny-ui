/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import API   from '../api';
//import Event from '../../managers/eventManager';

export default class ConflictMetadata {
    constructor( parent ) {
        this.conflicts = parent;

        this.reviewStats       = null;
        this.currentReviewItem = null;
    }

    async init() {
        this.reviewStats = await API.getReviewStatistics( this.conflicts.mapId );

        this.updateMeta();
    }

    updateMeta( note ) {

        //Event.send( 'meta-updated' );
    }
}