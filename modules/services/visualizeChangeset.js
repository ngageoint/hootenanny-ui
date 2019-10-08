import _forEach from 'lodash-es/forEach';
import _extend from 'lodash-es/extend';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';
import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { utilQsString, utilRebind, utilTiler } from '../util';

import { services } from './index';
import { osmEntity } from '../osm';


var dispatch = d3_dispatch('visualize-changeset');
var allViz = [];
var svgContext;

export default {
    init: function() {
        this.event = utilRebind(this, dispatch, 'on');
    },
    reset: function() {
        allViz = [];
    },

    getContext: function() {
        return svgContext;
    },

    entities: function() {
        return allViz;
    },

    getChangeset: function(url, context) {
        svgContext = context;
        var options = _extend({ skipSeen: true }, options);
        var _tileCache = { loaded: {}, inflight: {}, seen: {} };
        d3_xml( url, function ( err, response ) {
            if ( err ) return;

            [ 'create', 'modify','delete' ].forEach( function(name) {

                let osmElements = response.getElementsByTagName(name);

                for ( let item = 0; item < osmElements.length; item++ ) {

                    var getItems = osmElements[item].children;

                    for ( let j = 0; j < getItems.length; j++ ) {

                        var osmElement = getItems[j];

                        var uid = osmEntity.id.fromOSM(osmElement.nodeName, osmElement.attributes.id.value);

                        var parsed = services.osm.parsers[osmElement.nodeName]( osmElement, uid, name );

                        if (options.skipSeen) {
                            if (_tileCache.seen[uid]) return null;  // avoid reparsing a "seen" entity
                            _tileCache.seen[uid] = true;
                        }

                        allViz.push( parsed );

                    }
                }
            });
            let visualizeChangeset = context.layers().layer('visualize-changeset');
            visualizeChangeset.enabled(true);

        });
    }
};