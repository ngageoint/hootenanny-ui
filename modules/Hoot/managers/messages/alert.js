/*******************************************************************************************************
 * File: alert.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/22/18
 *******************************************************************************************************/

import EventEmitter from 'events';

export default class Alert extends EventEmitter {
    constructor( { data, message, type } ) {
        super();

        this.data    = data;
        this.message = message;
        this.type    = type;

        this.displayTime = 5000;
        this.animateTime = 500;
        this.hideTimeout = null;
    }

    send() {
        this.container = d3.select( '.alert-container' )
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

        if ( this.data ) {
            this.displayTime = 10000;
            this.container.classed( 'has-data', true );
            this.createDetails();
        }

        this.autoHide();
    }

    createDetails() {
        let dataArr = d3.map( this.data ).entries();

        this.details = this.container
            .insert( 'div', '.alert-footer' )
            .classed( 'alert-details', true );

        let detailRows = this.details
            .selectAll( '.detail-row' )
            .data( dataArr )
            .enter();

        let row = detailRows
            .append( 'div' )
            .classed( 'detail-row', true );

        row
            .append( 'span' )
            .classed( 'detail-name', true )
            .text( d => `${d.key}: ` );

        row
            .append( 'span' )
            .classed( 'detail-value', true )
            .text( d => d.value );

        this.container
            .append( 'div' )
            .classed( 'alert-footer', true )
            .append( 'a' )
            .classed( 'alert-link', true )
            .text( 'More details' )
            .on( 'click', () => this.toggleDetails() );
    }

    toggleDetails() {
        let isShown = this.details.classed( 'show' );

        this.details.classed( 'show', !isShown );

        this.container
            .select( '.alert-link' )
            .text( isShown ? 'More details' : 'Less details' );


        if ( !isShown ) {
            this.clearAutoHide();
        }
    }

    autoHide() {
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
