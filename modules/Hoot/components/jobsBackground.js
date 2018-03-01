/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

import _ from 'lodash-es';

import Events from '../util/events';
import manageTabs from 'manageTabs/index';

export default class JobsBackground {
    constructor( context ) {
        this.context    = context;
        this.events     = Events;
        this.manageTabs = manageTabs;

        this.container = context.container();
    }

    listen() {
        this.events.listen( 'toggle-manage-tab', this.toggleTab, this );
    }

    toggleTab( d ) {
        console.log( d );
    }

    async renderContainer() {
        this.settingsPanel = this.container
            .append( 'div' )
            .attr( 'id', 'settings-panel' )
            .classed( 'hidden', true );

        this.settingsSidebar = this.settingsPanel
            .append( 'div' )
            .attr( 'id', 'settings-sidebar' )
            .classed( 'pad2 fill-light keyline-right', true );
    }

    async init() {
        this.listen();

        this.renderContainer()
            .then( () => _.map( this.manageTabs, Tab => {
                let tab = new Tab( this.context, this.settingsPanel, this.settingsSidebar );
                tab.init();
                //tab.init( this.$jobsBG, this.$settingsSidebar )
            } ) );
    }
}