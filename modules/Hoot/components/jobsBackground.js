/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

class JobsBackground {
    constructor( context ) {
        this.$container = context.container();

        this.defaultTab = null;
    }

    init() {
        this.$jobsBG = this.$container
            .append( 'div' )
            .attr( 'id', 'jobsBG' )
            .classed( 'col12 pin-bottom pin-top hidden', true )
            .style( 'position', 'absolute' )
            .style( 'top', '60px' )
            .style( 'z-index', 999 );

        this.$settingsSidebar = this.$jobsBG
            .append( 'div' )
            .attr( 'id', 'settingsSidebar' )
            .classed( 'pad2 pin-bottom pin-top fill-light keyline-right', true );
    }
}

export default JobsBackground;