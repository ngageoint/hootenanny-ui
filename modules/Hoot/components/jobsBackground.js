/** ****************************************************************************************************
 * File: jobsBackground.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

import _ from 'lodash-es';

import Events from '../util/events';
import manageTabs from 'manageTabs/index';

export default class JobsBackground {
    constructor( context ) {
        this.context    = context;
        this.events     = Events;
        this.manageTabs = manageTabs;

        this.container = context.container();
    }

    listen() {
        this.events.listen( 'toggle-manage-tab', this.toggleTab, this );
    }

    toggleTab( d ) {
        console.log( d );
    }

    async renderContainer() {
        this.jobsBG = this.container
            .append( 'div' )
            .attr( 'id', 'jobsBG' )
            .classed( 'col12 pin-bottom pin-top hidden', true )
            .style( 'position', 'absolute' )
            .style( 'top', '60px' )
            .style( 'z-index', 999 );

        this.settingsSidebar = this.jobsBG
            .append( 'div' )
            .attr( 'id', 'settingsSidebar' )
            .classed( 'pad2 pin-bottom pin-top fill-light keyline-right', true );
    }

    async init() {

        //this.$jobsBG = this.$body
        //    .append( 'div' )
        //    .attr( 'id', 'jobsBG' )
        //    .classed( 'col12 pin-bottom pin-top hidden', true )
        //    .style( 'position', 'absolute' )
        //    .style( 'top', '60px' )
        //    .style( 'z-index', 999 );
        //
        //this.$settingsSidebar = this.$jobsBG
        //    .append( 'div' )
        //    .attr( 'id', 'settingsSidebar' )
        //    .classed( 'pad2 pin-bottom pin-top fill-light keyline-right', true );

        this.listen();

        this.renderContainer()
            .then( () => _.map( this.manageTabs, Tab => {
                let tab = new Tab( this.context, this.jobsBG, this.settingsSidebar );
                tab.init();
                //tab.init( this.$jobsBG, this.$settingsSidebar )
            } ) );
    }
}