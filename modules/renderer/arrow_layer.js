/** ****************************************************************************************************
 * File: arrow_layer.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/28/18
 *******************************************************************************************************/

import { utilSetDimensions, utilGetDimensions } from '../util/dimensions';

export function rendererArrowLayer() {
    let projection,
        gj      = {},
        enable  = true,
        svg,
        s,
        marker = [
            {
                id: 'markerCircle',
                w: 10,
                h: 10,
                x: 5,
                y: 5,
                t: '<circle cx="5" cy="5" r="5" class="arrow tail"/>',
                u: 'userSpaceOnUse'
            },
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

        s.style( 'display', enable ? 'block' : 'none' );

        let defs = s.append( 'defs' );

        let m = defs
            .selectAll( 'marker' )
            .data( marker );

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

        // console.log( gj );
        // let d;
        //
        // if ( gj.coordinates ) {
        //     d = gj.coor
        // }

        // let d = gj.coordinates ? gj.coordinates : [ 0 ];
        //
        // let link = s
        //     .selectAll( '.arrow.line' )
        //     .data( d );
        //
        // link.enter()
        //     .append( 'line' )
        //     .attr( 'class', 'arrow line' )
        //     .attr( 'marker-start', 'url(#markerCircle)' )
        //     .attr( 'marker-end', 'url(#markerArrow)' )
        //     .attr( 'x1', d => d[0][0])
        //     .attr( 'y1', d => d[0][1])
        //     .attr( 'x2', d => d[1][0])
        //     .attr( 'y2', d => d[1][1]);
            // .attr( 'style', 'marker-end: url(#markerArrow)' );
            // .attr( 'x1', function( d ) {
            //     console.log( d );
            //     if ( d.source ) {
            //         return d.source.x;
            //     }
            // } )
            // .attr( 'y1', function( d ) {
            //     if ( d.source ) {
            //         return d.source.y;
            //     }
            // } )
            // .attr( 'x2', function( d ) {
            //     if ( d.target ) {
            //         return d.target.x;
            //     }
            // } )
            // .attr( 'y2', function( d ) {
            //     if ( d.target ) {
            //         return d.target.y;
            //     }
            // } );

        if ( d3.map( gj ).size() > 0 ) {
            // d3.select( '.arrow-background' ).raise();
            console.log( 'raise' );

            let d = gj.coordinates ? gj.coordinates : [ 0 ];

            console.log( d );

            console.log( d[0].concat( d[1]) );

            let link = s
                .selectAll( '.arrow.line' )
                .data( [ 0 ] );

            link.enter()
                .append( 'line' )
                .attr( 'class', 'arrow line' )
                .attr( 'marker-start', 'url(#markerCircle)' )
                .attr( 'marker-end', 'url(#markerArrow)' )
                .attr( 'x1', () => {
                    console.log( d );
                    return d[0];
                })
                .attr( 'y1', () => d[1])
                .attr( 'x2', () => d[2])
                .attr( 'y2', () => d[3]);
        } else {
            // d3.select( '.arrow-background' ).lower();
        }


        // console.log( 'projectionnnn: ', projection );

        // let path = d3.geoPath()
        //     .projection( projection );
        //
        // let paths = s
        //     .append( 'g' )
        //     .append( 'path' )
        //     // .selectAll( 'path.arrow.line' )
        //     .data( gj.coordinates )
        //     .attr( 'd', path )
        //     .attr( 'class', 'arrow line' )
        //     .attr( 'marker-end', 'url(#markerArrow)' );

        // paths.enter()
        //     .append( 'path' )
        //     .attr( 'class', 'arrow line' )
        //     // .attr( 'marker-start', 'url(#markerCircle)' )
        //     .attr( 'marker-end', 'url(#markerArrow)' )
        //     .attr( 'd', path );

        // paths.attr( 'd', 'M 0 -5 10 10' );
    }

    render.projection = function( _ ) {
        // console.log( 'projection: ', _ );
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
