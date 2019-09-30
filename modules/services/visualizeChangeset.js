import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';
import { request as d3_request } from 'd3-request';
import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { services } from './index';


var dispatch = d3_dispatch('visualize-changeset');
var allViz = [];

export default {
    init: function() {

    },
    reset: function() {
        allViz = [];
    },

    entities: function() {
        return allViz;
    },

    getChangeset: function(url, context) {
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
            let visualizeChangeset = context.layers().layer('visualize-changeset');
            visualizeChangeset.enabled(true);
            dispatch.call('visualize-changeset');
        });
    }
};