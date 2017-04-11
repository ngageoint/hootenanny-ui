import * as d3 from 'd3';
import _ from 'lodash';
import { services } from '../services/index';
import { geoExtent } from '../geo/index';

var availableLayers = {}, //A map of key=mapid, value=name
    loadedLayers = {}; //A map of key=mapid, value=layer object

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
            polygon: d.polygon,
            overzoom: false,
            overlay: true
        };
    return source;
}

export default {

    init: function() {

    },

    availableLayers: function(callback) {
        d3.json(this.urlroot() + '/api/0.6/map/layers', function (error, resp) {
            if (error) {
                alert('Get available layers failed!');
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

    reviewStatistics: function(mapid, callback) {
        d3.json('/hoot-services/job/review/statistics?mapId=' + mapid, function (error, resp) {
            return callback(error, resp);
        });
    },

    deriveChangeset: function(mapid, callback) {
        var json = {
            input: mapid,
            inputtype: 'db',
            outputtype: 'osc'
        };

        d3.json('/hoot-services/job/export/execute')
            .post(JSON.stringify(json), function (error, resp) {
                if (error) {
                    alert('Derive changeset failed!');
                    //callback(null);
                } else {
                    console.log(resp);
                }
            });
    },

    loadLayer: function(mapid, source, color, callback) {

        var name = availableLayers[mapid];
        d3.json(services.hoot.urlroot() + '/api/0.6/map/tags?mapid=' + mapid, function (error, tags) {
            if (error) {
                alert('Get map tags failed!');
                //callback(null);
            } else {
                console.log(tags);
                d3.json(services.hoot.urlroot() + '/api/0.6/map/mbr?mapId=' + mapid, function (error, mbr) {
                    if (error) {
                        //The map may is empty, so assume a global extent
                        mbr = {
                            "minlon":-180,
                            "minlat":-90,
                            "maxlon":180,
                            "maxlat":90,
                            "nodescount":0
                        };
                    }

                    services.hoot.reviewStatistics(mapid, function(error, stats) {
                        if (error) {
                            alert('Get review statistics failed!');
                            //callback(null);
                        } else {
                            //mbr response sample
                            //{"minlon":-77.05030495606161,"firstlon":-77.0492105,"maxlat":38.9272,"nodescount":157,"minlat":38.9137226,"firstlat":38.9266803,"maxlon":-77.0301}

                            //Zoom map to layer extent & Add node-mapnik tile layer
                            var min = [mbr.minlon, mbr.minlat],
                                max = [mbr.maxlon, mbr.maxlat];

                            var layerExtent = new geoExtent(min, max);

                            //A layer is merged (the product of conflation) if it has map tag
                            //metadata indicating the two input sources or if it has reviews
                            //This calculation will miss a layer that has been exported (and loses
                            //its map metadata tags) and never had reviews.
                            var isMerged = (tags.input1 && tags.input2) || stats.totalCount > 0;

                            //Determine if layer is merged and set colors if so
                            if (isMerged) {
                                //Add css rule to render features by hoot:status
                                // 1 = reference source (purple)
                                // 2 = secondary source (gold)
                                // 3 = merged (active color or pink)
                                services.hoot.setLayerColor(tags.input1 || 1, 'purple');
                                services.hoot.setLayerColor(tags.input2 || 2, 'gold');
                            }

                            //Store info on the loaded layer
                            loadedLayers[mapid] = {
                                name: name,
                                id: mapid,
                                polygon: [layerExtent.polygon()],
                                color: color,
                                source: source,
                                tags: tags,
                                visible: true,
                                merged: isMerged
                            };

                            //Add css rule to render features by layer mapid
                            services.hoot.setLayerColor(mapid, color);

                            //Issue callback passing extent and node-mapnik background source and
                            //possibly a new layer color (green) if loaded layer is merged
                            if (callback) callback(layerExtent, getNodeMapnikSource(loadedLayers[mapid]), color);
                        }
                    });
                });
            }
        });
    },

    removeLayer: function(mapid) {
        delete loadedLayers[mapid];
    },

    changeLayerColor: function(lyrmenu, callback) {
        var lyr = d3.values(loadedLayers).find(function(d) {
            return d.source === lyrmenu.id;
        });
        if (lyr) {
            var mapid = lyr.id;
            loadedLayers[mapid].color = lyrmenu.color;
            services.hoot.setLayerColor(mapid, lyrmenu.color);
            if (callback) {
                callback(getNodeMapnikSource(loadedLayers[mapid]));
            }
        }
    },

    loadedLayers: function() {
        return loadedLayers;
    },

    layerBySource: function(s) {
        return d3.values(loadedLayers).find(function(d) {
            return d.source === s;
        }).id;
    },

    hasLayers: function() {
        return d3.map(loadedLayers).size() > 0;
    },

    hasOsmLayer: function() {
        return loadedLayers[-1];
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
        // }, {
        //         name: 'osm',
        //         hex: ''
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

    setLayerColor: function(mapid, color) {
        var sheets = document.styleSheets[document.styleSheets.length - 1];

        //Delete existing rules for mapid
        for (var i = 0; i < sheets.cssRules.length; i++) {
            var rule = sheets.cssRules[i];
            if (rule.cssText.includes('tag-hoot-' + mapid))
                sheets.deleteRule(i);
        }

        //Insert new color rules for mapid
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