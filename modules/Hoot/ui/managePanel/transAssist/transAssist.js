/** ****************************************************************************************************
 * File: transAssist.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab            from '../tab';
import Upload         from './upload';
import TagMapForm     from './tagMapForm';
import AddTranslation from '../../modals/addTranslation';
import { select as d3_select } from 'd3-selection';

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
        if ( !this.tagMapForm ) {
            this.tagMapForm = new TagMapForm( this );
        }

        this.tagMapForm.render( valuesMap );
    }

    openSaveForm( output ) {
        new AddTranslation( Hoot.ui.managePanel.translations, output ).render();
    }

    showTranslations() {
        d3_select( '[data-id="#util-translations"]' ).node().click();
    }
}
