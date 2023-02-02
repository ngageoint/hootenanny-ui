import _chunk from 'lodash-es/chunk';
import _cloneDeep from 'lodash-es/cloneDeep';
import _extend from 'lodash-es/extend';
import _forEach from 'lodash-es/forEach';
import _find from 'lodash-es/find';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _groupBy from 'lodash-es/groupBy';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';
import _throttle from 'lodash-es/throttle';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';
import _reduce from 'lodash-es/reduce';
import _includes from 'lodash-es/includes';

import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-fetch';
import axios from 'axios/dist/axios';

import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { geoExtent, geoVecAdd } from '../geo';

import {
    osmEntity,
    osmNode,
    osmNote,
    osmRelation,
    osmWay
} from '../osm';

import {
    utilRebind,
    utilTiler,
    utilQsString
} from '../util';

import { baseUrl as hootBaseUrl, maxNodeCount } from '../Hoot/config/apiConfig';

var tiler = utilTiler();
var dispatch = d3_dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded', 'loadedNotes');
// var urlroot = 'https://www.openstreetmap.org';
var urlroot = hootBaseUrl + '/osm';
var oauth = osmAuth({
    url: urlroot,
    oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
    oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
    loading: authLoading,
    done: authDone
});

// short circuit osm oauth when
// not in mocha test mode
// This makes Hoot unable to write to an OSM API
// for the time being, we probably want to restore
// the functionality from https://github.com/ngageoint/hootenanny-ui/blob/007797598b97d66456c4c852d054c780ab3d062e/modules/services/osm.js#L491-L547
if (!window.mocha) {
    oauth.authenticated = function() {
        return true;
    };
}

var _blacklists = ['.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*'];
var _tileCache = { loaded: {}, inflight: {}, seen: {} };
var _nodeCountCache = { loaded: {}, loading: {} /*inflight*/ };
var _noteCache = { loaded: {}, inflight: {}, inflightPost: {}, note: {}, rtree: new RBush() };
var _userCache = { toLoad: {}, user: {} };
var _changeset = {};

var _connectionID = 1;
var _tileZoom = 16;
var _noteZoom = 12;
var _rateLimitError;
var _userChangesets;
var _userDetails;
var _off;
var _maxNodeCount = maxNodeCount;


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


function abortUnwantedRequests(cache, tiles) {
    _forEach(cache.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) { return k === tile.id; });
        if (!wanted) {
            abortRequest(v);
            delete cache.inflight[k];
        }
    });
}


function getLoc(attrs) {
    var lon = attrs.lon && attrs.lon.value;
    var lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}


function getNodes(obj, mapId) {
    var elems = obj.getElementsByTagName('nd');
    var nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        nodes[i] = 'n' + elems[i].attributes.ref.value + '_' + mapId;
    }
    return nodes;
}


function getTags(obj) {
    var elems = obj.getElementsByTagName('tag');
    var tags = {};
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        tags[attrs.k.value] = decodeURIComponent(attrs.v.value);
    }

    return tags;
}


function getMembers(obj, mapId) {
    var elems = obj.getElementsByTagName('member');
    var members = new Array(elems.length);
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


function parseComments(comments) {
    var parsedComments = [];

    // for each comment
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        if (comment.nodeName === 'comment') {
            var childNodes = comment.childNodes;
            var parsedComment = {};

            for (var j = 0; j < childNodes.length; j++) {
                var node = childNodes[j];
                var nodeName = node.nodeName;
                if (nodeName === '#text') continue;
                parsedComment[nodeName] = node.textContent;

                if (nodeName === 'uid') {
                    var uid = node.textContent;
                    if (uid && !_userCache.user[uid]) {
                        _userCache.toLoad[uid] = true;
                    }
                }
            }

            if (parsedComment) {
                parsedComments.push(parsedComment);
            }
        }
    }
    return parsedComments;
}


function encodeNoteRtree(note) {
    return {
        minX: note.loc[0],
        minY: note.loc[1],
        maxX: note.loc[0],
        maxY: note.loc[1],
        data: note
    };
}


