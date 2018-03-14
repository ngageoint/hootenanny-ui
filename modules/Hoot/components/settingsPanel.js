/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _ from 'lodash-es';

import Events from '../util/events';
import settingsTabs from './settingsTabs/index';

/**
 * Creates the settings panel
 *
 * @constructor
 */
export default class SettingsPanel {
    constructor( context ) {
        this.context    = context;
        this.events     = Events;
        this.settingsTabs = settingsTabs;
        this.container  = context.container();

        this.activeId = null;
    }

    /**
     * Attach event handlers
     */
    listen() {
        this.events.listen( 'toggle-manage-tab', this.toggleTab, this );
    }

    /**
     * Toggle a tab into view
     *
     * @param d - node data
     */
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

    /**
     * Render the base of the panel
     */
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

    /**
     * Initialize by rendering the base panel and then all of it's components
     */
    async init() {
        this.listen();

        this.renderContainer()
            .then( () => _.map( this.settingsTabs, Tab => {
                let tab = new Tab( this.context, this.settingsPanel, this.settingsSidebar );
                tab.init();
            } ) );
    }
}