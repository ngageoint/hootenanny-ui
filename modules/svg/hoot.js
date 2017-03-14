import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { utilDetect } from '../util/detect';
import toGeoJSON from 'togeojson';


export function svgHoot(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer;


    function init() {
        if (svgHoot.initialized) return;  // run once

        svgHoot.geojson = [];
        svgHoot.enabled = true;

        svgHoot.initialized = true;
    }


    function drawHoot(selection) {
        var geojson = svgHoot.geojson,
            enabled = svgHoot.enabled;

        layer = selection.selectAll('.layer-hoot')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-hoot')
            .merge(layer);

        var paths = layer
            .selectAll('path')
            .data(geojson);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .merge(paths)
            .attr('class', function(d) {
                if (!(_.isEmpty(d))) {
                    return 'way line stroke tag-hoot-' + d.properties.mapid;
                }
            });


        var path = d3.geoPath(projection);

        paths
            .attr('d', path);

    }


    drawHoot.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawHoot.enabled = function(_) {
        if (!arguments.length) return svgHoot.enabled;
        svgHoot.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawHoot.hasHoot = function() {
        var geojson = svgHoot.geojson;
        return (!(_.isEmpty(geojson)));
    };


    drawHoot.geojson = function(gj) {
        if (!arguments.length) return svgHoot.geojson;
        console.log(gj);
        svgHoot.geojson = gj;
        dispatch.call('change');
        return this;
    };


    init();
    return drawHoot;
}
