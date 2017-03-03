import * as d3 from 'd3';
import _ from 'lodash';
import { services } from '../services/index';

var availableLayers = {},
    loadedLayers = {};

function getNodeMapnikSource(d) {
    var source = {
            name: d.name,
            id: d.id,
            type: 'tms',
            description: d.name,
            template: window.location.protocol + '//' + window.location.hostname
                //+ Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.nodeMapnikServerPort)
                + ':8000'
                + '/?z={zoom}&x={x}&y={-y}&color='
                + encodeURIComponent(services.hoot.palette(d.color))
                + '&mapid=' + d.id,
            scaleExtent: [0,16],
            overzoom: false,
            overlay: true
        };
    return source;
}


export default {

    init: function() {

    },

    // getAvailableLayers: function() {
    //     return availableLayers;
    // },

    availableLayers: function(callback) {
        d3.json(this.urlroot() + '/api/0.6/map/layers', function (error, resp) {
            if (error) {
                alert('Get available layers failed!');
                console.log(error);
                    //callback(null); Do we even need to callback?
            } else {
                callback(resp.layers);
                    availableLayers = resp.layers.reduce(function(lyrs, lyr) {
                        lyrs[lyr.id] = lyr.name;
                        return lyrs;
                    }, {});
            }
        });
    },

    loadLayer: function(mapid, isPrimary, callback) {

        var color = isPrimary ? 'violet' : 'orange';

        var name = availableLayers[mapid];
        d3.json(services.hoot.urlroot() + '/api/0.6/map/tags?mapid=' + mapid, function (error, tags) {
            if (error) {
                alert('Get map tags failed!');
                console.log(error);
                //callback(null);
            } else {
                //console.log(tags);
                d3.json(services.hoot.urlroot() + '/api/0.6/map/mbr?mapId=' + mapid, function (error, mbr) {
                    if (error) {
                        alert('Get map extent failed!');
                        console.log(error);
                        //callback(null);
                    } else {
                        loadedLayers[mapid] = {
                            name: name,
                            id: mapid,
                            color: color,
                            visible: true
                        };
                        if (tags) {

                        }
                        //Add css rule to render features
                        services.hoot.changeLayerColor(mapid, color);
                        //Zoom map to layer extent & Add node-mapnik tile layer
                        var min = [mbr.minlon, mbr.minlat],
                            max = [mbr.maxlon, mbr.maxlat];
                        if (callback) callback([min, max], getNodeMapnikSource(loadedLayers[mapid]));
                    }
                });
            }
        });
    },

    removeLayer: function(mapid, callback) {
        var lyr = loadedLayers[mapid];
        delete loadedLayers[mapid];
        if (callback) {
            callback(getNodeMapnikSource(lyr));
        }
    },

    loadedLayers: function() {
        return loadedLayers;
    },

    palette: function(co) {
        var palette = [{
                name: 'gold',
                hex: '#ffcc00'
        }, {
                name: 'orange',
                hex: '#ff7f2a'
        }, {
                name: 'violet',
                hex: '#ff5599'
        }, {
                name: 'purple',
                hex: '#e580ff'
        }, {
                name: 'blue',
                hex: '#5fbcd3'
        }, {
                name: 'teal',
                hex: '#5fd3bc'
        }, {
                name: 'green',
                hex: '#A7C973'
        }, {
                name: 'osm',
                hex: ''
        }];
        if (!co) return palette;
        var obj = _.find(palette, function(a) {
            return a.name === co || a.hex === co;
        });
        if (obj === undefined) {
            obj = palette[1];
            co = obj.name;
        }
        return (obj.name === co) ? obj.hex : obj.name;
    },

    changeLayerColor: function(mapid, color) {
        var sheets = document.styleSheets[document.styleSheets.length - 1];
        color = this.palette(color);
        var lighter = d3.rgb(color).brighter();
        sheets.insertRule('path.stroke.tag-hoot-' + mapid + ' { stroke:' + color + '}', sheets.cssRules.length - 1);
        sheets.insertRule('path.shadow.tag-hoot-' + mapid + ' { stroke:' + lighter + '}', sheets.cssRules.length - 1);
        sheets.insertRule('path.fill.tag-hoot-' + mapid + ' { fill:' + lighter + '}', sheets.cssRules.length - 1);
        sheets.insertRule('g.point.tag-hoot-' + mapid + ' .stroke { fill:' + color + '}', sheets.cssRules.length - 1);
    },

    urlroot: function() {
        return '/hoot-services/osm';
    }
};