import _isArray from 'lodash-es/isArray';
import _filter from 'lodash-es/filter';

import { geoPath as d3_geoPath } from 'd3-geo';
import _isEmpty from 'lodash-es/isEmpty';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { utilDetect } from '../util/detect';
import toGeoJSON from '@mapbox/togeojson';
import Hoot from '../Hoot/hoot';


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
                if (!(_isEmpty(d))) {
                    return 'bbox way line stroke tag-hoot-' + d.properties.mapId;
                }
            });

        var path = d3_geoPath(projection);

        paths.attr('d', path);
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
        return (!(_isEmpty(geojson)));
    };


    drawHoot.geojson = function(gj) {
        if (!arguments.length) return svgHoot.geojson;

        if ( _isArray( gj ) ) {
            svgHoot.geojson = svgHoot.geojson.concat( gj );
        } else {
            svgHoot.geojson.push( gj );
        }

        dispatch.call('change');

        // only emit the layer-loaded event if the map is zoomed far away.
        //
        // this is because the layer BBox loads much quicker than the layer itself
        // and we don't want the layer controller in the sidebar to update before
        // the layer is actually done loading.
        if ( !context.map().editable() ) {
            Hoot.events.emit( 'layer-loaded', gj.properties.name );
        }

        return this;
    };

    drawHoot.removeGeojson = function( mapId ) {
        svgHoot.geojson = _filter( svgHoot.geojson, gj => gj.properties.mapId !== mapId );

        dispatch.call( 'change' );
        return this;
    };

    init();
    return drawHoot;
}
