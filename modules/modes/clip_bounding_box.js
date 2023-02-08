/*******************************************************************************************************
 * File: clip_bounding_box.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/26/18
 *******************************************************************************************************/

import { clip }       from '../behavior';
import { modeBrowse } from './browse';

export function modeDrawBoundingBox( instance, context ) {
    let clipBbox = {
        id: 'clip-bounding-box'
    };

    let svg = d3.select( '.data-layer.measure' ).select( 'svg' );

    let behavior = clip( context, svg )
        .on( 'finish', finish );

    function finish( d3_event, extent ) {
        d3_event.stopPropagation();
        context.enter( modeBrowse( context ) );

        instance.handleBounds( extent );
    }

    clipBbox.enter = function() {
        d3.select( '.data-layer.measure' ).selectAll( 'g' ).remove();
        context.install( behavior );
    };

    clipBbox.exit = function() {
        d3.select( '.data-layer.measure' ).selectAll( 'g' ).remove();
        context.uninstall( behavior );
    };

    return clipBbox;
}
