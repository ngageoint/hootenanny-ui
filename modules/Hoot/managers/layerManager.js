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

    get layers() {
        return this._layers;
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

    removeLoadedLayer( id ) {
        if ( this._loadedLayers[ id ] ) {
            delete this._loadedLayers[ id ];
        }
    }

    findBy( key, val ) {
        return _.find( this._layers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _.find( this._loadedLayers, layer => layer[ key ] === val );
    }
}

export default new LayerManager();