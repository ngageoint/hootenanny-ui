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
        this.container  = context.container();

        this.activeId = null;
    }

    listen() {
        this.events.listen( 'toggle-manage-tab', this.toggleTab, this );
    }

    toggleTab( d ) {
        this.activeId  = d3.select( d ).attr( 'data' );
        let activeBody = d3.select( this.activeId ).node();

        this.settingsPanel.node()
            .appendChild( activeBody );
        d3.selectAll( '.hoot-util-header' )
            .classed( 'strong', false );
        d3.select( d )
            .classed( 'strong', true );
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

        this.settingsSidebar
            .append( 'h3' )
            .classed( 'settings-header pointer strong center margin2 pad1y', true )
            .append( 'label' )
            .text( 'Settings' );
    }

    async init() {
        this.listen();

        this.renderContainer()
            .then( () => _.map( this.manageTabs, Tab => {
                let tab = new Tab( this.context, this.settingsPanel, this.settingsSidebar );
                tab.init();
            } ) );
    }
}