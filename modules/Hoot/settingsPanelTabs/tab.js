/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Event from '../managers/eventManager';

/**
 * Base class that all other settingsPanelTabs in the settings panel extends from
 */
export default class Tab {
    constructor( [ panel, sidebar ] ) {
        this.panel   = panel;
        this.sidebar = sidebar;

        this.name = null;
        this.id   = null;
    }

    /**
     * Render tab header in settings panel sidebar
     */
    render() {
        this.tabHeader = this.sidebar
            .append( 'div' )
            .classed( 'hoot-util-header pad1y center', true )
            .attr( 'data-id', `#${this.id}` )
            .on( 'click', function() {
                Event.send( 'toggle-settings-tab', this );
            } );

        this.tabLabel = this.tabHeader
            .append( 'label' )
            .text( this.name )
            .classed( 'pointer', true )
            .style( 'font-style', 'normal' );

        this.tabWrapper = this.panel.append( 'div' )
            .classed( 'hoot-util-wrapper wrapper fill-light', true )
            .attr( 'id', this.id );

        this.tabBody = this.tabWrapper.append( 'div' )
            .classed( 'hoot-util-content', true );
    }
}