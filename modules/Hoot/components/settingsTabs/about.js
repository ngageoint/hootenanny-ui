/** ****************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

export default class About extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'About';
        this.id   = 'util-about';
    }

    render() {
        super.render();
    }

    init() {
        this.render();

    }
}