var parsers = {
    node: function nodeData(obj, uid, mapId) {
        var attrs = obj.attributes;
        return new osmNode({
            id: uid,
            origid: 'n' + attrs.id.value,
            mapId: mapId,
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
            id: uid,
            origid: 'w' + attrs.id.value,
            mapId: mapId,
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
            id: uid,
            origid: 'r' + attrs.id.value,
            mapId: mapId,
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            tags: getTags(obj),
            members: getMembers(obj, mapId)
        });
    },

    note: function parseNote(obj, uid) {
        var attrs = obj.attributes;
        var childNodes = obj.childNodes;
        var props = {};

        props.id = uid;
        props.loc = getLoc(attrs);

        // if notes are coincident, move them apart slightly
        var coincident = false;
        var epsilon = 0.00001;
        do {
            if (coincident) {
                props.loc = geoVecAdd(props.loc, [epsilon, epsilon]);
            }
            var bbox = geoExtent(props.loc).bbox();
            coincident = _noteCache.rtree.search(bbox).length;
        } while (coincident);

        // parse note contents
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            var nodeName = node.nodeName;
            if (nodeName === '#text') continue;

            // if the element is comments, parse the comments
            if (nodeName === 'comments') {
                props[nodeName] = parseComments(node.childNodes);
            } else {
                props[nodeName] = node.textContent;
            }
        }

        var note = new osmNote(props);
        var item = encodeNoteRtree(note);
        _noteCache.note[note.id] = note;
        _noteCache.rtree.insert(item);

        return note;
    },

    user: function parseUser(obj, uid) {
        var attrs = obj.attributes;
        var user = {
            id: uid,
            display_name: attrs.display_name && attrs.display_name.value,
            account_created: attrs.account_created && attrs.account_created.value,
            changesets_count: 0
        };

        var img = obj.getElementsByTagName('img');
        if (img && img[0] && img[0].getAttribute('href')) {
            user.image_url = img[0].getAttribute('href');
        }

        var changesets = obj.getElementsByTagName('changesets');
        if (changesets && changesets[0] && changesets[0].getAttribute('count')) {
            user.changesets_count = changesets[0].getAttribute('count');
        }

        _userCache.user[uid] = user;
        delete _userCache.toLoad[uid];
        return user;
    }
};


async function parseXML(xml, callback, options, mapId) {
    options = _extend({ skipSeen: true }, options);
    if (!xml || !xml.childNodes) {
        return callback({ message: 'No XML', status: -1 });
    }

    var root = xml.childNodes[0];
    var children = root.childNodes;

    if ( !mapId ) {
        mapId = root.attributes.mapid ? root.attributes.mapid.value : -1;
    }

    // utilIdleWorker(children, parseChild, done);

    Promise.all( await _reduce( children, async ( results, child ) => {
        let prevResults = await results,
            r = await parseChild( child );

        if ( r ) {
            prevResults.push( r );
        }

        return prevResults;
    }, [] ) ).then( done );

    function done(results) {
        callback(null, results);
    }

    function parseChild(child) {
        var parser = parsers[child.nodeName];
        if (!parser) return null;

        var uid;
        if (child.nodeName === 'user') {
            uid = child.attributes.id.value;
            if (options.skipSeen && _userCache.user[uid]) {
                delete _userCache.toLoad[uid];
                return null;
            }

        } else if (child.nodeName === 'note') {
            uid = child.getElementsByTagName('id')[0].textContent;

        } else {
            uid = osmEntity.id.fromOSM(child.nodeName, child.attributes.id.value, mapId);

            if (options.skipSeen) {
                if (_tileCache.seen[uid]) return null;  // avoid reparsing a "seen" entity
                _tileCache.seen[uid] = true;
            }
        }

        return Promise.resolve( parser(child, uid, mapId) );
        // return parser(child, uid);
    }
}


// replace or remove note from rtree
function updateRtree(item, replace) {
    _noteCache.rtree.remove(item, function isEql(a, b) { return a.data.id === b.data.id; });

    if (replace) {
        _noteCache.rtree.insert(item);
    }
}

function getUrlRoot(path) {
    return (path.indexOf('mapId') > -1) ? Hoot.api.baseUrl + '/osm' : urlroot;
}

function isUrlHoot(path) {
    return path.indexOf('mapId') > -1;
}

function wrapcb(thisArg, callback, cid, mapId) {
    return function(err, result) {
        if (err) {
            // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
            if (err.status === 400 || err.status === 401 || err.status === 403) {
                thisArg.logout();
            }
            return callback.call(thisArg, err);

        } else if (thisArg.getConnectionId() !== cid) {
            return callback.call(thisArg, { message: 'Connection Switched', status: -1 });

        } else {
            return callback.call(thisArg, err, result, mapId);
        }
    };
}


