/*******************************************************************************************************
 * File: responseManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/
 
import EventEmitter from 'events';

export default class ResponseManager extends EventEmitter {
    constructor( hoot ) {
        super();

        this.hoot = hoot;
    }

    alert() {
        this.emit( 'blah' );
    }
}