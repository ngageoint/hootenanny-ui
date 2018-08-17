/*******************************************************************************************************
 * File: init.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import EventEmitter from 'events';

import Navbar      from './navbar';
import Sidebar     from './sidebar/sidebar';
import ManagePanel from './managePanel/managePanel';

export default class UI extends EventEmitter {
    constructor() {
        super();
    }

    render() {
        Promise.all( [
            new Navbar().render(),
            new Sidebar( this.hoot ).render(),
            new ManagePanel( this.hoot ).render()
        ] ).then( modules => {
            this.navbar  = modules[ 0 ];
            this.sidebar = modules[ 1 ];
        } );
    }

    //async getAboutData() {
    //    try {
    //        let info = await Promise.all( [
    //            Hoot.api.getCoreVersionInfo(),
    //            Hoot.api.getServicesVersionInfo()
    //        ] );
    //
    //        info.forEach( d => Hoot.hootOsm.config.appInfo.push( d ) );
    //    } catch ( e ) {
    //        // TODO: show error
    //        console.log( 'Unable to get Hootenanny core and service info.', e );
    //    }
    //
    //    // build info will always be available
    //    Hoot.hootOsm.config.appInfo.push( buildInfo );
    //}
    //
    //async getMapSizeThresholds() {
    //    try {
    //        let thresholds = await Hoot.api.getMapSizeThresholds();
    //
    //        Hoot.hootOsm.config.exportSizeThreshold   = thresholds.export_threshold;
    //        Hoot.hootOsm.config.ingestSizeThreshold   = thresholds.ingest_threshold;
    //        Hoot.hootOsm.config.conflateSizeThreshold = thresholds.conflate_threshold;
    //    } catch ( e ) {
    //        // TODO: show error
    //        console.log( 'Unable to get Hootenanny core and service info.', e );
    //    }
    //}
}