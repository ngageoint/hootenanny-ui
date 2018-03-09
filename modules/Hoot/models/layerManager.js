/** ****************************************************************************************************
 * File: LayerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/8/18
 *******************************************************************************************************/

import API from '../util/api';

class LayerManager {
    constructor() {
        this.layers = [];

        this._selectedLayers = [];
    }

    get selectedLayers() {
        return this._selectedLayers;
    }

    set selectedLayers( layers ) {
        this._selectedLayers = layers;
    }

    refreshLayers() {

    }
}