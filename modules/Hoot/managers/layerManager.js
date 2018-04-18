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
        this._selectedLayers = [];
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

    /**
     * Get all currently selected datasets
     *
     * @returns {array} - datasets
     */
    get selectedLayers() {
        return this._selectedLayers;
    }

    /**
     * Update list of currently selected layers
     *
     * @param id - id of selected dataset
     * @param clearAll - boolean to determine whether to clear the entire list or not
     */
    updateSelectedLayers( id, clearAll ) {
        if ( clearAll ) {
            this._selectedLayers = [];
        }

        if ( this._selectedLayers.indexOf( id ) > -1 ) {
            _.pull( this._selectedLayers, id );
        } else {
            this._selectedLayers.push( id );
        }
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