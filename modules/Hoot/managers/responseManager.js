/*******************************************************************************************************
 * File: responseManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

export default class ResponseManager {
    constructor( hoot ) {
        this.hoot = hoot;

        this.displayTime = 8000;
        this.animateTime = 500;
    }

    alert( message, type ) {
        let parent;

        if ( !d3.select( '#manage-panel' ).classed( 'hidden' ) ) {
            parent = d3.select( 'body' );
        } else {
            parent = d3.select( '#id-sink' );
        }

        let container = parent
            .append( 'div' )
            .classed( `hoot-alert alert-${ type } show round`, true )
            .on( 'mouseover', () => this.handleMouseover( container ) )
            .on( 'mouseout', () => this.handleMouseout( container ) );

        container
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'close pointer hidden', true )
            .text( '×' )
            .on( 'click', () => this.destroy( container ) );

        container
            .append( 'span' )
            .text(  message );

        this.autoHide( container );
    }

    confirm( message ) {
        return new Promise( res => {
            let overlay = d3.select( 'body' )
                .append( 'div' )
                .classed( 'hoot-confirm overlay confirm-overlay', true );

            let modal = overlay
                .append( 'div' )
                .classed( 'contain col4 hoot-menu fill-white round modal', true );

            modal
                .append( 'div' )
                .classed( 'confirm-message', true )
                .html( message );

            let buttonContainer = modal
                .append( 'div' )
                .classed( 'confirm-actions flex justify-end', true );

            buttonContainer
                .append( 'button' )
                .classed( 'secondary', true )
                .text( 'Cancel' )
                .on( 'click', () => {
                    overlay.remove();
                    res( false );
                } );

            buttonContainer
                .append( 'button' )
                .classed( 'primary', true )
                .text( 'OK' )
                .on( 'click', () => {
                    overlay.remove();
                    res( true );
                } );
        } );
    }

    autoHide( container ) {
        this.hideTimeout = setTimeout( () => this.destroy( container ), this.displayTime );
    }

    clearAutoHide() {
        clearTimeout( this.hideTimeout );
    }

    handleMouseover( container ) {
        container
            .select( '.close' )
            .classed( 'hidden', false );

        this.clearAutoHide();
    }

    handleMouseout( container ) {
        container
            .select( '.close' )
            .classed( 'hidden', true );

        this.autoHide( container );
    }

    destroy( container ) {
        container.classed( 'show', false );

        setTimeout( () => container.remove(), this.animateTime );
        this.clearAutoHide();
    }
}