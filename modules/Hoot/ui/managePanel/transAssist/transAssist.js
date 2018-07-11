/** ****************************************************************************************************
 * File: transAssist.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab                 from '../tab';
import TransAssistUpload   from './transAssistUpload';
import TransAssistMapping  from './transAssistMapping';
import TranslationsAddForm from '../translations/translationsAddForm';

/**
 * Creates the translations-assistant tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TransAssist extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Translations Assistant';
        this.id   = 'manage-translations-assistant';
    }

    render() {
        super.render();

        new TransAssistUpload( this ).render();
    }

    initMapping( valuesMap ) {
        new TransAssistMapping( this ).render( valuesMap );
    }

    openSaveForm( output ) {
        new TranslationsAddForm( this, output ).render();
    }

    showTranslations() {
        d3.select( '[data-id="#util-translations"]' ).node().click();
    }
}