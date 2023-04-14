/*******************************************************************************************************
 * File: draw_measure_line.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/23/18
 *******************************************************************************************************/

import { utilRebind }            from '../util/rebind';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { geoDistance as d3_geoDistance } from 'd3-geo';
import { pointer as d3_pointer } from 'd3-selection';
import { geoEuclideanDistance }  from '../geo';

export function behaviorDrawMeasureLine( context, svg ) {
    let dispatch       = d3_dispatch( 'move', 'click', 'undo', 'cancel', 'finish', 'dblclick' ),
        closeTolerance = 4,
        tolerance      = 12,
        lastPoint      = null,
        totDist        = 0,
        segmentDist    = 0,
        nodeId,
        line,
        label;

    function mousedown(d3_event) {
        d3_event.stopPropagation();

        function point() {
            let p = element.node().parentNode;
            return d3_pointer( d3_event, p );
        }

        let element = d3_select( this ),
            time    = +new Date(),
            pos     = point();

        element.on( 'dblclick', (d3_event) => ret( d3_event, element ) );
        element.on( 'mousemove.drawline', null );

        d3_select( window ).on( 'mouseup.drawline', (d3_event) => {
            element.on( 'mousemove.drawline', mousemove );

            if ( geoEuclideanDistance( pos, point() ) < closeTolerance ||
                (geoEuclideanDistance( pos, point() ) < tolerance &&
                    (+new Date() - time) < 500) ) {

                // Prevent a quick second click
                d3_select( window ).on( 'click.drawline-block', (d3_event) => {
                    d3_event.stopPropagation();
                }, true );

                context.map().dblclickEnable( false );

                setTimeout( () => {
                    context.map().dblclickEnable( true );
                    d3_select( window ).on( 'click.drawline-block', null );
                }, 500 );

                click(d3_event);
            }
        } );
    }

    function mousemove() {
        let c = context.projection( context.map().mouseCoordinates() );

        if ( nodeId > 0 ) {
            c = context.projection( context.map().mouseCoordinates() );
            line.attr( 'x2', c[ 0 ] )
                .attr( 'y2', c[ 1 ] )
                .attr( 'loc2', context.map().mouseCoordinates() );

            let distance = d3_geoDistance( lastPoint, context.map().mouseCoordinates() );

            distance    = radiansToMeters( distance );
            segmentDist = distance;

            let currentDist = segmentDist + totDist;

            label.attr( 'x', c[ 0 ] + 10 )
                .attr( 'y', c[ 1 ] + 10 )
                .attr( 'loc', context.map().mouseCoordinates() )
                .text( () => displayLength( currentDist ) );
        }
    }

    function click( ) {
        let c = context.projection( context.map().mouseCoordinates() );

        totDist     = totDist + segmentDist;
        segmentDist = 0;

        if ( nodeId >= 0 ) {
            lastPoint = context.map().mouseCoordinates();
            let g     = svg.append( 'g' );

            svg.selectAll( 'g' ).selectAll( 'text' ).remove();
            label = g.append( 'text' )
                .classed( 'measure-label-text', true )
                .attr( 'x', c[ 0 ] + 10 )
                .attr( 'y', c[ 1 ] + 10 )
                .attr( 'loc', context.map().mouseCoordinates() )
                .style( 'fill', 'white' )
                .style( 'font-size', '18px' )
                .text( () => displayLength( totDist ) );

            line = g.append( 'line' )
                .classed( 'measure-line-' + nodeId, true )
                .style( 'stroke', 'white' ).style( 'stroke-width', '2px' ).style( 'stroke-linecap', 'round' )
                .attr( 'x1', c[ 0 ] )
                .attr( 'y1', c[ 1 ] )
                .attr( 'x2', c[ 0 ] )
                .attr( 'y2', c[ 1 ] )
                .attr( 'loc1', context.map().mouseCoordinates() )
                .attr( 'loc2', context.map().mouseCoordinates() );
        }

        nodeId++;
    }

    function displayLength( m ) {
        let imperial = context.imperial();

        let d = m * (imperial ? 3.28084 : 1),
            p, unit;

        if ( imperial ) {
            if ( d >= 5280 ) {
                d /= 5280;
                unit = 'mi';
            } else {
                unit = 'ft';
            }
        } else {
            if ( d >= 1000 ) {
                d /= 1000;
                unit = 'km';
            } else {
                unit = 'm';
            }
        }

        // drop unnecessary precision
        p = d > 1000 ? 0 : d > 100 ? 1 : 2;

        let retval = String( d.toFixed( p ) ) + ' ' + unit;

        return retval.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
    }

    function radiansToMeters( r ) {
        // using WGS84 authalic radius (6371007.1809 m)
        return r * 6371007.1809;
    }

    function backspace(d3_event) {
        d3_event.preventDefault();
        dispatch.call( 'undo' );
    }

    function del(d3_event) {
        d3_event.preventDefault();
        dispatch.call( 'cancel' );
    }

    function ret(d3_event) {
        let prevNodeId = nodeId - 1;

        d3_event.preventDefault();
        dispatch.call( 'finish', this, prevNodeId );
    }

    function drawline( selection ) {
        nodeId = 0;

        selection
            .on( 'mousedown.drawline', mousedown )
            .on( 'mousemove.drawline', mousemove );

        return drawline;
    }

    drawline.off = function( selection ) {
        selection
            .on( 'mousedown.drawline', null )
            .on( 'mousemove.drawline', null );

        d3_select( window )
            .on( 'mouseup.drawline', null );
    };

    return utilRebind( drawline, dispatch, 'on' );
}
