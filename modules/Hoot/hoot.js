/*******************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import EventEmitter from 'events';

import LayerManager    from './managers/layerManager';
import API             from './managers/api';
import ResponseManager from './managers/responseManager';
import FolderManager   from './managers/folderManager';
import HootOSM         from './managers/hootOsm';
import UI              from './ui/init';
import buildInfo       from './config/buildInfo.json';

class Hoot extends EventEmitter {
    constructor() {
        super();

        this.api      = new API( this );
        this.response = new ResponseManager( this );
        this.layers   = new LayerManager( this );
        this.folders  = new FolderManager( this );
        this.hootOsm  = new HootOSM( this );
    }

    init( context ) {
        if ( this.ui && this.ui instanceof UI ) return;

        this.context = context;

        this.getAboutData();
        this.getMapSizeThresholds();

        this.ui = new UI();

        this.ui.render();
    }

    async getAboutData() {
        try {
            let info = await Promise.all( [
                this.api.getCoreVersionInfo(),
                this.api.getServicesVersionInfo()
            ] );

            info.forEach( d => this.hootOsm.config.appInfo.push( d ) );
        } catch ( e ) {
            // TODO: show error
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }

        // build info will always be available
        this.hootOsm.config.appInfo.push( buildInfo );
    }

    async getMapSizeThresholds() {
        try {
            let thresholds = await this.api.getMapSizeThresholds();

            this.hootOsm.config.exportSizeThreshold   = thresholds.export_threshold;
            this.hootOsm.config.ingestSizeThreshold   = thresholds.ingest_threshold;
            this.hootOsm.config.conflateSizeThreshold = thresholds.conflate_threshold;
        } catch ( e ) {
            // TODO: show error
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }
    }
}

export default new Hoot();