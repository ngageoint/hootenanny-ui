import * as d3 from 'd3';
import _ from 'lodash';
import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { d3geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo/index';
import { osmEntity, osmNode, osmRelation, osmWay } from '../osm/index';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util/rebind';
import { services } from '../services/index';


var dispatch = d3.dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded'),
    useHttps = window.location.protocol === 'https:',
    protocol = useHttps ? 'https:' : 'http:',
    urlroot = protocol + '//www.openstreetmap.org',
    blacklists = ['.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*'],
    inflight = {},
    loadedTiles = {},
    tileZoom = 16,
    oauth = osmAuth({
        url: urlroot,
        oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
        oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
        loading: authLoading,
        done: authDone
    }),
    rateLimitError,
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
    node: function nodeData(obj, mapId) {
        var attrs = obj.attributes;
        return new osmNode({
            id: osmEntity.id.fromOSM('node', attrs.id.value + '_' + mapId),
            loc: getLoc(attrs),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            visible: getVisible(attrs)
        });
    },

    way: function wayData(obj, mapId) {
        var attrs = obj.attributes;
        return new osmWay({
            id: osmEntity.id.fromOSM('way', attrs.id.value + '_' + mapId),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            nodes: getNodes(obj, mapId),
            visible: getVisible(attrs)
        });
    },

    relation: function relationData(obj, mapId) {
        var attrs = obj.attributes;
        return new osmRelation({
            id: osmEntity.id.fromOSM('relation', attrs.id.value + '_' + mapId),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            members: getMembers(obj, mapId),
            visible: getVisible(attrs)
        });
    }
};


function parse(xml) {
    if (!xml || !xml.childNodes) return;

    var root = xml.childNodes[0],
        children = root.childNodes,
        entities = [];
    //Map ID is included in hoot osm xml response
    //append it to entity ids to avoid id collisions
    //between datasets, OSM API datasets get mapid = -1
    var mapId = (root.attributes.mapid) ? root.attributes.mapid.value : -1;

    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i],
            parser = parsers[child.nodeName];
        if (parser) {
            entities.push(parser(child, mapId));
        }
    }

    return entities;
}

function getUrlRoot(path) {
    return (path.indexOf('mapId') > -1) ? services.hoot.urlroot() : urlroot;
}

