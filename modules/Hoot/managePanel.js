/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _ from 'lodash-es';

import Event      from './managers/eventManager';
import manageTabs from './managePanels/index';

/**
 * Creates the settings panel
 *
 * @constructor
 */
export default class ManagePanel {
    /**
     *
     * @constructor
     * @param container
     */
    constructor( container ) {
        this.manageTabs = manageTabs;
        this.container  = container;

        this.activeId = null;
    }

    /**
     * Render base panel and all of its components
     */
    async render() {
        this.panel = this.container
            .append( 'div' )
            .attr( 'id', 'manage-panel' )
            .classed( 'hidden', true );

        this.sidebarMenu = this.panel.append( 'div' )
            .attr( 'id', 'manage-sidebar' )
            .classed( 'wrapper fill-light keyline-right', true );

        this.sidebarMenu.append( 'h3' )
            .classed( 'manage-header pad1y pointer strong center', true )
            .append( 'label' )
            .text( 'Settings Panel' );

        // Create all tab items in the panel
        Promise.all( _.map( this.manageTabs, Tab => new Tab( this.panel, this.sidebarMenu ).render() ) );

        this.listen();

        return this;
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

        d3.selectAll( '.manage-tab-header' )
            .classed( 'strong', false );

        d3.select( d )
            .classed( 'strong', true );
    }

    /**
     * Listen for tab change
     */
    listen() {
        Event.listen( 'toggle-manage-tab', this.toggleTab, this );
    }
}