export default {

    init: function() {
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        _connectionID++;
        _userChangesets = undefined;
        _userDetails = undefined;
        _rateLimitError = undefined;

        _forEach(_tileCache.inflight, abortRequest);
        if (_nodeCountCache.inflight) {
            _nodeCountCache.inflight.cancel();
            console.debug('cancel from reset');
        }
        _forEach(_noteCache.inflight, abortRequest);
        _forEach(_noteCache.inflightPost, abortRequest);
        if (_changeset.inflight) abortRequest(_changeset.inflight);

        _tileCache = { loaded: {}, inflight: {}, seen: {} };
        _nodeCountCache = { loaded: {}, loading: {} /*inflight*/ };
        _noteCache = { loaded: {}, inflight: {}, inflightPost: {}, note: {}, rtree: new RBush() };
        _userCache = { toLoad: {}, user: {} };
        _changeset = {};

        return this;
    },


    getConnectionId: function() {
        return _connectionID;
    },


    changesetURL: function(changesetID) {
        return urlroot + '/changeset/' + changesetID;
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


    noteURL: function(note) {
        return urlroot + '/note/' + note.id;
    },


    // Generic method to load data from the OSM API
    // Can handle either auth or unauth calls.
    loadFromAPI: function(path, callback, options) {
        options = _extend({ skipSeen: true }, options);
        var that = this;
        var cid = _connectionID;

        function done(err, xml) {
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }

            //We don't authenticate against hoot services
            var isAuthenticated = isUrlHoot(path) || that.authenticated();

            // 400 Bad Request, 401 Unauthorized, 403 Forbidden
            // Logout and retry the request..
            if (isAuthenticated && err && (err.status === 400 || err.status === 401 || err.status === 403)) {
                that.logout();
                that.loadFromAPI(path, callback, options);

            // else, no retry..
            } else {
                // 509 Bandwidth Limit Exceeded, 429 Too Many Requests
                // Set the rateLimitError flag and trigger a warning..
                if (!isAuthenticated && !_rateLimitError && err &&
                        (err.status === 509 || err.status === 429)) {
                    _rateLimitError = err;
                    dispatch.call('change');
                }

                if (callback) {
                    if (err) {
                        return callback(err);
                    } else {
                        return parseXML(xml, callback, options);
                    }
                }
            }
        }

        //We don't authenticate against hoot services
        if (!isUrlHoot(path) && this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = getUrlRoot(path) + path;
            return d3_xml(url).get(done);
        }
    },


    parse( dom, mapId ) {
        let options = { skipSeen: false };

        return new Promise( res => {
            parseXML( dom, function(err, entities) {
                res( entities );
            }, options, mapId );
        } );
    },


    // Load a single entity by id (ways and relations use the `/full` call)
    // GET /api/0.6/node/#id
    // GET /api/0.6/[way|relation]/#id/full
    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { skipSeen: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    // Load a single entity with a specific version
    // GET /api/0.6/[node|way|relation]/#id/#version
    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { skipSeen: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    // Load multiple entities in chunks
    // (note: callback may be called multiple times)
    // GET /api/0.6/[nodes|ways|relations]?#parameters
    loadMultiple: function(ids, callback) {
        var that = this;
        //Split feature ids up by maps, then by type
        var mapFeatures = _groupBy(_uniq(ids), osmEntity.id.toHootMapId);
        _forEach(mapFeatures, function(f, m) {
            _forEach(_groupBy(f, osmEntity.id.type), function(v, k) {
                var type    = k + 's',
                    osmIDs  = _map(v, osmEntity.id.toOSM),
                    options = {cache: false};
                _forEach(_chunk(osmIDs, 150), function(arr) {
                    //HootOld service calls need mapId and use elementIds instead of feature type
                    that.loadFromAPI(
                        '/api/0.6/' + type + '?' + ((m > -1) ? 'elementIds' : type) + '=' + arr.join()
                        + ((m > -1) ? '&mapId=' + m : ''),
                        function(err, entities) {
                            if (callback) callback(err, {data: entities});
                        }
                    );
                });
            });
        });

        _forEach(_groupBy(_uniq(ids), osmEntity.id.type), function(v, k) {
            var type = k + 's';
            var osmIDs = _map(v, osmEntity.id.toOSM);
            var options = { skipSeen: false };

            _forEach(_chunk(osmIDs, 150), function(arr) {
                that.loadFromAPI(
                    '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, { data: entities });
                    },
                    options
                );
            });
        });
    },


    authenticated: function() {
        //return true;
        return oauth.authenticated();
    },


    filterChanges: function( changes ) {
        let ways = _filter( _flatten( _map( changes, featArr => featArr ) ), feat => feat.type !== 'node' ),
            visLayers = _map( _filter( _values( Hoot.layers.loadedLayers ), layer => layer.visible ), layer => layer.id ),
            defaultMapId;

        // Make sure there is only one layer visible. Otherwise, return a falsy value to prevent save.
        if (visLayers.length === 1 || changes.created.length === 0){
            defaultMapId = visLayers[0];
        } else {
            return false;
        }

        return _reduce( changes, ( obj, featArr, type ) => {
            let changeTypes = {
                created: [],
                deleted: [],
                modified: []
            };

            _forEach( featArr, feat => {
                let mapId = defaultMapId;

                if ( feat.isNew() && feat.type === 'node' ) {
                    let parent = _find( ways, way => _includes( way.nodes, feat.id ) );

                    if ( parent && parent.mapId ) {
                        mapId = parent.mapId;
                    }
                }

                // create map ID key if not yet exists
                if ( !obj[ mapId ] ) {
                    obj[ mapId ] = {};
                }

                // create change type key if not yet exists
                if ( !obj[ mapId ][ type ] ) {
                    obj[ mapId ][ type ] = [];
                }

                obj[ mapId ][ type ].push( feat );

                // merge object into default types array so that the final result
                // will contain all keys in case change type is empty
                obj[ mapId ] = Object.assign( changeTypes, obj[ mapId ] );
            } );

            return obj;
        }, {} );
    },

    // Create, upload, and close a changeset
    // PUT /api/0.6/changeset/create
    // POST /api/0.6/changeset/#id/upload
    // PUT /api/0.6/changeset/#id/close
    putChangeset: function(changeset, changes, callback ) {
        var cid = _connectionID;

        let changesArr = this.filterChanges( changes );

        if (_changeset.inflight || !changesArr) {
            return callback({ message: 'Changeset already inflight', status: -2 }, changeset);

        } else if (_changeset.open) {   // reuse existing open changeset..
            return createdChangeset.call(this, null, _changeset.open);

        } else {   // Open a new changeset..
            _forEach( changesArr, ( changes, mapId ) => {
                let path = '/api/0.6/changeset/create';
                path += mapId ? `?mapId=${ mapId }` : '';

                var options = {
                    method: 'PUT',
                    path: path,
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: JXON.stringify(changeset.asJXON())
                };
                _changeset.inflight = oauth.xhr(
                    options,
                    wrapcb(this, createdChangeset, cid, mapId)
                );
            } );
        }


        function createdChangeset(err, changesetID, mapId) {
            _changeset.inflight = null;
            if (err) { return callback(err, changeset); }

            _changeset.open = changesetID;
            changeset = changeset.update({ id: changesetID });

            _forEach( Hoot.layers.mergedConflicts, item => {
                let refId     = item.id,
                    newMember = item.obj;

                let changedRel = _find( changes.modified, feat => feat.id === refId );

                if ( changedRel ) {
                    if ( changedRel.members.length >= newMember.index ) {
                        changedRel.members.splice( newMember.index, 0, newMember );
                    } else {
                        changedRel.members.push( newMember );
                    }

                    if ( changedRel.members.length < 2 ) {
                        changedRel.tags[ 'hoot:review:needs' ] = 'no';
                    }
                } else {
                    let modifiedRel = Hoot.context.hasEntity( refId );

                    if ( modifiedRel ) {
                        if ( modifiedRel.members.length >= newMember.index ) {
                            modifiedRel.members.splice( newMember.index, 0, newMember );
                        } else {
                            modifiedRel.members.push( newMember );
                        }

                        if ( modifiedRel.members.length < 2 ) {
                            modifiedRel.tags[ 'hoot:review:needs' ] = 'no';
                        }
                    }
                }
            } );

            let path = '/api/0.6/changeset/' + changesetID + '/upload';
            path += mapId ? `?mapId=${ mapId }` : '';

            // Upload the changeset..
            var options = {
                method: 'POST',
                path: path,
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.osmChangeJXON(changes))
            };
            _changeset.inflight = oauth.xhr(
                options,
                wrapcb(this, uploadedChangeset, cid, mapId)
            );
        }


        function uploadedChangeset(err, result, mapId) {
            _changeset.inflight = null;
            if (err) return callback(err, changeset);

            // Upload was successful, safe to call the callback.
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() { callback(null, changeset); }, 500);
            _changeset.open = null;

            // At this point, we don't really care if the connection was switched..
            // Only try to close the changeset if we're still talking to the same server.
            if (this.getConnectionId() === cid) {
                let path = '/api/0.6/changeset/' + changeset.id + '/close';
                path += mapId ? `?mapId=${ mapId }` : '';

                // Still attempt to close changeset, but ignore response because #2667
                oauth.xhr({
                    method: 'PUT',
                    path: path,
                    options: { header: { 'Content-Type': 'text/xml' } }
                }, function() { return true; });
            }
        }
    },


    // Load multiple users in chunks
    // (note: callback may be called multiple times)
    // GET /api/0.6/users?users=#id1,#id2,...,#idn
    loadUsers: function(uids, callback) {
        var toLoad = [];
        var cached = [];

        _uniq(uids).forEach(function(uid) {
            if (_userCache.user[uid]) {
                delete _userCache.toLoad[uid];
                cached.push(_userCache.user[uid]);
            } else {
                toLoad.push(uid);
            }
        });

        if (cached.length || !this.authenticated()) {
            callback(undefined, cached);
            if (!this.authenticated()) return;  // require auth
        }

        _chunk(toLoad, 150).forEach(function(arr) {
            oauth.xhr(
                { method: 'GET', path: '/api/0.6/users?users=' + arr.join() },
                wrapcb(this, done, _connectionID)
            );
        }.bind(this));

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: true };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results);
                }
            }, options);
        }
    },


    // Load a given user by id
    // GET /api/0.6/user/#id
    loadUser: function(uid, callback) {
        if (_userCache.user[uid] || !this.authenticated()) {   // require auth
            delete _userCache.toLoad[uid];
            return callback(undefined, _userCache.user[uid]);
        }

        oauth.xhr(
            { method: 'GET', path: '/api/0.6/user/' + uid },
            wrapcb(this, done, _connectionID)
        );

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: true };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
    },


    // Load the details of the logged-in user
    // GET /api/0.6/user/details
    userDetails: function(callback) {
        if (_userDetails) {    // retrieve cached
            return callback(undefined, _userDetails);
        }

        oauth.xhr(
            { method: 'GET', path: '/api/0.6/user/details' },
            wrapcb(this, done, _connectionID)
        );

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    _userDetails = results[0];
                    return callback(undefined, _userDetails);
                }
            }, options);
        }
    },


    // Load previous changesets for the logged in user
    // GET /api/0.6/changesets?user=#id
    userChangesets: function(callback) {
        if (_userChangesets) {    // retrieve cached
            return callback(undefined, _userChangesets);
        }

        this.userDetails(
            wrapcb(this, gotDetails, _connectionID)
        );


        function gotDetails(err, user) {
            if (err) { return callback(err); }

            oauth.xhr(
                { method: 'GET', path: '/api/0.6/changesets?user=' + user.id },
                wrapcb(this, done, _connectionID)
            );
        }

        function done(err, xml) {
            if (err) { return callback(err); }

            _userChangesets = Array.prototype.map.call(
                xml.getElementsByTagName('changeset'),
                function (changeset) { return { tags: getTags(changeset) }; }
            ).filter(function (changeset) {
                var comment = changeset.tags.comment;
                return comment && comment !== '';
            });

            return callback(undefined, _userChangesets);
        }
    },


    // Fetch the status of the OSM API
    // GET /api/capabilities
    status: function(callback) {
        d3_xml(urlroot + '/api/capabilities').get(
            wrapcb(this, done, _connectionID)
        );

        function done(err, xml) {
            if (err) { return callback(err); }

            // update blacklists
            var elements = xml.getElementsByTagName('blacklist');
            var regexes = [];
            for (var i = 0; i < elements.length; i++) {
                var regex = elements[i].getAttribute('regex');  // needs unencode?
                if (regex) {
                    regexes.push(regex);
                }
            }
            if (regexes.length) {
                _blacklists = regexes;
            }

            if (_rateLimitError) {
                return callback(_rateLimitError, 'rateLimited');
            } else {
                var apiStatus = xml.getElementsByTagName('status');
                var val = apiStatus[0].getAttribute('api');
                return callback(undefined, val);
            }
        }
    },

    getViewTiles: function(projection, zoom) {
        // Load from visible layers only
        // HootOld loadedLayers is what controls the vector data sources that are loaded
        var visLayers = _filter( _values( Hoot.layers.loadedLayers ), layer => layer.visible );
        var z = Math.round(zoom);
        // determine the needed tiles to cover the view
        var tiles = _map(visLayers, function(layer) {
            return tiler
            .zoomExtent([z, z])
            .getTiles(projection)
            .map(function(tile) {
                tile.mapId = layer.id;
                tile.layerName = layer.name;
                tile.id = tile.id + '_' + tile.mapId;
                tile.tile = tile.extent.toParam();

                return tile;
            });
        });

        tiles = _flatten(tiles);
        // console.debug("tiles count -> " + tiles.length);

        return tiles;
    },

    getNodesCount: async function( projection, zoom ) {
        const tiles = this.getViewTiles(projection, zoom);
        const cancelToken = axios.CancelToken.source();
        //see which tile counts are already cached
        const tilesToBeLoaded = tiles.filter(tile => {
            return !(_nodeCountCache.loaded[tile.id] !== undefined || _nodeCountCache.loading[tile.id]);
        });

        //console.debug(tiles.length + " vs " + tilesToBeLoaded.length);

        if ( tilesToBeLoaded.length > 0 ) {
            // abort inflight nodecount requests that are no longer needed
            if (_nodeCountCache.inflight) {
                console.debug(_nodeCountCache.inflight);
                console.debug('cancel from getNodesCount');
                _nodeCountCache.inflight.cancel();
                delete _nodeCountCache.inflight;
                // dispatch.call('loaded');    // stop the spinner
            }

            tilesToBeLoaded.forEach((tile) => {
                _nodeCountCache.loading[tile.id] = true;
            });
            _nodeCountCache.inflight = cancelToken;
            let counts;
            try {
                counts = await Hoot.api.getTileNodesCount( tilesToBeLoaded, cancelToken.token );
                delete _nodeCountCache.inflight;
            } catch (rej) {
                console.debug('getTileNodesCount canceled');
            }
            tilesToBeLoaded.forEach((tile) => {
                delete _nodeCountCache.loading[tile.id];
                _nodeCountCache.loaded[tile.id] = counts.tilecounts[tile.id];
            });
        }

        //add up all tile counts
        const count = tiles.reduce((total, tile) => {
            if (!isNaN(_nodeCountCache.loaded[tile.id])) {
                return total += _nodeCountCache.loaded[tile.id];
            } else {
                return total;
            }
        }, 0);
        console.debug('total view tile nodes = ' + count);
        //sometimes tiles are empty when app first opens and we don't want to treat as a zero node count
        //but as over the max count
        if (count === 0 && tiles.length === 0) {
            console.debug('zero tiles');
            return _maxNodeCount + 1;
        }
        return count;
    },

    parseTileId: function(tileId) {
        // 213,390,10_95
        let tileBits = tileId.split(',');
        let zId = tileBits[2].split('_');
        return {
            x: Number(tileBits[0]),
            y: Number(tileBits[1]),
            z: Number(zId[0]),
            mapId: zId[1]
        };
    },

    checkTileCacheAbove: function(tileId) {
        let id = this.parseTileId(tileId);
        let x = id.x;
        let y = id.y;
        // check each zoom level above the input up to 0
        for (let zoom = id.z-1; zoom >= 0; zoom--) {
            // at each zoom level above divide the index in half and floor
            x = Math.floor(x / 2);
            y = Math.floor(y / 2);
            let parentTileId = [x, y, zoom + '_' + id.mapId].join(',');
            if (_tileCache.loaded[parentTileId] || _tileCache.inflight[parentTileId]) return true;
        }
    },

    checkTileCacheBelow: function(tileId) {
        let id = this.parseTileId(tileId);
        let x = id.x;
        let y = id.y;
        // check each zoom level below the input zoom
        // up to 2 below or _tileZoom (16)
        // more than two below the number of tiles to check >256
        for (let zoom = id.z+1; zoom <= Math.min(id.z+2, _tileZoom); zoom++) {
            // at each zoom level above multiply the index by two
            x = x * 2;
            y = y * 2;

            // exp is used to calculate the 2^exp number of tiles at each subsequent zoom level
            let exp = zoom - id.z;
            let every = false;
            for (let childX = x; childX <= (x + 2^exp); childX++) {
                for (let childY = y; childX <= (y + 2^exp); childY++) {
                    let childTileId = [childX, childY, zoom + '_' + id.mapId].join(',');
                    if (_tileCache.loaded[childTileId] || _tileCache.inflight[childTileId]) {
                        every = true;
                    } else {
                        every = false;
                        break;
                    }

                }
            }

            // if every child tile is true we stop with success
            // otherwise loop to the next zoom level
            if (every) return true;
        }


    },

    // Load data (entities) from the API in tiles
    // GET /api/0.6/map?bbox=
    loadTiles: async function(projection, zoom, callback) {
        if (_off) return;

        const tileZ = Math.min(zoom, _tileZoom);
        let count;
        try {
            count = await this.getNodesCount(projection, tileZ);
        } catch (rej) {
            console.debug('getNodesCount canceled');
        }
        // console.debug('nodesCount ->' + tileZ + ': ' + count);
        if (isNaN(count) || count > _maxNodeCount) {
            callback('Too many features to load->' + count);//call editOff
            _forEach(_tileCache.inflight, abortRequest);
            dispatch.call('loaded');     // stop the spinner
            var visLayers = _filter( _values( Hoot.layers.loadedLayers ), layer => layer.visible );
            visLayers.forEach(layer => Hoot.events.emit( 'layer-loaded', layer.name ));
            return;
        }

        var that = this;
        // determine the needed tiles to cover the view
        const tiles = this.getViewTiles(projection, tileZ);

        // abort inflight requests that are no longer needed
        var hadRequests = !_isEmpty(_tileCache.inflight);
        abortUnwantedRequests(_tileCache, tiles);
        if (hadRequests && _isEmpty(_tileCache.inflight)) {
            dispatch.call('loaded');    // stop the spinner
        }

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_tileCache.loaded[tile.id] || _tileCache.inflight[tile.id]) return;
            //add check for tiles above and below
            if (that.checkTileCacheAbove(tile.id)) return;
            if (that.checkTileCacheBelow(tile.id)) return;


            if (_isEmpty(_tileCache.inflight)) {
                dispatch.call('loading');   // start the spinner
            }

            var path;

            if ( tile.mapId && tile.mapId > -1 ) {
                path = `/api/0.6/map/${ tile.mapId }/${ tile.extent.toParam() }`;
            } else {
                path = `/api/0.6/map?bbox=${ tile.extent.toParam() }`;
            }

            var options = { skipSeen: true };
            _tileCache.inflight[tile.id] = that.loadFromAPI( path, function(err, parsed) {
                console.debug('loadTiles tile.id->' + tile.id);
                delete _tileCache.inflight[tile.id];
                if (!err) {
                    _tileCache.loaded[tile.id] = true;
                }
                if (callback) {
                    callback(err, _extend({ data: parsed }, tile));
                }
                if (_isEmpty(_tileCache.inflight)) {
                    dispatch.call('loaded');     // stop the spinner
                    Hoot.events.emit( 'layer-loaded', tile.layerName );
                }
            }, options );
        });
    },


    // Load notes from the API in tiles
    // GET /api/0.6/notes?bbox=
    loadNotes: function(projection, noteOptions) {
        noteOptions = _extend({ limit: 10000, closed: 7 }, noteOptions);
        if (_off) return;

        var that = this;
        var path = '/api/0.6/notes?limit=' + noteOptions.limit + '&closed=' + noteOptions.closed + '&bbox=';
        var throttleLoadUsers = _throttle(function() {
            var uids = Object.keys(_userCache.toLoad);
            if (!uids.length) return;
            that.loadUsers(uids, function() {});  // eagerly load user details
        }, 750);

        // determine the needed tiles to cover the view
        var tiles = tiler.zoomExtent([_noteZoom, _noteZoom]).getTiles(projection);

        // abort inflight requests that are no longer needed
        abortUnwantedRequests(_noteCache, tiles);

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_noteCache.loaded[tile.id] || _noteCache.inflight[tile.id]) return;

            var options = { skipSeen: false };
            _noteCache.inflight[tile.id] = that.loadFromAPI(
                path + tile.extent.toParam(),
                function(err) {
                    delete _noteCache.inflight[tile.id];
                    if (!err) {
                        _noteCache.loaded[tile.id] = true;
                    }
                    throttleLoadUsers();
                    dispatch.call('loadedNotes');
                },
                options
            );
        });
    },


    // Create a note
    // POST /api/0.6/notes?params
    postNoteCreate: function(note, callback) {
        if (!this.authenticated()) {
            return callback({ message: 'Not Authenticated', status: -3 }, note);
        }
        if (_noteCache.inflightPost[note.id]) {
            return callback({ message: 'Note update already inflight', status: -2 }, note);
        }

        if (!note.loc[0] || !note.loc[1] || !note.newComment) return; // location & description required

        var comment = note.newComment;
        if (note.newCategory && note.newCategory !== 'None') { comment += ' #' + note.newCategory; }

        var path = '/api/0.6/notes?' + utilQsString({ lon: note.loc[0], lat: note.loc[1], text: comment });

        _noteCache.inflightPost[note.id] = oauth.xhr(
            { method: 'POST', path: path },
            wrapcb(this, done, _connectionID)
        );


        function done(err, xml) {
            delete _noteCache.inflightPost[note.id];
            if (err) { return callback(err); }

            // we get the updated note back, remove from caches and reparse..
            this.removeNote(note);

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
    },


    // Update a note
    // POST /api/0.6/notes/#id/comment?text=comment
    // POST /api/0.6/notes/#id/close?text=comment
    // POST /api/0.6/notes/#id/reopen?text=comment
    postNoteUpdate: function(note, newStatus, callback) {
        if (!this.authenticated()) {
            return callback({ message: 'Not Authenticated', status: -3 }, note);
        }
        if (_noteCache.inflightPost[note.id]) {
            return callback({ message: 'Note update already inflight', status: -2 }, note);
        }

        var action;
        if (note.status !== 'closed' && newStatus === 'closed') {
            action = 'close';
        } else if (note.status !== 'open' && newStatus === 'open') {
            action = 'reopen';
        } else {
            action = 'comment';
            if (!note.newComment) return; // when commenting, comment required
        }

        var path = '/api/0.6/notes/' + note.id + '/' + action;
        if (note.newComment) {
            path += '?' + utilQsString({ text: note.newComment });
        }

        _noteCache.inflightPost[note.id] = oauth.xhr(
            { method: 'POST', path: path },
            wrapcb(this, done, _connectionID)
        );


        function done(err, xml) {
            delete _noteCache.inflightPost[note.id];
            if (err) { return callback(err); }

            // we get the updated note back, remove from caches and reparse..
            this.removeNote(note);

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
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
        _off = !_;
        return this;
    },


    isChangesetInflight: function() {
        return !!_changeset.inflight;
    },


    // get/set cached data
    // This is used to save/restore the state when entering/exiting the walkthrough
    // Also used for testing purposes.
    caches: function(obj) {
        if (!arguments.length) {
            return {
                tile: _cloneDeep(_tileCache),
                note: _cloneDeep(_noteCache),
                user: _cloneDeep(_userCache)
            };
        }

        // access caches directly for testing (e.g., loading notes rtree)
        if (obj === 'get') {
            return {
                tile: _tileCache,
                note: _noteCache,
                user: _userCache
            };
        }

        if (obj.tile) {
            _tileCache = obj.tile;
            _tileCache.inflight = {};
        }
        if (obj.note) {
            _noteCache = obj.note;
            _noteCache.inflight = {};
            _noteCache.inflightPost = {};
        }
        if (obj.user) {
            _userCache = obj.user;
        }

        return this;
    },


    removeTile( id ) {
        delete _tileCache.loaded[ id ];
        delete _nodeCountCache.loaded[ id ];
        dispatch.call( 'loaded' );
    },

    logout: function() {
        _userChangesets = undefined;
        _userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    //authenticated: function() {
    //    return oauth.authenticated();
    //},


    authenticate: function(callback) {
        var that = this;
        var cid = _connectionID;
        _userChangesets = undefined;
        _userDetails = undefined;

        function done(err, res) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }
            _rateLimitError = undefined;
            dispatch.call('change');
            if (callback) callback(err, res);
            that.userChangesets(function() {});  // eagerly load user details/changesets
        }

        return oauth.authenticate(done);
    },


    imageryBlacklists: function() {
        return _blacklists;
    },


    tileZoom: function(_) {
        if (!arguments.length) return _tileZoom;
        _tileZoom = _;
        return this;
    },


    // get all cached notes covering the viewport
    notes: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

        return _noteCache.rtree.search(bbox)
            .map(function(d) { return d.data; });
    },


    // get a single note from the cache
    getNote: function(id) {
        return _noteCache.note[id];
    },


    // remove a single note from the cache
    removeNote: function(note) {
        if (!(note instanceof osmNote) || !note.id) return;

        delete _noteCache.note[note.id];
        updateRtree(encodeNoteRtree(note), false);  // false = remove
    },


    // replace a single note in the cache
    replaceNote: function(note) {
        if (!(note instanceof osmNote) || !note.id) return;

        _noteCache.note[note.id] = note;
        updateRtree(encodeNoteRtree(note), true);  // true = replace
        return note;
    }

};
