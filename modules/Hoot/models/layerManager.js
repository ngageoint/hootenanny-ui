/** ****************************************************************************************************
 * File: LayerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/8/18
 *******************************************************************************************************/

import API from '../util/api';

class LayerManager {
    constructor() {
        this.context         = null;
        this.layers          = [];
        this._selectedLayers = [];
    }

    get selectedLayers() {
        return this._selectedLayers;
    }

    set selectedLayers( layers ) {
        this._selectedLayers = layers;
    }

    set ctx( context ) {
        this.context = context;
    }

    addLayerAndCenter( key, resp ) {
        key.mapId = key.id;
        this.context.connection().loadData( key );
    }

    addLayer( key ) {
        console.log( this.context );
        let mapId = key.id;

        return API.getMbr( mapId ).then( resp => {
            this.addLayerAndCenter( key, resp );
        } );
    }
}

export default new LayerManager();
// #background=Bing&map=16.20/-74.04453/40.68922