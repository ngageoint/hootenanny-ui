/** ****************************************************************************************************
 * File: arrow_layer.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/28/18
 *******************************************************************************************************/

import { utilSetDimensions, utilGetDimensions } from '../util/dimensions';

export function rendererArrowLayer() {
    let projection,
        gj     = {},
        enable = true,
        svg,
        s,
        markers = [
            {
                id: 'markerArrow',
                w: 44,
                h: 24,
                x: 40,
                y: 11,
                o: 'auto',
                t: '<path d="M 2,2 2,20 40,11 2,2" class="arrow head"/>',
                u: 'userSpaceOnUse'
            }
        ];

    function render( selection ) {
        svg = selection
            .selectAll( 'svg' )
            .data( [ render ] );

        s = svg
            .enter()
            .append( 'svg' );

        svg.style( 'display', enable ? 'block' : 'none' );

        let defs = svg
            .selectAll( 'defs' )
            .data( [ 0 ] )
            .enter()
            .append( 'defs' );

        let m = defs
            .selectAll( 'marker' )
            .data( markers );

        m.enter()
            .append( 'marker' )
            .attr( 'id', d => d.id )
            .attr( 'markerWidth', d => d.w )
            .attr( 'markerHeight', d => d.h )
            .attr( 'refX', d => d.x )
            .attr( 'refY', d => d.y )
            .attr( 'orient', d => d.o )
            .attr( 'markerUnits', d => d.u )
            .html( d => d.t );

        let paths = svg
            .selectAll( 'path.arrow.line' )
            .data( [ gj ] );

        let path = d3.geoPath()
            .projection( projection );

        paths.enter()
            .append( 'path' )
            .attr( 'class', 'arrow line' )
            .attr( 'style', 'marker-end: url(#markerArrow)' );

        paths.attr( 'd', path );

        if ( Object.keys( gj ).length > 0 ) {
            d3.select( '.arrow-background' ).raise();
        } else {
            d3.select( '.arrow-background' ).lower();
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

    render.id = 'layer-arrow';

    return render;
}
