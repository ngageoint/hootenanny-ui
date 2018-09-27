/** ****************************************************************************************************
 * File: transAssist.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab            from '../tab';
import Upload         from './upload';
import TagMapForm     from './tagMapForm';
import AddTranslation from '../../modals/addTranslation';

/**
 * Creates the translations-assistant tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TransAssist extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Translation Assistant';
        this.id   = 'manage-translations-assistant';
    }

    render() {
        super.render();

        new Upload( this ).render();

        return this;
    }

    initMapping( valuesMap ) {
        new TagMapForm( this ).render( valuesMap );
    }

    openSaveForm( output ) {
        new AddTranslation( this, output ).render();
    }

    showTranslations() {
        d3.select( '[data-id="#util-translations"]' ).node().click();
    }
}