/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab                from '../tab';
import TransAssistUpload  from './transAssistUpload';
import TransAssistMapping from './transAssistMapping';
import TranslationAddForm from '../translation/translationAddForm';

/**
 * Creates the translation-assistant tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TranslationAssistant extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Translation Assistant';
        this.id   = 'manage-translation-assistant';
    }

    render() {
        super.render();

        new TransAssistUpload( this ).render();
    }

    initMapping( valuesMap ) {
        new TransAssistMapping( this ).render( valuesMap );
    }

    openSaveForm( output ) {
        new TranslationAddForm( this, output ).render();
    }

    showTranslations() {
        d3.select( '[data-id="#util-translations"]' ).node().click();
    }
}