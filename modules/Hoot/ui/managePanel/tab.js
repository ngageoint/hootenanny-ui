/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import EventEmitter from 'events';

/**
 * Base class that all other managePanel in the settings panel extends from
 */
export default class Tab extends EventEmitter {
    constructor( instance ) {
        super();

        this.panelSidebar = instance.panelSidebar;
        this.panel        = instance.panel;

        this.name = null;
        this.id   = null;
    }

    /**
     * Render tab header in settings panel sidebar
     */
    render() {
        let that = this;

        this.tabHeader = this.panelSidebar
            .append( 'div' )
            .classed( 'tab-header pad1y center', true )
            .attr( 'data-id', `#${this.id}` )
            .on( 'click', function() {
                that.emit( 'toggle', this );
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

        return this;
    }
}