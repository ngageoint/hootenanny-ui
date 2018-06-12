/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

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
        this.id   = 'util-translation-assistant';

        this.options = [
            {
                name: 'OSM',
                enabled: true,
                checked: true
            },
            {
                name: 'TDSv61',
                enabled: true
            }
        ];
    }

    render() {
        super.render();

        //this.container = this.bodyContent
        //    .append( 'div' )
            //.classed( 'trans-assistant-container' )
    }
}