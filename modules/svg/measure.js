/*******************************************************************************************************
 * File: measure.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/23/18
 *******************************************************************************************************/

import _isEmpty from 'lodash-es/isEmpty';

import {
    utilGetDimensions,
    utilSetDimensions
} from '../util/dimensions';
import { 
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

export function svgMeasure( projection, context, dispatch ) {
    let gj     = {},
        enable = true,
        svg;

    function drawMeasure( selection ) {
        svg = selection.selectAll( 'svg' )
            .data( [ 0 ] )
            .enter()
            .append( 'svg' );

        let measureLines = d3_selectAll( '[class*=measure-line-]' ),
            measureArea  = d3_selectAll( '.measure-area' ),
            measureLabel = d3_select( '.measure-label-text' );

        if ( !measureLines.empty() ) {
            measureLines.each( function() {
                let line = d3_select( this ),
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
                let measArea = d3_select( this ),
                    newPts   = '';

                if ( _isEmpty( measArea.attr( 'loc' ) ) ) return;

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

            let tspans = measureLabel.selectAll( 'tspan' );

            if ( !tspans.empty() ) {
                let diff = 0;

                tspans.each( function() {
                    d3_select( this )
                        .attr( 'x', c[ 0 ] + 10 )
                        .attr( 'y', c[ 1 ] + diff );
                    diff += 25;
                } );
            }
        }
    }

    drawMeasure.projection = function( _ ) {
        if ( !arguments.length ) return projection;
        projection = _;
        return this;
    };

    drawMeasure.enable = function( _ ) {
        if ( !arguments.length ) return enable;
        enable = _;
        dispatch.call( 'change' );
        return this;
    };

    drawMeasure.geojson = function( _ ) {
        if ( !arguments.length ) return gj;
        gj = _;
        return this;
    };

    drawMeasure.dimensions = function( _ ) {
        if ( !arguments.length ) return utilGetDimensions( svg );
        utilSetDimensions( svg, _ );
        return this;
    };

    drawMeasure.id = 'layer-measure';

    return drawMeasure;
}
