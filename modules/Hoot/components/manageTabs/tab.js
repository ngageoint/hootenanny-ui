/** ****************************************************************************************************
 * File: tab.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

'use strict';

import Events from '../../util/events';

export default class Tab {
    constructor( [ ctx, jobsBG, sSidebar ] ) {
        this.events          = Events;
        this.context         = ctx;
        this.jobsBG          = jobsBG;
        this.settingsSidebar = sSidebar;

        this.name = null;
        this.id   = null;
    }

    render() {
        const self = this;

        this.tabBody = this.jobsBG.append( 'div' )
            .classed( 'pad2 round-top fill-light pin-left pin-top hoot-util', true )
            .attr( 'id', this.id );

        this.tabHeader = this.settingsSidebar.append( 'div' )
            .classed( 'block strong center margin2 pad1y hoot-util-head', true )
            .attr( 'data', `#${this.id}` )
            .on( 'click', function() {
                self.events.send( 'toggle-manage-tab', this );
            } );

        this.tabLabel = this.tabHeader.append( 'label' )
            .text( this.name )
            .classed( 'point', true )
            .style( 'font-style', 'normal' );
    }
}