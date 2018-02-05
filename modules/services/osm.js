import _chunk from 'lodash-es/chunk';
import _each from 'lodash-es/each';
import _extend from 'lodash-es/extend';
import _forEach from 'lodash-es/forEach';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _flatten from 'lodash-es/flatten';
import _groupBy from 'lodash-es/groupBy';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';

import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import {
    osmEntity,
    osmNode,
    osmRelation,
    osmWay
} from '../osm';
import { services } from '../services/index';

import { utilRebind, utilIdleWorker } from '../util';

var dispatch = d3_dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded'),
    useHttps = window.location.protocol === 'https:',
    protocol = useHttps ? 'https:' : 'http:',
    urlroot = protocol + '//www.openstreetmap.org',
    blacklists = ['.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*'],
    inflight = {},
    loadedTiles = {},
    entityCache = {},
    connectionId = 1,
    tileZoom = 16,
    oauth = osmAuth({
        url: urlroot,
        oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
        oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
        loading: authLoading,
        done: authDone
    }),
    rateLimitError,
    userChangesets,
    userDetails,
    off;


function authLoading() {
    dispatch.call('authLoading');
}


function authDone() {
    dispatch.call('authDone');
}


function abortRequest(i) {
    if (i) {
        i.abort();
    }
}


function getLoc(attrs) {
    var lon = attrs.lon && attrs.lon.value,
        lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}


function getNodes(obj, mapId) {
    var elems = obj.getElementsByTagName('nd'),
        nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        nodes[i] = 'n' + elems[i].attributes.ref.value + '_' + mapId;
    }
    return nodes;
}


function getTags(obj) {
    var elems = obj.getElementsByTagName('tag'),
        tags = {};
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        tags[attrs.k.value] = decodeURIComponent(attrs.v.value);
    }

    return tags;
}


function getMembers(obj, mapId) {
    var elems = obj.getElementsByTagName('member'),
        members = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        members[i] = {
            id: attrs.type.value[0] + attrs.ref.value + '_' + mapId,
            type: attrs.type.value,
            role: attrs.role.value
        };
    }
    return members;
}


function getVisible(attrs) {
    return (!attrs.visible || attrs.visible.value !== 'false');
}


var parsers = {
    node: function nodeData(obj, uid, mapId) {
        var attrs = obj.attributes;
        return new osmNode({
            id:osmEntity.id.fromOSM('node', attrs.id.value + '_' + mapId),
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            loc: getLoc(attrs),
            tags: getTags(obj)
        });
    },

    way: function wayData(obj, uid, mapId) {
        var attrs = obj.attributes;
        return new osmWay({
            id: osmEntity.id.fromOSM('way', attrs.id.value + '_' + mapId),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            tags: getTags(obj),
            nodes: getNodes(obj, mapId),
        });
    },

    relation: function relationData(obj, uid, mapId) {
        var attrs = obj.attributes;
        return new osmRelation({
            id: osmEntity.id.fromOSM('relation', attrs.id.value + '_' + mapId),
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            tags: getTags(obj),
            members: getMembers(obj, mapId)
        });
    }
};


function parse(xml, callback, options) {
    options = _extend({ cache: true }, options);
    if (!xml || !xml.childNodes) return;

    var root = xml.childNodes[0],
        children = root.childNodes;
    //Map ID is included in hoot osm xml response
    //append it to entity ids to avoid id collisions
    //between datasets, OSM API datasets get mapid = -1
    var mapId = (root.attributes.mapid) ? root.attributes.mapid.value : -1;

    function parseChild(child) {
        var parser = parsers[child.nodeName];
        if (parser) {
            //Add mapId to uid??
            var uid = osmEntity.id.fromOSM(child.nodeName, child.attributes.id.value);
            if (options.cache && entityCache[uid]) {
                return null;
            }
            return parser(child, uid, mapId);
        }
    }

    utilIdleWorker(children, parseChild, callback);
}

