/** ****************************************************************************************************
 * File: translation.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

export default class Translation extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Translations';
        this.id   = 'util-translations';
    }

    render() {
        super.render();
    }

    init() {
        this.render();
    }
}