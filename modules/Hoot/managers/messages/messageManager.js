/*******************************************************************************************************
 * File: messageManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import Alert from './alert';

export default class MessageManager {
    constructor( hoot ) {
        this.hoot = hoot;

        this.messageQueue = [];
        this.showing      = [];
        this.interval     = null;
        this.intervalTime = 500;
    }

    alert( params ) {
        let alert = new Alert( params );

        this.messageQueue.push( alert );

        if ( !this.interval ) {
            this.interval = setInterval( () => this.sendAlerts(), this.intervalTime );
        }
    }

    sendAlerts() {
        if ( !this.showing.length ) {
            this.createAlertContainer();
        }

        if ( this.messageQueue.length ) {
            let alert = this.messageQueue.shift();

            alert.send();

            alert.on( 'destroy', alert => this.updateShowing( alert ) );

            this.showing.push( alert );
        } else {
            clearInterval( this.interval );
            this.interval = null;
        }
    }

    updateShowing( alert ) {
        this.showing.splice( this.showing.indexOf( alert ), 1 );

        if ( !this.showing.length ) {
            this.container.remove();
        }
    }

    createAlertContainer() {
        let parent;

        parent = d3.select( 'body' );

        this.container = parent
            .append( 'div' )
            .classed( 'alert-container', true );
    }

    confirm( message ) {
        return new Promise( res => {
            let overlay = d3.select( 'body' )
                .append( 'div' )
                .classed( 'hoot-confirm overlay confirm-overlay', true );

            let wrapper = overlay
                .append( 'div' )
                .classed( 'wrapper', true );

            let modal = wrapper
                .append( 'div' )
                .classed( 'contain hoot-menu fill-white round modal', true );

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
                    this.currentConfirm = null;
                    overlay.remove();
                    res( false );
                } );

            buttonContainer
                .append( 'button' )
                .classed( 'primary', true )
                .text( 'OK' )
                .on( 'click', () => {
                    this.currentConfirm = null;
                    overlay.remove();
                    res( true );
                } );
        } );
    }
}
