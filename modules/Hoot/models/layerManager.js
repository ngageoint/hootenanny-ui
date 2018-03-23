/** ****************************************************************************************************
 * File: LayerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/8/18
 *******************************************************************************************************/

import API from '../util/api';
import _ from 'lodash-es';

class LayerManager {
    constructor() {
        this.context          = null;
        this._layers          = [];
        this._availableLayers = [];
        this._selectedLayers  = [];
    }

    /**
     * Retrieve layers from database
     */
    refreshLayers() {
        return API.getLayers()
            .then( data => {
                this._layers = data;

                return data;
            } );
    }

    get selectedLayers() {
        return this._selectedLayers;
    }

    get availableLayers() {
        return _.reduce( this._layers, ( layers, layer ) => {
            layers[ layer.id.toString() ] = layer.name;
            return layers;
        }, {} );
    }

    set selectedLayers( layers ) {
        this._selectedLayers = layers;
    }

    set ctx( context ) {
        this.context = context;
    }

    addLayerAndCenter( key, resp ) {
        key.mapId = key.id;
        //this.context.connection().loadData( key );
    }

    addLayer( key ) {
        let mapId = key.id;

        return API.getMbr( mapId ).then( resp => {
            this.addLayerAndCenter( key, resp );
        } );
    }
}

export default new LayerManager();