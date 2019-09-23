import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';
import { request as d3_request } from 'd3-request';
import { utilQsString, utilRebind, utilTiler } from '../util';

import { services } from './index';
import { osmNode  } from '../osm/node';

var dispatch = d3_dispatch('osmChange');
var _mlyCache;
var getCreates;
var getModify;
var getDeletes;
var allCreates = [];
var allModify = [];
var allDeletes = [];

function getDoc( url, done ) {

    d3_xml( url, function ( err, response ) {
        if ( err ) return;
        getCreates = response.getElementsByTagName('create');
        getModify = response.getElementsByTagName('modify');
        getDeletes = response.getElementsByTagName('delete');
        function getParsed(children) {
            if ( children.getElementsByTagName('node') ) {
                _forEach( children.children, function(nodeObj) {
                    let getParsedNode = services.osm.parsers.node(nodeObj);
                    if ( children.nodeName === 'create' ) {
                        allCreates.push( getParsedNode );
                    }
                    if ( children.nodeName === 'delete' ) {
                        allDeletes.push( getParsedNode );
                    }
                    if ( children.nodeName === 'modify' ) {
                        allModify.push( getParsedNode );
                    }
                } );
            }
            if ( children.getElementsByTagName('way') ) {
                _forEach( children.children, function(wayObj) {
                    let getParsedWay = services.osm.parsers.node(wayObj);
                    if ( children.nodeName === 'create' ) {
                        allCreates.push( getParsedWay );
                    }
                    if ( children.nodeName === 'delete' ) {
                        allDeletes.push( getParsedWay );
                    }
                    if ( children.nodeName === 'modify' ) {
                        allModify.push( getParsedWay );
                    }
                } );
            }
            if ( children.getElementsByTagName('relation') ) {
                _forEach( children.children, function(relationObj) {
                    let getParsedRel = services.osm.parsers.node(relationObj);
                    if ( children.nodeName === 'create' ) {
                        allCreates.push( getParsedRel );
                    }
                    if ( children.nodeName === 'delete' ) {
                        allDeletes.push( getParsedRel );
                    }
                    if ( children.nodeName === 'modify' ) {
                        allModify.push( getParsedRel );
                    }
                } );
            }
        }

        if ( getCreates ) {
            _forEach( getCreates, function(find) {
                return find.nodeName ? getParsed(find) : null;
            } );
        }
        if ( getModify ) {
            _forEach( getModify, function(find) {
                return find.nodeName ? getParsed(find) : null;
            } );
        }
        if ( getDeletes ) {
            _forEach( getDeletes, function(find) {
                return find.nodeName ? getParsed(find) : null;
            });
        }
    });
}


export default {
    init: function() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },
    reset: function() {
        var cache = _mlyCache;
    },

    buildFidMap: function(features) {
        var map = {};

        for (var i = 0; features.length > 0; i++) {
            map[features[i].fid] = features[i];
        }
    },

    getChangeset: function(url) {
        getDoc(url);
    },

    viewChangeset: function (oscFeatures, osmFeatures) {
    },

    setHasTags: function ( osmFeatures, oscFeatures ) {
        var osmHasTags = false;

        if ( osmFeatures ) {
            osmHasTags = this.getHasTags( osmFeatures );
            osmFeatures.hasTags = osmHasTags;
        }
        if ( oscFeatures ) {
            oscFeatures.hasTags = osmHasTags || this.getHasTags( oscFeatures );
        }
    },

    setModifyAction: function ( osmFeatures, oscFeatures ) {
    },

    displayChanges: function (entity) {

        var displayRules = {
            'create': {
            },
            'modify': {
            },
            'delete':{
            }
        };
    },

    displayOld: function (entity) {
        var staleEntity = {
            'create': {
                display: 'none'
            },
            'modify': {
                display: 'none'
            },
            'modify:geometry': {

            },
            'delete': {

            },
            'augment': {

            }
        };
    }
};