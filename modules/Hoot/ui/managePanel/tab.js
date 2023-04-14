/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import { selectAll as d3_selectAll } from 'd3-selection';


/**
 * Base class that all other datasets in the settings panel extends from
 */
export default class Tab {
    constructor( instance ) {
        this.container    = instance.container;
        this.panelSidebar = instance.panelSidebar;

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
            .on( 'click', () => this.toggle() );

        this.tabHeader
            .append( 'label' )
            .text( this.name )
            .classed( 'pointer', true )
            .style( 'font-style', 'normal' );

        this.panelBody = this.container
            .append( 'div' )
            .classed( 'panel-body fill-light', true )
            .attr( 'id', this.id );

        this.panelWrapper = this.panelBody
            .append( 'div' )
            .classed( 'panel-wrapper', true );

        return this;
    }

    activate() {
        //To be implemented by subclasses
    }

    deactivate() {
        //To be implemented by subclasses
    }

    toggle( keepSelected ) {
        if ( !keepSelected ) {
            d3_selectAll( '.tab-header' ).classed( 'strong', false );
        }
        d3_selectAll( '.panel-body' ).classed( 'active', false );
        Hoot.ui.managePanel.tabs.forEach( tab => tab.deactivate() );

        this.tabHeader.classed( 'strong', true );
        this.panelBody.classed( 'active', true );
        this.activate();

        Hoot.ui.managePanel.active = this;
    }
}
