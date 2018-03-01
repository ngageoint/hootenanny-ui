/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

'use strict';

import Events from '../../util/events';

export default class Tab {
    constructor( [ ctx, panel, sidebar ] ) {
        this.events  = Events;
        this.context = ctx;
        this.panel   = panel;
        this.sidebar = sidebar;

        this.name = null;
        this.id   = null;
    }

    render() {
        const self = this;

        this.tabHeader = this.sidebar
            .append( 'div' )
            .classed( 'hoot-util-header pad1y center', true )
            .attr( 'data', `#${this.id}` )
            .on( 'click', function() {
                self.events.send( 'toggle-manage-tab', this );
            } );

        this.tabLabel = this.tabHeader
            .append( 'label' )
            .text( this.name )
            .classed( 'pointer', true )
            .style( 'font-style', 'normal' );

        this.tabBody = this.panel.append( 'div' )
            .classed( 'hoot-util fill-light', true )
            .attr( 'id', this.id );
    }
}