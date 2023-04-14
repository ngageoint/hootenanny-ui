/** ****************************************************************************************************
 * File: footprint_layer.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/15/18
 *******************************************************************************************************/

import { utilSetDimensions, utilGetDimensions } from '../util/dimensions';
import { geoPath as d3_geoPath } from 'd3-geo';

export function rendererFootprintLayer() {
    let projection,
        gj     = {},
        enable = true,
        svg,
        s;

    function render( selection ) {
        svg = selection
            .selectAll( 'svg' )
            .data( [ render ] );

        s = svg
            .enter()
            .append( 'svg' );

        svg.style( 'display', enable ? 'block' : 'none' );

        let paths = svg
            .selectAll( 'path' )
            .data( [ gj ] );

        paths
            .enter()
            .append( 'path' )
            .attr( 'class', 'carousel-footprint' );

        let path = d3_geoPath()
            .projection( projection );

        paths.attr( 'd', path );

        if ( typeof gj.features !== 'undefined' ) {
            svg
                .selectAll( 'text' )
                .remove();

            svg
                .selectAll( 'path' )
                .data( gj.features )
                .enter()
                .append( 'text' )
                .attr( 'class', 'carousel-footprint' )
                .text( function( d ) {
                    return d.properties.name;
                } )
                .attr( 'x', function( d ) {
                    let centroid = path.centroid( d );
                    return centroid[ 0 ] + 5;
                } )
                .attr( 'y', function( d ) {
                    let centroid = path.centroid( d );
                    return centroid[ 1 ];
                } );
        }
    }

    render.projection = function( _ ) {
        if ( !arguments.length ) return projection;
        projection = _;
        return render;
    };

    render.enable = function( _ ) {
        if ( !arguments.length ) return enable;
        enable = _;
        return render;
    };

    render.geojson = function( _ ) {
        if ( !arguments.length ) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function( _ ) {
        if ( !arguments.length ) return utilGetDimensions( s );
        utilSetDimensions( s, _ );
        return render;
    };

    render.id = 'layer-footprint';

    return render;
}
