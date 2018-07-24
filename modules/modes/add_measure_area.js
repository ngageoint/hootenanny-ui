/*******************************************************************************************************
 * File: add_measure_area.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/24/18
 *******************************************************************************************************/

import { behaviorDrawMeasureArea } from '../behavior';
import { modeBrowse }              from './browse';

export function modeAddMeasureArea( context ) {
    let addArea = {
        id: 'measure-add-line',
        key: '6'
    };

    let svg = d3.select( '.data-layer-measure' ).select( 'svg' );

    let behavior = behaviorDrawMeasureArea( context, svg )
        .on( 'cancel', addArea.cancel )
        .on( 'finish', finish );

    function finish( nodeId, ptArr ) {
        if ( ptArr.length < 3 ) {
            d3.select( '.data-layer-measure' ).selectAll( 'g' ).remove();
        } else {
            d3.selectAll( `.measure-line-${ nodeId }` ).each( function() {
                d3.select( this.parentNode ).remove();
            } );

            d3.selectAll( `.measure-vertex-${ nodeId }` ).remove();
        }

        context.enter( modeBrowse( context ) );
    }

    addArea.cancel = function() {

    };

    addArea.enter = function() {
        d3.select( '.data-layer-measure' ).selectAll( 'g' ).remove();
        context.install( behavior );
    };

    addArea.exit = function() {
        context.uninstall( behavior );
    };

    return addArea;
}