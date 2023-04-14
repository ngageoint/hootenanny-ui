/*******************************************************************************************************
 * File: messageManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 * @apiNote Changelog: <br>
 *      Milla Zagorski 8-10-2022: Added code to allow for opening the initial review layer in JOSM. <br>
 *
 *******************************************************************************************************/

import Alert from './alert';
import { select as d3_select } from 'd3-selection';

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

        parent = d3_select( 'body' );

        this.container = parent
            .append( 'div' )
            .classed( 'alert-container', true );
    }

    confirm( message ) {
        return new Promise( res => {
            let overlay = d3_select( 'body' )
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
                    overlay.remove();
                    res( false );
                } );

            const okButton = buttonContainer
                .append( 'button' )
                .classed( 'primary', true )
                .text( 'OK' )
                .on( 'click', () => {
                    overlay.remove();
                    res( true );
                } );

            // focuses the 'ok' button so user can press enter without having to click the ok button
            okButton.node().focus();
        } );
    }

    /**
     * Used by layerManager.js to either open the review layer in iD or JOSM when <br>
     * prompted by initial review of a conflated layer that has conflicts.
     *
     * @param {String} message - The message to be displayed in the modal.
     * @param {layer} mergedLayer - The merged review layer.
     * @returns {String} Returns a response ("josm" = open review layer in JOSM).
     */
    confirmEditor(message, mergedLayer) {
        return new Promise(res => {
            let overlay = d3_select('body')
                .append('div')
                .classed('hoot-confirm overlay confirm-overlay', true);

            let wrapper = overlay
                .append('div')
                .classed('wrapper', true);

            let modal = wrapper
                .append('div')
                .classed('contain hoot-menu fill-white round modal', true);

            modal
                .append('div')
                .classed('confirm-message', true)
                .html(message);

            let buttonContainer = modal
                .append('div')
                .classed('confirm-actions flex justify-end', true);

            buttonContainer
                .append('button')
                .classed('secondary', true)
                .text('Cancel')
                .on('click', () => {
                    overlay.remove();
                    res(false);
                });

            buttonContainer
                .append('button')
                .classed('primary', true)
                .text('Open here')
                .on('click', () => {
                    overlay.remove();
                    res(true);
                });

            buttonContainer
                .append('button')
                .classed('primary', true)
                .text('Open in JOSM')
                .on('click', async () => {
                    overlay.remove();
                    res('josm');

                    Hoot.api.openDataInJosm({
                        id: mergedLayer.id,
                        name: mergedLayer.name,
                        grailMerged: mergedLayer.tags.grailMerged,
                        bounds: mergedLayer.tags.bounds,
                    });
                });
        });
    }
}
