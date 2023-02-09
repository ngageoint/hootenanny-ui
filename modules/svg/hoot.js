import _isArray from 'lodash-es/isArray';
import _filter from 'lodash-es/filter';

import { geoPath as d3_geoPath } from 'd3-geo';
import { select as d3_select } from 'd3-selection';
import _isEmpty from 'lodash-es/isEmpty';
import { utilHashcode } from '../util';


export function svgHoot(projection, context, dispatch) {
    var showLabels = true,
        layer;


    function init() {
        if (svgHoot.initialized) return;  // run once

        svgHoot.geojson = {
            type: 'FeatureCollection',
            features: [],
            properties: {}
        };
        svgHoot.enabled = true;

        svgHoot.initialized = true;
    }


    function drawHoot(selection) {
        var geojson = svgHoot.geojson,
            enabled = svgHoot.enabled;

        var features = {
            Bbox: [],
            LineString: [],
            Point: []
        };

        var pathDataClasses = {
            Bbox: 'bbox way line stroke',
        };

        geojson.features.forEach(feat => {
            feat.__featurehash__ = utilHashcode(JSON.stringify(feat));

            if (feat.properties && feat.properties.reviewLabel) {
                features[feat.geometry.type].push(feat);
            } else {
                features.Bbox.push(feat);
            }
        });

        layer = selection.selectAll('.layer-hoot')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-hoot')
            .merge(layer);

        var datagroups = layer
            .selectAll('g.datagroup')
            .data(Object.keys(features));

        datagroups = datagroups.enter()
            .append('g')
            .attr('class', function(d) { return 'datagroup datagroup-' + d; })
            .merge(datagroups);


        var pathDataGroups = datagroups.filter(d => d === 'BBox' || d === 'LineString');
        var circleDataGroups = datagroups.filter(d => d === 'Point');

        var paths = pathDataGroups
            .selectAll('path')
            .data(function(layer) { return features[layer]; }, d => d.__featurehash__);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .merge(paths)
            .attr('class', function(d) {
                const datagroup = this.parentNode.__data__;
                const pathDataClass = pathDataClasses[datagroup] || '';

                let pathClass = 'pathdata ' + datagroup + ' ' + pathDataClass;

                if (d.properties.mapId && datagroup === 'Bbox') {
                    pathClass += ' tag-hoot-' + d.properties.mapId;
                }

                return pathClass;
            });

        var circles = circleDataGroups
            .selectAll('g')
            .data(function(layer) { return features[layer]; }, d => d.__featurehash__);

        circles.exit()
            .remove();

        var circlesEnter = circles.enter()
            .append('g')
            .attr('class', 'pointgroup')
            .attr('id', (d,i) => String.fromCharCode(65 + i))
            .attr('transform', function(feature) {
                const pt = projection(feature.geometry.coordinates);
                return `translate(${pt[0]},${pt[1]-50})`;
            });


        circlesEnter
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '15');

        circlesEnter.append('text')
            .attr('x', -5)
            .attr('y', 5)
            .text(function(d) { return d3_select(this.parentNode).attr('id'); });

        circles = circles.merge(circlesEnter);

        var path = d3_geoPath(projection);

        paths.attr('d', path);
        circles.attr('d', path);
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

        svgHoot.geojson = gj;

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
        svgHoot.geojson.features = _filter( svgHoot.geojson.features, f => f.properties.mapId !== mapId );

        dispatch.call( 'change' );
        return this;
    };

    init();
    return drawHoot;
}
