/** ****************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

/**
 * Creates the about tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class About extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'About';
        this.id   = 'util-about';
    }

    render() {
        super.render();
    }
}