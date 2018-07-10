/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Event from '../nodeManagers/eventManager';

/**
 * Base class that all other managePanels in the settings panel extends from
 */
export default class Tab {
    constructor( instance ) {
        this.context      = instance.context;
        this.panelSidebar = instance.panelSidebar;
        this.panel        = instance.panel;

        this.name = null;
        this.id   = null;
    }

    /**
     * Render tab header in settings panel sidebar
     */
    render() {
        this.tabHeader = this.panelSidebar
            .append( 'div' )
            .classed( 'tab-header pad1y center', true )
            .attr( 'data-id', `#${this.id}` )
            .on( 'click', function() {
                Event.send( 'toggle-manage-tab', this );
            } );

        this.tabHeader
            .append( 'label' )
            .text( this.name )
            .classed( 'pointer', true )
            .style( 'font-style', 'normal' );

        this.panelBody = this.panel.append( 'div' )
            .classed( 'panel-body fill-light', true )
            .attr( 'id', this.id );

        this.panelWrapper = this.panelBody.append( 'div' )
            .classed( 'panel-wrapper', true );
    }
}