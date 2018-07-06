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

            console.log( translations );
            this.populateTranslations( translations );
        } catch ( e ) {
            console.log( 'Unable to retrieve translations' );
            throw new Error( e );
        }
    }

    populateTranslations( translations ) {
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
    }
}