function getUrlRoot(path) {
    return (path.indexOf('mapId') > -1) ? services.hoot.urlroot() : urlroot;
}

function isUrlHoot(path) {
    return path.indexOf('mapId') > -1;
}

export default {

    init: function() {
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        connectionId++;
        userChangesets = undefined;
        userDetails = undefined;
        rateLimitError = undefined;
        _forEach(inflight, abortRequest);
        entityCache = {};
        loadedTiles = {};
        inflight = {};
        return this;
    },


    getConnectionId: function() {
        return connectionId;
    },


    changesetURL: function(changesetId) {
        return urlroot + '/changeset/' + changesetId;
    },


    changesetsURL: function(center, zoom) {
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return urlroot + '/history#map=' +
            Math.floor(zoom) + '/' +
            center[1].toFixed(precision) + '/' +
            center[0].toFixed(precision);
    },


    entityURL: function(entity) {
        return urlroot + '/' + entity.type + '/' + entity.osmId();
    },


    historyURL: function(entity) {
        return urlroot + '/' + entity.type + '/' + entity.osmId() + '/history';
    },


    userURL: function(username) {
        return urlroot + '/user/' + username;
    },


    loadFromAPI: function(path, callback, options) {
        options = _extend({ cache: true }, options);
        var that = this;
        var cid = connectionId;

        function done(err, xml) {
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }

            //We don't authenticate against Hoot services
            var isAuthenticated = isUrlHoot(path) || that.authenticated();

            // 400 Bad Request, 401 Unauthorized, 403 Forbidden
            // Logout and retry the request..
            if (isAuthenticated && err &&
                    (err.status === 400 || err.status === 401 || err.status === 403)) {
                that.logout();
                that.loadFromAPI(path, callback);

            // else, no retry..
            } else {
                // 509 Bandwidth Limit Exceeded, 429 Too Many Requests
                // Set the rateLimitError flag and trigger a warning..
                if (!isAuthenticated && !rateLimitError && err &&
                        (err.status === 509 || err.status === 429)) {
                    rateLimitError = err;
                    dispatch.call('change');
                }

                if (callback) {
                    if (err) return callback(err, null);
                    parse(xml, function (entities) {
                        if (options.cache) {
                            for (var i in entities) {
                                entityCache[entities[i].id] = true;
                            }
                        }
                        callback(null, entities);
                    }, options);
                }
            }
        }

        //We don't authenticate against Hoot services
        if (!isUrlHoot(path) && this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = getUrlRoot(path) + path;
            return d3_xml(url).get(done);
        }
    },


    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id),
            options = { cache: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id),
            options = { cache: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    loadMultiple: function(ids, callback) {
        var that = this;
        //Split feature ids up by maps, then by type
        var mapFeatures = _groupBy(_uniq(ids), osmEntity.id.toHootMapId);
        _forEach(mapFeatures, function(f, m) {
            _forEach(_groupBy(f, osmEntity.id.type), function(v, k) {
                var type = k + 's',
                    osmIDs = _map(v, osmEntity.id.toOSM),
                    options = { cache: false };
              _forEach(_chunk(osmIDs, 150), function(arr) {
                    //Hoot service calls need mapId and use elementIds instead of feature type
                    that.loadFromAPI(
                        '/api/0.6/' + type + '?' + ((m > -1) ? 'elementIds' : type) + '=' + arr.join()
                        + ((m > -1) ? '&mapId=' + m : ''),
                        function(err, entities) {
                            if (callback) callback(err, { data: entities });
                        }
                    );
                });
            });

          });
    },


    authenticated: function() {
        return oauth.authenticated();
    },


    putChangeset: function(changeset, changes, callback) {
        var that = this;
        var cid = connectionId;

        // Create the changeset..
        oauth.xhr({
            method: 'PUT',
            path: '/api/0.6/changeset/create',
            options: { header: { 'Content-Type': 'text/xml' } },
            content: JXON.stringify(changeset.asJXON())
        }, createdChangeset);


        function createdChangeset(err, changeset_id) {
            if (err) {
                return callback(err);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 });
            }

            changeset = changeset.update({ id: changeset_id });

            // Upload the changeset..
            oauth.xhr({
                method: 'POST',
                path: '/api/0.6/changeset/' + changeset_id + '/upload',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.osmChangeJXON(changes))
            }, uploadedChangeset);
        }


        function uploadedChangeset(err) {
            if (err) return callback(err);

            // Upload was successful, safe to call the callback.
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() {
                callback(null, changeset);
            }, 2500);

            // At this point, we don't really care if the connection was switched..
            // Only try to close the changeset if we're still talking to the same server.
            if (that.getConnectionId() === cid) {
                // Still attempt to close changeset, but ignore response because #2667
                oauth.xhr({
                    method: 'PUT',
                    path: '/api/0.6/changeset/' + changeset.id + '/close',
                    options: { header: { 'Content-Type': 'text/xml' } }
                }, function() { return true; });
            }
        }
    },

    //Splits changes and creates a change object per mapid
    splitChanges: function(changes) {
        var splitChangeMap = {};
        d3_map(changes).each(function(value, key) {
            value.forEach(function(e) {
                var mapid = osmEntity.id.toHootMapId(e.id);

                //Newly created features won't have a mapid
                //so assume the reference layer, then if
                //not set, the secondary layer
                if (!mapid) mapid = services.hoot.layerBySource('reference')
                                    || services.hoot.layerBySource('secondary');

                if (!splitChangeMap[mapid]) {
                    //Initialize changes object
                    splitChangeMap[mapid] = d3_keys(changes).reduce(function(prev, curr) {
                        prev[curr] = [];
                        return prev;
                    }, {});
                }
                //Push change change object type array
                splitChangeMap[mapid][key].push(e);
            });
        });

        return splitChangeMap;
    },


    parseChangeset: function(xml) {
        if (!xml || !xml.childNodes) return;

        var mapId = -1,
            root = xml.childNodes[0],
            changeNodes = root.childNodes,
            changes = {
                created: [],
                deleted: [],
                modified: []
            },
            changeKeys = {
                create: 'created',
                delete: 'deleted',
                modify: 'modified'
            };

        for (var j = 0, k = changeNodes.length; j < k; j++) {
            var change = changeNodes[j],
                children = change.childNodes
                type = change.nodeName;

            for (var i = 0, l = children.length; i < l; i++) {
                var child = children[i],
                    parser = parsers[child.nodeName];
               if (parser) {
                    //Temp hack to normalize entity ids
                    child.setAttribute("id", child.getAttribute("id"));
                    changes[changeKeys[type]].push(parser(child, mapId));
                }
            }
        }

        return changes;
    },


    putChangesetHoot: function(changes, version, comment, imageryUsed, callback) {
        var that = this;
        var changesByMapId = this.splitChanges(changes);
        //Make a separate set of changeset calls for each layer
        d3_map(changesByMapId).each(function(changes, mapid) {
            if (parseInt(mapid, 10) > -1) {
                //Call the Hoot API service
                //If Hoot implements OAuth the d3_request should
                //be replaced with oauth.xhr
                d3_request(services.hoot.urlroot() + '/api/0.6/changeset/create?mapId=' + mapid)
                    .header('Content-Type', 'text/xml')
                    .send('PUT', JXON.stringify(that.changesetJXON(that.changesetTags(version, comment, imageryUsed))), function(err, resp) {
                        if (err) return callback(err);
                        var changeset_id = resp.responseText;
                        d3_request(services.hoot.urlroot() + '/api/0.6/changeset/' + changeset_id + '/upload?mapId=' + mapid)
                            .header('Content-Type', 'text/xml')
                            .send('POST', JXON.stringify(that.osmChangeJXON(changeset_id, changes)), function(err, resp) {
                                if (err) return callback(err);
                                // POST was successful, safe to call the callback.
                                // Still attempt to close changeset, but ignore response because #2667
                                // Add delay to allow for postgres replication #1646 #2678
                                window.setTimeout(function() { callback(null, changeset_id); }, 25);
                                d3_request(services.hoot.urlroot() + '/api/0.6/changeset/' + changeset_id + '/close?mapId=' + mapid)
                                    .header('Content-Type', 'text/xml')
                                    .send('PUT', function() { return true; });
                        });
                    });
            } else {
                //Call the OSM API service
                oauth.xhr({
                        method: 'PUT',
                        path: '/api/0.6/changeset/create',
                        options: { header: { 'Content-Type': 'text/xml' } },
                        content: JXON.stringify(that.changesetJXON(that.changesetTags(version, comment, imageryUsed)))
                    }, function(err, changeset_id) {
                        if (err) return callback(err);
                        oauth.xhr({
                            method: 'POST',
                            path: '/api/0.6/changeset/' + changeset_id + '/upload',
                            options: { header: { 'Content-Type': 'text/xml' } },
                            content: JXON.stringify(that.osmChangeJXON(changeset_id, changes))
                        }, function(err) {
                            if (err) return callback(err);
                            // POST was successful, safe to call the callback.
                            // Still attempt to close changeset, but ignore response because #2667
                            // Add delay to allow for postgres replication #1646 #2678
                            window.setTimeout(function() { callback(null, changeset_id); }, 2500);
                            oauth.xhr({
                                method: 'PUT',
                                path: '/api/0.6/changeset/' + changeset_id + '/close',
                                options: { header: { 'Content-Type': 'text/xml' } }
                            }, function() { return true; });
                        });
                    });
            }
        });
    },


    userDetails: function(callback) {
        if (userDetails) {
            callback(undefined, userDetails);
            return;
        }

        var that = this;
        var cid = connectionId;

        function done(err, user_details) {
            if (err) {
                return callback(err);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 });
            }

            var u = user_details.getElementsByTagName('user')[0],
                img = u.getElementsByTagName('img'),
                image_url = '';

            if (img && img[0] && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }

            var changesets = u.getElementsByTagName('changesets'),
                changesets_count = 0;

            if (changesets && changesets[0] && changesets[0].getAttribute('count')) {
                changesets_count = changesets[0].getAttribute('count');
            }

            userDetails = {
                id: u.attributes.id.value,
                display_name: u.attributes.display_name.value,
                image_url: image_url,
                changesets_count: changesets_count
            };

            callback(undefined, userDetails);
        }

        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    },


    userChangesets: function(callback) {
        if (userChangesets) {
            callback(undefined, userChangesets);
            return;
        }

        var that = this;
        var cid = connectionId;

        this.userDetails(function(err, user) {
            if (err) {
                return callback(err);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 });
            }

            function done(err, changesets) {
                if (err) {
                    return callback(err);
                }
                if (that.getConnectionId() !== cid) {
                    return callback({ message: 'Connection Switched', status: -1 });
                }

                userChangesets = Array.prototype.map.call(
                    changesets.getElementsByTagName('changeset'),
                    function (changeset) {
                        return { tags: getTags(changeset) };
                    }
                ).filter(function (changeset) {
                    var comment = changeset.tags.comment;
                    return comment && comment !== '';
                });

                callback(undefined, userChangesets);
            }

            oauth.xhr({ method: 'GET', path: '/api/0.6/changesets?user=' + user.id }, done);
        });
    },


    status: function(callback) {
        var that = this;
        var cid = connectionId;

        function done(xml) {
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 }, 'connectionSwitched');
            }

            // update blacklists
            var elements = xml.getElementsByTagName('blacklist'),
                regexes = [];
            for (var i = 0; i < elements.length; i++) {
                var regex = elements[i].getAttribute('regex');  // needs unencode?
                if (regex) {
                    regexes.push(regex);
                }
            }
            if (regexes.length) {
                blacklists = regexes;
            }


            if (rateLimitError) {
                callback(rateLimitError, 'rateLimited');
            } else {
                var apiStatus = xml.getElementsByTagName('status'),
                    val = apiStatus[0].getAttribute('api');

                callback(undefined, val);
            }
        }

        d3_xml(urlroot + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
    },


    imageryBlacklists: function() {
        return blacklists;
    },


    tileZoom: function(_) {
        if (!arguments.length) return tileZoom;
        tileZoom = _;
        return this;
    },


    loadTiles: function(projection, dimensions, callback) {
        if (off) return;

        var that = this,
            s = projection.scale() * 2 * Math.PI,
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            ts = 256 * Math.pow(2, z - tileZoom),
            origin = [
                s / 2 - projection.translate()[0],
                s / 2 - projection.translate()[1]
            ];

        // Load from visible layers only
        // Hoot loadedLayers is what controls the vector data sources that are loaded
        var visLayers = _filter(_values(services.hoot.loadedLayers()), function (layer) {
            return layer.visible;
        });

        var tiles = _map(visLayers, function (layer) {
            var _tiles = d3_geoTile()
                .scaleExtent([tileZoom, tileZoom])
                .scale(s)
                .size(dimensions)
                .translate(projection.translate())()
                .map(function (tile) {
                    var x = tile[0] * ts - origin[0],
                        y = tile[1] * ts - origin[1];

                    return {
                        id: tile.toString() + ',' + layer.id,
                        extent: geoExtent(
                                    projection.invert([x, y + ts]),
                                    projection.invert([x + ts, y])),
                                mapId: layer.id,
                                layerName: layer.name // even need?
                    };
                });
            return _tiles;
        });

        // flatten visible layer tile arrays to make http requests
        tiles = _flatten(tiles);

        _filter(inflight, function(v, i) {
            var wanted = _find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id;

            if (loadedTiles[id] || inflight[id]) return;

            if (_isEmpty(inflight)) {
                dispatch.call('loading');
            }

            inflight[id] = that.loadFromAPI(
                '/api/0.6/map?bbox=' + tile.extent.toParam() + ((tile.mapId > -1) ? '&mapId=' + tile.mapId : ''),
                function(err, parsed) {
                    delete inflight[id];
                    if (!err) {
                        loadedTiles[id] = true;
                    }

                    if (callback) {
                        callback(err, _extend({ data: parsed }, tile));
                    }

                    if (_isEmpty(inflight)) {
                        dispatch.call('loaded');
                    }
                }
            );
        });
    },

    loadedDataRemove: function(mapid) {
        _each(loadedTiles, function (a, b) {
            if (b.match(',' + mapid + '$')) {
                delete loadedTiles[b];
            }
        });
        dispatch.call('change');
    },


    switch: function(options) {
        urlroot = options.urlroot;

        oauth.options(_extend({
            url: urlroot,
            loading: authLoading,
            done: authDone
        }, options));

        this.reset();
        this.userChangesets(function() {});  // eagerly load user details/changesets
        dispatch.call('change');
        return this;
    },


    toggle: function(_) {
        off = !_;
        return this;
    },


    loadedTiles: function(_) {
        if (!arguments.length) return loadedTiles;
        loadedTiles = _;
        return this;
    },


    logout: function() {
        userChangesets = undefined;
        userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    authenticate: function(callback) {
        var that = this;
        var cid = connectionId;
        userChangesets = undefined;
        userDetails = undefined;

        function done(err, res) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }
            rateLimitError = undefined;
            dispatch.call('change');
            if (callback) callback(err, res);
            that.userChangesets(function() {});  // eagerly load user details/changesets
        }

        return (services.hoot.hasOsmLayer()) ? oauth.authenticate(done) : done();
    }
};
