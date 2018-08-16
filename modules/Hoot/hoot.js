/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import API          from './managers/api';
import LayerManager from './managers/layerManager';
import HootOSM      from './managers/hootOsm';
import Navbar       from './ui/navbar';
import Sidebar      from './ui/sidebar/sidebar';
import ManagePanel  from './ui/managePanel/managePanel';

import buildInfo from './config/buildInfo.json';

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
        this.getMapSizeThresholds();

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

            info.forEach( d => HootOSM.config.appInfo.push( d ) );
        } catch ( e ) {
            // TODO: show error
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }

        // build info will always be available
        HootOSM.config.appInfo.push( buildInfo );
    }

    async getMapSizeThresholds() {
        try {
            let thresholds = await API.getMapSizeThresholds();

            HootOSM.config.exportSizeThreshold   = thresholds.export_threshold;
            HootOSM.config.ingestSizeThreshold   = thresholds.ingest_threshold;
            HootOSM.config.conflateSizeThreshold = thresholds.conflate_threshold;
        } catch ( e ) {
            // TODO: show error
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }
    }
}