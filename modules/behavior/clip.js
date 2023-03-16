/*******************************************************************************************************
 * File: clip.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/26/18
 *******************************************************************************************************/

import { utilRebind }           from '../util/rebind';
import { geoEuclideanDistance } from '../geo';

export function clip( context, svg ) {
    let dispatch       = d3.dispatch( 'move', 'click', 'cancel', 'finish', 'dblclick' ),
        closeTolerance = 4,
        tolerance      = 12,
        nodeId,
        rect,
        anchorPt;

    function mousedown(d3_event) {
        d3_event.stopPropagation();

        function point() {
            let p = element.node().parentNode;

            return touchId !== null
                ? d3.touches( p ).filter( p => p.identifier === touchId )[ 0 ]
                : d3.pointer( p );
        }

        let element = d3.select( this ),
            touchId = d3_event.touches ? d3_event.changedTouches[ 0 ].identifier : null,
            time    = +new Date(),
            pos     = point();

        element.on( 'dblclick', () => ret( element ) );
        element.on( 'mousemove.cliparea', null );

        d3.select( window ).on( 'mouseup.cliparea', (d3_event) => {
            element.on( 'mousemove.cliparea', mousemove );
            if ( geoEuclideanDistance( pos, point() ) < closeTolerance ||
                (geoEuclideanDistance( pos, point() ) < tolerance &&
                    (+new Date() - time) < 500) ) {

                // Prevent a quick second click
                d3.select( window ).on( 'click.cliparea-block', (d3_event) => {
                    d3_event.stopPropagation();
                }, true );

                context.map().dblclickEnable( false );

                window.setTimeout( () => {
                    context.map().dblclickEnable( true );
                    d3.select( window ).on( 'click.cliparea-block', null );
                }, 500 );

                click(d3_event);
            }
        } );
    }

    function mousemove() {
        let c = context.projection( context.map().mouseCoordinates() );

        if ( nodeId > 0 ) {
            let width  = Math.abs( c[ 0 ] - anchorPt[ 0 ] ),
                height = Math.abs( c[ 1 ] - anchorPt[ 1 ] );

            if ( c[ 0 ] < anchorPt[ 0 ] ) {
                rect.attr( 'x', c[ 0 ] );
            } else {
                rect.attr( 'x', anchorPt[ 0 ] );
            }

            if ( c[ 1 ] < anchorPt[ 1 ] ) {
                rect.attr( 'y', c[ 1 ] );
            } else {
                rect.attr( 'y', anchorPt[ 1 ] );
            }

            rect
                .attr( 'width', width )
                .attr( 'height', height );
        }
    }

    function click(d3_event) {
        let c = context.projection( context.map().mouseCoordinates() );

        if ( nodeId === 0 ) {
            anchorPt = c;

            rect
                .attr( 'x', c[ 0 ] )
                .attr( 'y', c[ 1 ] );

            nodeId = 1;
        }
        else {
            let minCoords = context.projection.invert( [
                parseFloat( rect.attr( 'x' ) ),
                parseFloat( rect.attr( 'y' ) ) + parseFloat( rect.attr( 'height' ) )
            ] );

            let maxCoords = context.projection.invert( [
                parseFloat( rect.attr( 'x' ) ) + parseFloat( rect.attr( 'width' ) ),
                parseFloat( rect.attr( 'y' ) )
            ] );

            d3.select( '#surface' ).on( 'dblclick', null );

            ret( d3_event, [ minCoords, maxCoords ] );

            nodeId = 0;
        }
    }

    function ret( d3_event, extent ) {
        d3_event.preventDefault();
        dispatch.call( 'finish', this, extent );
    }

    function cliparea( selection ) {
        nodeId = 0;

        let g = svg.append( 'g' );

        rect = g
            .append( 'rect' )
            .classed( 'measure-area', true )
            .style( 'stroke', 'white' )
            .style( 'stroke-width', '2px' )
            .style( 'stroke-linecap', 'round' )
            .style( 'fill', 'black' )
            .style( 'fill-opacity', '0.3' )
            .attr( 'x', 0 )
            .attr( 'y', 0 )
            .attr( 'width', '0' )
            .attr( 'height', '0' );

        selection
            .on( 'mousedown.cliparea', mousedown )
            .on( 'mousemove.cliparea', mousemove );

        return cliparea;
    }

    cliparea.off = function( selection ) {
        selection
            .on( 'mousedown.cliparea', null )
            .on( 'mousemove.cliparea', null );

        d3.select( window )
            .on( 'mouseup.cliparea', null );
    };

    return utilRebind( cliparea, dispatch, 'on' );
}
