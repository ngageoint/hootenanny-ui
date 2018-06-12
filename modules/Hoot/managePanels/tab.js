/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Event from '../managers/eventManager';

/**
 * Base class that all other managePanels in the settings panel extends from
 */
export default class Tab {
    constructor( [ panel, sidebarMenu ] ) {
        this.panel   = panel;
        this.sidebarMenu = sidebarMenu;

        this.name = null;
        this.id   = null;
    }

    /**
     * Render tab header in settings panel sidebar
     */
    render() {
        this.tabHeader = this.sidebarMenu
            .append( 'div' )
            .classed( 'manage-tab-header pad1y center', true )
            .attr( 'data-id', `#${this.id}` )
            .on( 'click', function() {
                Event.send( 'toggle-manage-tab', this );
            } );

        this.tabLabel = this.tabHeader
            .append( 'label' )
            .text( this.name )
            .classed( 'pointer', true )
            .style( 'font-style', 'normal' );

        this.bodyWrapper = this.panel.append( 'div' )
            .classed( 'manage-body wrapper fill-light', true )
            .attr( 'id', this.id );

        this.bodyContent = this.bodyWrapper.append( 'div' )
            .classed( 'manage-content', true );
    }
}