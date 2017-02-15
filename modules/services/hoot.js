import * as d3 from 'd3';
import _ from 'lodash';
/*import rbush from 'rbush';
import { utilRebind } from '../util/rebind';
import { d3geoTile } from '../lib/d3.geo.tile';
import { utilDetect } from '../util/detect';
import { geoExtent } from '../geo/index';
import { svgIcon } from '../svg/index';
import { utilQsString } from '../util/index';
*/
import { services } from '../services/index';

var //dispatch = d3.dispatch('loadedImages', 'loadedSigns'),
    loadedData = {}, // added for Hootenanny
    layers = {};


function getAvailLayers(callback) {
    d3.json('/hoot-services/osm/api/0.6/map/layers', function (error, resp) {
        if (error) {
            alert('Get available layers failed!');
            console.log(error);
            callback(null);
        } else {
            layers = resp;
            callback(resp);
        }
    });
}

function loadData(options) {
    var mapid = options.id;
    loadedData[mapid] = options;
    loadedData[mapid].vis = true;
}


export default {

    init: function() {
        // utilRebind(this, dispatch, 'on');
    },

    getLayers: function(){
        return layers;
    },

    availLayers: function(callback){
        var availLayers = getAvailLayers(callback);
    },

    submitLayer: function(lyr, isPrimary, callback){
        //TODO: need to check if another layer is loading

        var color = isPrimary? 'orange' : 'purple';
        if (lyr === ''){return;}

        var key = layers.layers.filter(function(d){return d.name===lyr}).pop();
        loadData(key);
    },

    loadedData: function(){
        return loadedData;
    },

    urlroot: function() {
        return '/hoot-services/osm';
    }
};