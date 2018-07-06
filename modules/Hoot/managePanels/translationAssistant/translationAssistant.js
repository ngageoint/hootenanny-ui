/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab                 from '../tab';
import TransAssistUpload   from './transAssistUpload';
import TransAssistMapping  from './transAssistMapping';
import TransAssistSaveForm from './transAssistSaveForm';

/**
 * Creates the translation-assistant tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TranslationAssistant extends Tab {
    constructor( ...params ) {
        super( params );

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
        new TransAssistSaveForm( this, output ).render();
    }

    showTranslations() {
        d3.select( '[data-id="#util-translations"]' ).node().click();
    }
}