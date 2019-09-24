import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';
import { request as d3_request } from 'd3-request';
import { utilQsString, utilRebind, utilTiler } from '../util';

import { services } from './index';
import { osmNode  } from '../osm/node';
import { uiContributors } from '../ui';


var dispatch = d3_dispatch('osmChange');
var _mlyCache;
var allViz = [];


function getDoc( url, done ) {

    d3_xml( url, function ( err, response ) {
        if ( err ) return;

        [ 'create', 'modify','delete' ].forEach( function(name) {

            let osmElements = response.getElementsByTagName(name);

            for ( let item = 0; item < osmElements.length; item++ ) {

                var getItems = osmElements[item].children;

                for ( let j = 0; j < getItems.length; j++ ) {

                    var osmElement = getItems[j];

                    var parsed = services.osm.parsers[osmElement.nodeName]( osmElement, `${name[0]}${osmElement.id}` );

                    allViz.push( parsed );
                }
            }
        });
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