export default {

    init: function() {
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        userDetails = undefined;
        rateLimitError = undefined;
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return this;
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


    userURL: function(username) {
        return urlroot + '/user/' + username;
    },


    loadFromAPI: function(path, callback) {
        var that = this;

        function done(err, xml) {
            var isAuthenticated = that.authenticated();

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
                    callback(err, parse(xml));
                }
            }
        }

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = getUrlRoot(path) + path;
            return d3.xml(url).get(done);
        }
    },


    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            }
        );
    },


    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            }
        );
    },


    loadMultiple: function(ids, callback) {
        var that = this;
        _.each(_.groupBy(_.uniq(ids), osmEntity.id.type), function(v, k) {
            var type = k + 's',
                osmIDs = _.map(v, osmEntity.id.toOSM);

            _.each(_.chunk(osmIDs, 150), function(arr) {
                that.loadFromAPI(
                    '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, { data: entities });
                    }
                );
            });
        });
    },


    authenticated: function() {
        return oauth.authenticated();
    },


    // Generate Changeset XML. Returns a string.
    changesetJXON: function(tags) {
        return {
            osm: {
                changeset: {
                    tag: _.map(tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.6,
                    '@generator': 'Hootenanny'
                }
            }
        };
    },


    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    osmChangeJXON: function(changeset_id, changes) {
        function nest(x, order) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            var ordered = {};
            order.forEach(function(o) {
                if (groups[o]) ordered[o] = groups[o];
            });
            return ordered;
        }

        function rep(entity) {
            return entity.asJXON(changeset_id);
        }

        return {
            osmChange: {
                '@version': 0.6,
                '@generator': 'iD',
                'create': nest(changes.created.map(rep), ['node', 'way', 'relation']),
                'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                'delete': _.extend(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), {'@if-unused': true})
            }
        };
    },


    changesetTags: function(version, comment, imageryUsed) {
        var detected = utilDetect(),
            tags = {
                created_by: ('iD ' + version).substr(0, 255),
                imagery_used: imageryUsed.join(';').substr(0, 255),
                host: detected.host.substr(0, 255),
                locale: detected.locale.substr(0, 255)
            };

        if (comment) {
            tags.comment = comment.substr(0, 255);
        }

        return tags;
    },


    //Splits changes and creates a change object per mapid
    splitChanges: function(changes) {
        var splitChangeMap = {};
        d3.map(changes).each(function(value, key) {
            value.forEach(function(e) {
                var mapid = e.id.split('_')[1];
                if (!splitChangeMap[mapid]) {
                    //Initialize changes object
                    splitChangeMap[mapid] = d3.keys(changes).reduce(function(prev, curr) {
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


    putChangeset: function(changes, version, comment, imageryUsed, callback) {
        var that = this;
        var changesByMapId = this.splitChanges(changes);
        //Make a separate set of changeset calls for each layer
        d3.map(changesByMapId).each(function(changes, mapid) {
            if (mapid > -1) {
                //Call the Hoot API service
                //If Hoot implements OAuth the d3.request should
                //be replaced with oauth.xhr
                d3.request(services.hoot.urlroot + '/api/0.6/changeset/create?mapId=' + mapid)
                    .header('Content-Type', 'text/xml')
                    .put(JXON.stringify(that.changesetJXON(that.changesetTags(version, comment, imageryUsed))), function(err, changeset_id) {
                        if (err) return callback(err);
                        d3.request(services.hoot.urlroot + '/api/0.6/changeset/' + changeset_id + '/upload?mapId=' + mapid)
                            .header('Content-Type', 'text/xml')
                            .post(JXON.stringify(that.osmChangeJXON(changeset_id, changes)), function(err) {
                                if (err) return callback(err);
                                // POST was successful, safe to call the callback.
                                // Still attempt to close changeset, but ignore response because #2667
                                // Add delay to allow for postgres replication #1646 #2678
                                window.setTimeout(function() { callback(null, changeset_id); }, 2500);
                                d3.request(services.hoot.urlroot + '/api/0.6/changeset/' + changeset_id + '/close?mapId=' + mapid)
                                    .header('Content-Type', 'text/xml')
                                    .put(function() { return true; });
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

        function done(err, user_details) {
            if (err) return callback(err);

            var u = user_details.getElementsByTagName('user')[0],
                img = u.getElementsByTagName('img'),
                image_url = '';

            if (img && img[0] && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }

            userDetails = {
                display_name: u.attributes.display_name.value,
                image_url: image_url,
                id: u.attributes.id.value
            };

            callback(undefined, userDetails);
        }

        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    },


    userChangesets: function(callback) {
        this.userDetails(function(err, user) {
            if (err) {
                callback(err);
                return;
            }

            function done(err, changesets) {
                if (err) {
                    callback(err);
                } else {
                    callback(undefined, Array.prototype.map.call(changesets.getElementsByTagName('changeset'),
                        function (changeset) {
                            return { tags: getTags(changeset) };
                        }
                    ));
                }
            }

            oauth.xhr({ method: 'GET', path: '/api/0.6/changesets?user=' + user.id }, done);
        });
    },


    status: function(callback) {
        function done(xml) {
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

        d3.xml(urlroot + '/api/capabilities').get()
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
        var visLayers = _.filter(d3.values(services.hoot.loadedLayers()), function (layer) {
            return layer.visible;
        });

        var tiles = _.map(visLayers, function (layer) {
            var _tiles = d3geoTile()
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
        tiles = _.flatten(tiles);

        _.filter(inflight, function(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id;

            if (loadedTiles[id] || inflight[id]) return;

            if (_.isEmpty(inflight)) {
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
                        callback(err, _.extend({ data: parsed }, tile));
                    }

                    if (_.isEmpty(inflight)) {
                        dispatch.call('loaded');
                    }
                }
            );
        });
    },

    loadedDataRemove: function(mapid) {
        _.each(loadedTiles, function (a, b) {
            if (b.match(',' + mapid + '$')) {
                delete loadedTiles[b];
            }
        });
        dispatch.call('change');
    },


    switch: function(options) {
        urlroot = options.urlroot;

        oauth.options(_.extend({
            url: urlroot,
            loading: authLoading,
            done: authDone
        }, options));
        dispatch.call('change');
        this.reset();
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
        userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    authenticate: function(callback) {
        userDetails = undefined;
        function done(err, res) {
            rateLimitError = undefined;
            dispatch.call('change');
            if (callback) callback(err, res);
        }
        return oauth.authenticate(done);
    }
};
