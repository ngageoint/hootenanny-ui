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
    async refreshLayers() {
        return this._layers = await API.getLayers();
    }

    set ctx( context ) {
        this.context = context;
    }

    get loadedLayers() {
        return this._loadedLayers;
    }

    removeLayer( id ) {
        _.remove( this._layers, layer => layer.id === id );
    }

    removeLoadedLayer( id ) {
        if ( this._loadedLayers[ id ] ) {
            delete this._loadedLayers[ id ];
        }
    }

    hideLayer( id ) {
        _.find( this._loadedLayers, layer => layer.id === id );
    }

    findBy( key, val ) {
        return _.find( this._layers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _.find( this._loadedLayers, layer => layer[ key ] === val );
    }
}

export default new LayerManager();