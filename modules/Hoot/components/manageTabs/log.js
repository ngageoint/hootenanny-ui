/** ****************************************************************************************************
 * File: log.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

'use strict';

import Tab from './tab';

export default class Log extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Log';
        this.id   = 'util-error-log';
    }

    render() {
        super.render();
    }

    init() {
        this.render();
    }
}