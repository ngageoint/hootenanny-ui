/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _ from 'lodash-es';

import Event from '../managers/eventManager';
import settingsTabs from './settingsTabs/index';

/**
 * Creates the settings panel
 *
 * @constructor
 */
export default class SettingsPanel {
    constructor( container ) {
        this.settingsTabs = settingsTabs;
        this.container    = container;

        this.activeId = null;
    }

    /**
     * Render base panel and all of it's view
     */
    async render() {
        this.panel   = this.createPanel();
        this.sidebar = this.createSidebar();

        // Create all tab items in the panel
        Promise.all( _.map( this.settingsTabs, Tab => {
            new Tab( this.panel, this.sidebar ).render();
        } ) );

        this.listen();
    }

    /**
     * Create the settings panel.
     * It is initially hidden and takes up the entire view when enabled
     *
     * @returns {d3} - settings panel
     */
    createPanel() {
        return this.container
            .append( 'div' )
            .attr( 'id', 'settings-panel' )
            .classed( 'hidden', true );
    }

    /**
     * Create the sidebar in the settings panel
     *
     * @returns {d3} - settings sidebar
     */
    createSidebar() {
        let sidebar = this.panel.append( 'div' )
            .attr( 'id', 'settings-sidebar' )
            .classed( 'pad2 fill-light keyline-right', true );

        sidebar.append( 'h3' )
            .classed( 'settings-header pointer strong center margin2 pad1y', true )
            .append( 'label' )
            .text( 'Settings' );

        return sidebar;
    }

    /**
     * Toggle tab body into view
     *
     * @param d - node data
     */
    toggleTab( d ) {
        this.activeId  = d3.select( d ).attr( 'data-id' );
        let activeBody = d3.select( this.activeId ).node();

        this.panel.node()
            .appendChild( activeBody );

        d3.selectAll( '.hoot-util-header' )
            .classed( 'strong', false );

        d3.select( d )
            .classed( 'strong', true );
    }

    /**
     * Listen for tab change
     */
    listen() {
        Event.listen( 'toggle-settings-tab', this.toggleTab, this );
    }
}