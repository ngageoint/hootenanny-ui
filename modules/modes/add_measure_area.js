/*******************************************************************************************************
 * File: add_measure_area.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/24/18
 *******************************************************************************************************/

import { behaviorDrawMeasureArea } from '../behavior';
import { modeBrowse }              from './browse';

export function modeAddMeasureArea( context ) {
    let addArea = {
        id: 'measure-add-area',
        key: '7'
    };

    let svg = d3.select( '.data-layer.measure' ).select( 'svg' );

    let behavior = behaviorDrawMeasureArea( context, svg )
        .on( 'cancel', addArea.cancel )
        .on( 'finish', finish );

    function finish( nodeId, ptArr ) {
        if ( ptArr.length < 3 ) {
            d3.select( '.data-layer.measure' ).selectAll( 'g' ).remove();
        }

        if ( d3.select( '.data-layer.measure' ).selectAll( 'g' ).size() ) {
            d3.select( '.tools-toggle' ).text( 'Clear' );
        }

        context.enter( modeBrowse( context ) );
    }

    addArea.cancel = function() {

    };

    addArea.enter = function() {
        d3.select( '.data-layer.measure' ).selectAll( 'g' ).remove();
        context.install( behavior );
    };

    addArea.exit = function() {
        context.uninstall( behavior );
    };

    return addArea;
}
