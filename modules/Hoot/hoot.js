/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import LayerManager from './managers/layerManager';
import HootOSM      from './managers/hootOsm';
import Navbar       from './ui/navbar';
import Sidebar      from './ui/sidebar';
import ManagePanel  from './ui/managePanel';
import API          from './managers/api';

import buildInfo     from './config/buildInfo.json';

/**
 * Entry point for Hoot UI
 */
export default class Hoot {
    constructor( context ) {
        this.context   = context;
        this.container = context.container();
    }

    init() {
        LayerManager.ctx = this.context;
        HootOSM.ctx      = this.context;

        this.getAboutData();

        Promise.all( [
            new Navbar().render(),
            new ManagePanel( this.context ).render(),
            new Sidebar( this.context ).render()
        ] ).then( modules => {
            this.navbar      = modules[ 0 ];
            this.managePanel = modules[ 1 ];
            this.sidebar     = modules[ 2 ];
        } );
    }

    async getAboutData() {
        try {
            let info = await Promise.all( [
                API.getCoreVersionInfo(),
                API.getServicesVersionInfo()
            ] );

            info.forEach( d => HootOSM.appInfo.push( d ) );
        } catch( e ) {
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }

        // build info will always be available
        HootOSM.appInfo.push( buildInfo );
    }
}