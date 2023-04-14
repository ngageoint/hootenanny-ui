/*******************************************************************************************************
 * File: alert.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/22/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import { select as d3_select } from 'd3-selection';

export default class Alert extends EventEmitter {
    constructor( { data, message, type, keepOpen } ) {
        super();

        this.data    = data;
        this.message = message;
        this.type    = type;
        this.keepOpen   = keepOpen;

        this.displayTime = 5000;
        this.animateTime = 500;
        this.hideTimeout = null;
    }

    send() {
        this.container = d3_select( '.alert-container' )
            .append( 'div' )
            .classed( `hoot-alert alert-${ this.type } show round`, true )
            .on( 'mouseover', () => this.handleMouseover() )
            .on( 'mouseout', () => this.handleMouseout() );

        this.container
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'close pointer hidden', true )
            .text( '×' )
            .on( 'click', () => this.destroy( this.container ) );

        this.container
            .append( 'div' )
            .classed( 'alert-message', true )
            .append( 'span' )
            .html( this.message );

        this.autoHide();
    }

    autoHide() {
        if (!this.keepOpen)
            this.hideTimeout = setTimeout( () => this.destroy(), this.displayTime );
    }

    clearAutoHide() {
        clearTimeout( this.hideTimeout );
    }

    handleMouseover() {
        this.container
            .select( '.close' )
            .classed( 'hidden', false );

        this.clearAutoHide();
    }

    handleMouseout() {
        this.container
            .select( '.close' )
            .classed( 'hidden', true );

        if ( !this.details || ( this.details && !this.details.classed( 'show' ) ) ) {
            this.autoHide();
        }
    }

    destroy() {
        this.container.classed( 'show', false );

        setTimeout( () => {
            this.container.remove();
            this.emit( 'destroy' );
        }, this.animateTime );

        this.clearAutoHide();
    }
}
