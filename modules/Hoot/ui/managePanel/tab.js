/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

/**
 * Base class that all other managePanel in the settings panel extends from
 */
export default class Tab {
    constructor( instance ) {
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
            .on( 'click', () => this.toggle() );

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

        return this;
    }

    toggle() {
        d3.selectAll( '.tab-header' ).classed( 'strong', false );
        d3.selectAll( '.panel-body' ).classed( 'active', false );

        this.tabHeader.classed( 'strong', true );
        this.panelBody.classed( 'active', true );
    }
}