import _chunk from 'lodash-es/chunk';
import _compact from 'lodash-es/compact';
import _forEach from 'lodash-es/forEach';
import _groupBy from 'lodash-es/groupBy';
import _map from 'lodash-es/map';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';



import { utilFunctor } from '../util';
import { set as d3_set } from 'd3-collection';
import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { services } from '../services/index';
import {
    svgAreas,
    svgLabels,
    svgLayers,
    svgLines,
    svgMidpoints,
    svgPoints,
    svgVertices,
    svgPointTransform
} from '../svg';


export function svgVisualizeChangeset( projection, context, dispatch ) {

    var surface;
    var enabled = true;

    function showLayer() {
        var layer = context.surface().selectAll('.data-layer.visualize-changeset');
        layer.interrupt();

        layer
            .classed('disabled', false)
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', function(){
                dispatch.call('change');
            });
    }

    function hideLayer() {
        var layer = context.surface().selectAll('.data-layer.visualize-changeset');
        layer.interrupt();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', function () {
                layer.classed('disabled', true);
                dispatch.call('change');
            });
    }

    function update() {
        var getContext = services.oscChangeset.getContext();
        var getGraph = getContext.graph();
        dispatch = d3_dispatch('change', 'drawn');
        var data = services.oscChangeset.entities();
        var all = getContext.intersects(getContext.map().extent());
        var extent = getContext.map().extent();
        var features = getContext.features();
        var fullRedraw = false;
        var dimensions = [1, 1];
        var drawPoints = svgPoints(projection, getContext);
        var drawVertices = svgVertices(projection, getContext);
        var drawLines = svgLines(projection, getContext);
        var drawAreas = svgAreas(projection, getContext);
        var drawVisChangeset = svgVisualizeChangeset(projection, getContext);
        var drawMidpoints = svgMidpoints(projection, getContext);
        var drawLabels = svgLabels(projection, getContext);

        var selectedAndParents = {};

        data.forEach(function(id) {
            let entity = id;
            if (entity) {
               selectedAndParents[entity.id] = entity;
                if (entity.type === 'node') {
                    Object.assign( getGraph.entities, selectedAndParents );
                }
            }
        });

        data = _values(selectedAndParents);
        var filter = function(d) {
            console.log(d);
            return d.id in selectedAndParents;
        };

        surface
            .call(drawVertices, getGraph, data, filter, extent, fullRedraw)
            .call(drawLines, getGraph, data, filter)
            .call(drawAreas, getGraph, data, filter)
            .call(drawVisChangeset, getGraph, data, filter)
            .call(drawMidpoints, getGraph, data, filter, context.map().trimmedExtent())
            .call(drawLabels, getGraph, data, filter, dimensions, fullRedraw)
            .call(drawPoints, getGraph, data, filter);

        dispatch.call( 'drawn', this, { full: true } );
    }

    function drawChangeset(selection) {

        var entities = services.oscChangeset.entities();
        surface = selection;

        selection.selectAll('.layer-visualize-changeset')
            .data(['covered', 'areas', 'lines', 'points', 'labels'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-visualize-changeset ' + d; });

        selection.selectAll('.layer-visualize-changeset.points').selectAll('.points-group')
            .data(['points', 'midpoints', 'vertices', 'turns'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'points-group ' + d; });

        context.layers()
            .on('change.map', function() {
                if (entities.length > 0 ) {
                    update();
                }
            });
    }

    drawChangeset.enabled = function(_) {
        if (!arguments.length) return enabled;
        enabled = _;
        if (enabled) {
            showLayer();
        } else {
            console.log('disabled');
        }
        dispatch.call('change');
        return this;
    };

    return drawChangeset;

}