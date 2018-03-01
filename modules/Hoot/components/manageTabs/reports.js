/** ****************************************************************************************************
 * File: reports.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

export default class Reports extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Reports';
        this.id   = 'util-reports';
    }

    render() {
        super.render();
    }

    init() {
        this.render();
    }
}