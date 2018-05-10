/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

//import Event from '../../managers/eventManager';

export default class ConflictMetadata {
    constructor( instance ) {
        this.conflicts = instance;
        this.data      = instance.data;
    }

    updateMeta( note ) {

        //Event.send( 'meta-updated' );
    }

    buildPoiTable() {
        //this.featureTable =
    }
}