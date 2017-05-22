import * as d3 from 'd3';
import _ from 'lodash';
import { services } from '../services/index';
import { geoExtent } from '../geo/index';
import { osmEntity } from '../osm/entity';

var context,
    availableLayers = {}, //A map of key=mapid, value=name
    loadedLayers = {}, //A map of key=mapid, value=layer object
    changes = {}; //A changes object set by deriveChangeset
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
            overlay: true,
            hootlayer: true
        };
    return source;
}

export default {

    init: function(c) {
        context = c;
    },

    changes: function() {
        return changes;
    },

    changesLength: function() {
        return _.size(changes) === 0 ? 0 : changes.created.length + changes.deleted.length + changes.modified.length;
    },

    hasChanges: function() {
        return _.size(changes) > 0;
    },

    availableLayers: function(callback) {
        d3.json(this.urlroot() + '/api/0.6/map/layers', function (error, resp) {
            if (error) {
                alert('Get available layers failed!');
                    //callback(null); Do we even need to callback?
            } else {
                availableLayers = resp.layers.reduce(function(lyrs, lyr) {
                    lyrs[lyr.id] = lyr.name;
                    return lyrs;
                }, {});
                callback(resp.layers);
            }
        });
    },

    reviewStatistics: function(mapid, callback) {
        d3.json('/hoot-services/job/review/statistics?mapId=' + mapid, function (error, resp) {
            return callback(error, resp);
        });
    },

    changesToHistory: function(changes) {
        if (!this.hasChanges()) return;

        var s = [{}, {
            modified: changes.created.concat(changes.modified).map(function(d) {
                return d.id + 'v0';
            }),
            deleted: changes.deleted.map(function(d) {
                return d.id;
            }),
            imageryUsed: ["None"],
            annotation: "Hootenanny conflated."
        }];

        return JSON.stringify({
            version: 3,
            entities: changes.created.concat(changes.modified),
            baseEntities: changes.deleted,
            stack: s,
            nextIDs: osmEntity.id.next,
            index: 1
        });

    },

    deriveChangeset: function(mapid, extent, callback) {
// {
//     "input": "678",
//     "inputtype": "db",
//     "outputtype": "osc",
//     "outputname": "changeset",
//     "USER_ID": "1",
//     "TASK_BBOX": "34.040297648723,31.174810720402537,34.06423943771007,31.186143336347865",
//     "translation": "NONE"
// }
        var json = {
            input: mapid.toString(),
            inputtype: 'db',
            outputtype: 'osc',
            USER_ID: '1',
            TASK_BBOX: extent.toParam(),
            translation: 'NONE',
            textstatus: 'false',
            append: 'false'
        };

        var userid = services.osm.userDetails(function(error, dets) {
            if (error) {
                //console.error(error);
            } else {
                console.log(dets);
            }
        });

        d3.json('/hoot-services/job/export/execute')
            .header("Content-Type", "application/json")
            .post(JSON.stringify(json), function (error, resp) {
                if (error) {
                    alert('Derive changeset failed!');
                } else {
                    services.hoot.pollJob(resp.jobid, function() {
                        d3.xml('/hoot-services/job/export/xml/' + resp.jobid + '?ext=osc', function(data) {
                            //console.log(data);
                            changes = services.osm.parseChangeset(data);
                            //console.log(JSON.stringify(changes));
                            var conflateHistory = services.hoot.changesToHistory(changes);
                            //console.log(conflateHistory);
                            //Remove this delay and coordinate callbacks if necessary
                            if (conflateHistory) {
                                //window.setTimeout(function() {
                                    context.history().fromJSON(conflateHistory, false);
                                //}, 5000);
                            }
                        });
                    });
                }
            });

        callback();

    },

    pollJob: function(jobid, callback) {
        function jobStatus () {
            d3.json('/hoot-services/job/status/' + jobid, function (error, resp) {
                if (error) {
                    clearInterval(job);
                    alert('Job status failed!');
                }
                if (resp.status === 'complete') {
                    clearInterval(job);
                    callback(resp);
                }
                if (resp.status === 'failed') {
                    clearInterval(job);
                    alert('Job ' + jobid + ' failed!');
                }
            });
        }

        var job = setInterval(jobStatus, 2000);
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
                        //The map is empty, so assume a global extent
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
                            var isMerged = Boolean(tags.input1 && tags.input2) || stats.totalCount > 0;

                            //Determine if layer is merged and set colors if so
                            if (isMerged) {
                                //Add source layers to loadedLayers
                                if (tags.input1 && tags.input2) {
                                    loadedLayers[tags.input1] = {
                                        name: tags.input1Name,
                                        id: tags.input1,
                                        color: 'purple',
                                        visible: false,
                                        merged: false
                                    };
                                    loadedLayers[tags.input2] = {
                                        name: tags.input2Name,
                                        id: tags.input2,
                                        color: 'gold',
                                        visible: false,
                                        merged: false
                                    };

                                    //Get extent for source layers
                                    [tags.input1, tags.input2].forEach(function(sourceid) {
                                        d3.json(services.hoot.urlroot() + '/api/0.6/map/mbr?mapId=' + sourceid, function (error, mbr) {
                                            if (error) {
                                                //The map is empty, so assume a global extent
                                                mbr = {
                                                    "minlon":-180,
                                                    "minlat":-90,
                                                    "maxlon":180,
                                                    "maxlat":90,
                                                    "nodescount":0
                                                };
                                            } else {
                                                var min = [mbr.minlon, mbr.minlat],
                                                    max = [mbr.maxlon, mbr.maxlat];

                                                var layerExtent = new geoExtent(min, max);
                                                loadedLayers[sourceid].extent = layerExtent;
                                            }
                                        });
                                    });

                                }
                                //Add css rule to render features by hoot:status
                                // 1 = reference source (purple)
                                // 2 = secondary source (gold)
                                // 3 = merged (active color or pink)
                                services.hoot.setLayerColor(tags.input1 || 1, loadedLayers[tags.input1].color);
                                services.hoot.setLayerColor(tags.input2 || 2, loadedLayers[tags.input2].color);

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
        var ids = [mapid];
        //If merged, delete source layers
        if (loadedLayers[mapid].merged) {
            ids.push(loadedLayers[mapid].tags.input1);
            ids.push(loadedLayers[mapid].tags.input2);
        }
        //Remove internal tracking data
        ids.forEach(function(mapid) { delete loadedLayers[mapid]; });
        //Remove osm vector data
        ids.forEach(services.osm.loadedDataRemove);
        //Remove node-mapnik layer
        context.background().removeSource(mapid);
        //Remove hoot bbox layer
        var hootOverlay = context.layers().layer('hoot');
        if (hootOverlay) {
            hootOverlay.geojson(hootOverlay.geojson().filter(function(d) {
                return d.properties.mapid !== mapid;
            }));
        }

        context.flush();

    },

    toggleMergedLayer: function(mapid) {
        //If merged, swap visibility of merged and input source layers
        if (loadedLayers[mapid].merged) {
            var input1 = loadedLayers[mapid].tags.input1;
            var input2 = loadedLayers[mapid].tags.input2;
            var viz = loadedLayers[mapid].visible;

            loadedLayers[mapid].visible = !viz;
            loadedLayers[input1].visible = viz;
            loadedLayers[input2].visible = viz;

            if (viz) {
                services.osm.loadedDataRemove(mapid);
                console.log('removing ' + mapid);
            } else {
                services.osm.loadedDataRemove(input1);
                services.osm.loadedDataRemove(input2);
                console.log('removing ' + input1 + ' & ' + input2);
            }
            context.flush();  //must do this to remove cached features

            //If an input layer is osm api db, call derive changeset
            //and we're toggling to the osm api layer
            if ((input1 === '-1' || input2 === '-1') && viz) {
                context.connection().on('loaded.hootchangeset', function() {
                    console.log('loaded.hootchangeset');
                    var sourceid = (input1 === '-1') ? input2 : input1;
                    var extent = loadedLayers[sourceid].extent;
                    services.hoot.deriveChangeset(mapid, extent, function() {
                        context.connection().on('loaded.hootchangeset', null);
                    });
                });
            }

        }

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

    decodeHootStatus: function(status) {
        if (status === 'Input1') {
            return 1;
        }
        if (status === 'Input2') {
            return 2;
        }
        if (status === 'Conflated') {
            return 3;
        }

        return parseInt(status);
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

    layerName: function(mapid) {
        return availableLayers[mapid];
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