/** ****************************************************************************************************
 * File: LayerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/8/18
 *******************************************************************************************************/

import _   from 'lodash-es';
import API from '../control/api';

class LayerManager {
    constructor() {
        this.context         = null;
        this._layers         = [];
        this._loadedLayers   = {};
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

    set ctx( context ) {
        this.context = context;
    }

    get availableLayers() {
        return _.reduce( this._layers, ( layers, layer ) => {
            layers[ layer.id.toString() ] = layer.name;
            return layers;
        }, {} );
    }

    get loadedLayers() {
        return this._loadedLayers;
    }

    hideLayer( id ) {
        _.find( this._loadedLayers, layer => layer.id === id );
    }

    setLoadedLayer( layer ) {
        this._loadedLayers[ layer.id ] = layer;
    }

    getLoadedLayers( id ) {
        if ( !id ) {
            return this._loadedLayers;
        }

        return this._loadedLayers[ id ];
    }

    removeLoadedLayer( id ) {
        if ( this._loadedLayers[ id ] ) {
            delete this._loadedLayers[ id ];
        }
        _.remove( this._loadedLayers, layer => layer.id === id );
    }

    findLayersBy( key, val ) {
        return _.find( this._layers, layer => layer[ key ] === val );
    }

    findLoadedLayersBy( key, val ) {
        return _.find( this._loadedLayers, layer => layer[ key ] === val );
    }

    getIdByName( layerName ) {
        return this.findLayersBy( 'name', layerName ).id;
    }
}

export default new LayerManager();