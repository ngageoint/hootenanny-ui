/** ****************************************************************************************************
 * File: translation.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import API                from '../../control/api';
import Tab                from '../tab';
import TranslationAddForm from './translationAddForm';
import { tooltip }        from '../../../util/tooltip';

/**
 * Creates the translations tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Translation extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Translations';
        this.id   = 'util-translations';
    }

    render() {
        super.render();

        this.createNewTranslationButton();
        this.createTranslationTable();

        this.loadTranslations();
    }

    createNewTranslationButton() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-translation-button button primary _icon big light plus', true )
            .text( 'Add New Translation' )
            .on( 'click', () => new TranslationAddForm( this ).render() );
    }

    createTranslationTable() {
        this.translationTable = this.panelWrapper
            .append( 'div' )
            .classed( 'translation-table keyline-all fill-white', true );
    }

    async loadTranslations() {
        try {
            let translations = await API.getTranslations();

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
            console.log( 'Unable to retrieve translations' );
            throw new Error( e );
        }
    }

    populateTranslations( translations ) {
        let instance = this;

        let rows = this.translationTable
            .selectAll( '.translation-item' )
            .data( translations );

        let translationItem = rows
            .enter()
            .append( 'div' )
            .classed( 'translation-item keyline-bottom', true );

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
            } );

        let translationTooltip = tooltip()
            .placement( 'right' )
            .html( 'true' )
            .title( d => {
                if ( d.DEFAULT ) {
                    return d.DESCRIPTION + ' (Hootenanny Default Translation)';
                }

                return d.DESCRIPTION;
            } );

        translationName.call( translationTooltip );

        translationItem
            .append( 'button' )
            .on( 'click', function( d ) {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let r = confirm( 'Are you sure you want to delete selected translation?' );
                if ( !r ) return;

                API.deleteTranslation( d.NAME )
                    .then( () => {
                        d3.select( this.parentNode ).remove();
                        instance.loadTranslations();
                    } );
            } )
            .select( function( d ) {
                if ( d.DEFAULT ) {
                    d3.select( this ).classed( 'keyline-left fr _icon close', true )
                        .on( 'click', () => {
                            d3.event.stopPropagation();
                            d3.event.preventDefault();

                            alert( 'Can not delete default translation.' );
                        } );
                } else {
                    d3.select( this ).classed( 'keyline-left fr _icon trash', true );
                }
            } );
    }

    //async deleteTranslation( name ) {
    //    try {
    //        let deleted = await API.deleteTranslation( name );
    //
    //        console.log( deleted );
    //    } catch ( e ) {
    //
    //    }
    //}
}