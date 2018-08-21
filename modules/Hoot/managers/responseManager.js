/*******************************************************************************************************
 * File: responseManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

export default class ResponseManager {
    constructor( hoot ) {
        this.hoot = hoot;

        this.animateTime = 500;
    }

    alert( message, type ) {
        let container = d3.select( '#id-sink' )
            .append( 'div' )
            .classed( `hoot-alert alert-${ type } show round`, true );

        container
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'close pointer', true )
            .text( '×' )
            .on( 'click', () => this.destroy( container ) );

        container
            .append( 'span' )
            .text(  message );
    }

    destroy( container ) {
        container
            .classed( 'show', false );

        setTimeout( () => container.remove(), this.animateTime );
    }
}