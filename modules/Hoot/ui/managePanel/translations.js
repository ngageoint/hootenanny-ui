/** ****************************************************************************************************
 * File: translations.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab             from './tab';
import AddTranslation  from '../modals/addTranslation';
import ViewTranslation from '../modals/viewTranslation';
import { tooltip }     from '../../../util/tooltip';
import { saveAs }      from 'file-saver';

/**
 * Creates the translations tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Translations extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Translations';
        this.id   = 'util-translations';
    }

    render() {
        super.render();

        this.createNewTranslationButton();
        this.createTranslationTable();

        this.loadTranslations();

        return this;
    }

    createNewTranslationButton() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-translation-button button primary _icon big light plus', true )
            .text( 'Add New Translations' )
            .on( 'click', () => new AddTranslation( this ).render() );
    }

    createTranslationTable() {
        this.translationTable = this.panelWrapper
            .append( 'div' )
            .classed( 'translation-table keyline-all fill-white', true );
    }

    async loadTranslations() {
        try {
            let translations = await Hoot.api.getTranslations();

            translations.sort( ( a, b ) => {
                // Set undefined to false
                if ( !a.DEFAULT ) a.DEFAULT = false;
                if ( !b.DEFAULT ) b.DEFAULT = false;
                // We check DEFAULT property, putting true first
                if ( a.DEFAULT !== b.DEFAULT ) {
                    return (a.DEFAULT) ? -1 : 1;
                } else {
                    // We only get here if the DEFAULT prop is equal
                    return d3.ascending( a.NAME.toLowerCase(), b.NAME.toLowerCase() );
                }
            } );

            this.populateTranslations( translations );
        } catch ( e ) {
            // TODO: show alert
            // window.console.log( 'Unable to retrieve translations' );
            throw new Error( e );
        }
    }

    populateTranslations( translations ) {
        let instance = this;

        let rows = this.translationTable
            .selectAll( '.translation-item' )
            .data( translations, d => d );

        rows.exit().remove();

        let translationItem = rows
            .enter()
            .append( 'div' )
            .classed( 'translation-item keyline-bottom', true );

        rows.merge( translationItem );

        let translationName = translationItem
            .append( 'span' )
            .append( 'a' )
            .classed( 'translation-name', true )
            .text( d => {
                if ( d.DEFAULT ) {
                    return d.NAME + '*';
                }

                return d.NAME;
            } )
            .on( 'click', d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.translationPopup( d );
            } );

        let translationTooltip = tooltip()
            .placement( 'right' )
            .html( 'true' )
            .title( d => {
                if ( d.DEFAULT ) {
                    return d.DESCRIPTION + ' (Hootenanny Default Translations)';
                }

                return d.DESCRIPTION;
            } );

        translationName.call( translationTooltip );

        let buttonContainer = translationItem
            .append( 'div' )
            .classed( 'button-container fr', true );

        buttonContainer
            .append( 'button' )
            .classed( 'keyline-left _icon export', true )
            .on( 'click', d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.exportTranslation( d );
            } );

        buttonContainer
            .append( 'button' )
            .on( 'click', function( d ) {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let r = confirm( 'Are you sure you want to delete selected translations?' );
                if ( !r ) return;

                Hoot.api.deleteTranslation( d.NAME )
                    .then( () => instance.loadTranslations() );
            } )
            .select( function( d ) {
                if ( d.DEFAULT ) {
                    d3.select( this ).classed( 'keyline-left _icon close', true )
                        .on( 'click', () => {
                            d3.event.stopPropagation();
                            d3.event.preventDefault();

                            alert( 'Can not delete default translations.' );
                        } );
                } else {
                    d3.select( this ).classed( 'keyline-left _icon trash', true );
                }
            } );
    }

    async translationPopup( d ) {
        let translationText;

        if ( d.DEFAULT ) {
            translationText = await Hoot.api.getDefaultTranslation( d.PATH );
        } else {
            translationText = await Hoot.api.getTranslation( d.NAME );
        }

        new ViewTranslation( this, d, translationText ).render();
    }

    async exportTranslation( d ) {
        try {
            let translationText;

            if ( d.DEFAULT ) {
                translationText = await Hoot.api.getDefaultTranslation( d.PATH );
            } else {
                translationText = await Hoot.api.getTranslation( d.NAME );
            }

            let transBlob = new Blob( [ translationText ], { type: 'text/javascript' } );
            saveAs( transBlob, d.NAME + '.js' );

        } catch ( e ) {
            //TODO: show warning
            // window.console.log( 'Unable to get translations text' );
            throw new Error( e );
        }
    }
}
