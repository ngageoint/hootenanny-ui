import * as d3 from 'd3';
import _ from 'lodash';
import { services } from '../services/index';

var availableLayers = {},
    loadedLayers = {};

export default {

    init: function() {

    },

    availableLayers: function(callback) {
        d3.json(this.urlroot() + '/api/0.6/map/layers', function (error, resp) {
            if (error) {
                alert('Get available layers failed!');
                console.log(error);
                    //callback(null); Do we even need to callback?
            } else {
                callback(resp);
                    availableLayers = resp.layers.reduce(function(lyrs, lyr) {
                        lyrs[lyr.name] = lyr.id;
                        return lyrs;
                    }, {});
            }
        });
    },

    loadLayer: function(name, isPrimary, callback) {
        //TODO: need to check if another layer is loading

        var color = isPrimary ? 'orange' : 'purple';

        var mapid = availableLayers[name];
        d3.json(services.hoot.urlroot() + '/api/0.6/map/tags?mapid=' + mapid, function (error, tags) {
            if (error) {
                alert('Get map tags failed!');
                console.log(error);
                //callback(null);
            } else {
                console.log(tags);
                d3.json(services.hoot.urlroot() + '/api/0.6/map/mbr?mapId=' + mapid, function (error, mbr) {
                    if (error) {
                        alert('Get map extent failed!');
                        console.log(error);
                        //callback(null);
                    } else {
                        loadedLayers[mapid] = {
                            name: name,
                            id: mapid,
                            visible: true
                        };
                        if (tags) {

                        }
                        services.hoot.changeLayerColor(mapid, color);
                        //{"minlon":-104.919758616214,"firstlon":-104.901787686059,"maxlat":39.5944194033785,"nodescount":117,"minlat":38.8467218120797,"firstlat":38.854331920123,"maxlon":-104.714569365207}
                        var min = [mbr.minlon, mbr.minlat],
                            max = [mbr.maxlon, mbr.maxlat];
                        //rendererMap.extent(min, max);
                        if (callback) callback([min, max]);
                    }
                });
            }
        });
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
        if (obj===undefined) {
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