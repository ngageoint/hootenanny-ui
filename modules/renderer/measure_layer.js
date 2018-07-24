/*******************************************************************************************************
 * File: measure_layer
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/24/18
 *******************************************************************************************************/

import {
    utilGetDimensions,
    utilSetDimensions
} from '../util/dimensions';

export function rendererMeasureLayer( context ) {
    let projection,
        gj      = {},
        enable  = true,
        svg,
        markers = [ {
            id: 'measureCircle',
            w: 10,
            h: 10,
            x: 5,
            y: 5,
            t: '<circle cx="5" cy="5" r="5" class="measure tail"/>',
            u: 'userSpaceOnUse'
        } ];

    function render( selection ) {
        svg = selection.selectAll( 'svg' )
            .data( [ 0 ] )
            .enter()
            .append( 'svg' );

        let defs = svg
            .append( 'defs' );

        let m = defs.selectAll( 'marker' )
            .data( markers );

        m.enter().append( 'marker' )
            .attr( 'id', d => d.id )
            .attr( 'markerWidth', d => d.w )
            .attr( 'markerHeight', d => d.h )
            .attr( 'refX', d => d.x )
            .attr( 'refY', d => d.y )
            .attr( 'orient', d => d.o )
            .attr( 'markerUnits', d => d.u )
            .html( d => d.t );

        svg.style( 'display', enable ? 'block' : 'none' );

        let paths = svg
            .selectAll( 'path.measure.line' )
            .data( [ gj ] );

        paths
            .enter()
            .append( 'path' )
            .attr( 'class', 'measure line' )
            .attr( 'style', 'marker-end: url(#markerMeasure);' );

        let path = d3.geoPath()
            .projection( projection );

        paths
            .attr( 'd', path );

        render.update();
    }

    render.update = function() {
        let measureLines = d3.selectAll( '[class*=measure-line-]' ),
            measureArea  = d3.selectAll( '.measure-area' ),
            measureLabel = d3.select( '.measure-label-text' );

        if ( !measureLines.empty() ) {
            measureLines.each( function() {
                let line = d3.select( this ),
                    loc1 = line.attr( 'loc1' ).split( /,/ ).map( parseFloat ),
                    loc2 = line.attr( 'loc2' ).split( /,/ ).map( parseFloat ),
                    c1   = context.projection( loc1 ),
                    c2   = context.projection( loc2 );

                line.attr( 'x1', c1[ 0 ].toString() )
                    .attr( 'y1', c1[ 1 ].toString() );

                line.attr( 'x2', c2[ 0 ].toString() )
                    .attr( 'y2', c2[ 1 ].toString() );
            } );
        }

        if ( !measureArea.empty() ) {
            measureArea.each( function() {
                let measArea = d3.select( this ),
                    newPts   = '';

                if ( _.isEmpty( measArea.attr( 'loc' ) ) ) return;

                let pts       = measArea.attr( 'loc' ).trim().split( / / ),
                    ptsLength = measureArea.classed( 'measure-complete' ) ? pts.length : pts.length - 1;

                for ( let i = 0; i < ptsLength; i++ ) {
                    let newpt = pts[ i ].split( /,/ ).map( parseFloat ),
                        c     = context.projection( newpt );

                    newPts = newPts + ' ' + c.toString();
                }

                measureArea.attr( 'points', newPts );
                measureArea.classed( 'updated', true );
            } );
        }

        if ( !measureLabel.empty() ) {
            let labelMargin = !measureLines.empty() ? 10 : 30,
                loc         = measureLabel.attr( 'loc' ).split( /,/ ).map( parseFloat ),
                c           = context.projection( loc );

            measureLabel
                .attr( 'x', c[ 0 ] + labelMargin )
                .attr( 'y', c[ 1 ] + labelMargin );

            // TODO: delete if not needed
            //let tspans = measureLabel.selectAll( 'tspan' );
            //
            //if ( !tspans.empty() ) {
            //    let diff = 0;
            //
            //    tspans.each( function() {
            //        d3.select( this )
            //            .attr( 'x', c[ 0 ] + 10 )
            //            .attr( 'y', c[ 1 ] + diff );
            //
            //        diff += 25;
            //    } );
            //}
        }
    };

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
        if ( !arguments.length ) return utilGetDimensions( svg );
        utilSetDimensions( svg, _ );
        return render;
    };

    render.id = 'layer-measure';

    return render;
};