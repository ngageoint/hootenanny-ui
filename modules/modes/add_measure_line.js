/*******************************************************************************************************
 * File: add_measure_line.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/23/18
 *******************************************************************************************************/

import { behaviorDrawMeasureLine } from '../behavior';
import { modeBrowse }              from './browse';

export function modeAddMeasureLine( context ) {
    let addLine = {
        id: 'measure-add-line',
        key: '6'
    };

    let svg = d3.select( '.data-layer-measure' ).select( 'svg' );

    let behavior = behaviorDrawMeasureLine( context, svg )
        .on( 'cancel', addLine.cancel )
        .on( 'finish', finish );

    function finish( nodeId ) {
        d3.selectAll( '.measure-line-' + nodeId ).each( function() {
            d3.select( this.parentNode ).remove();
        } );

        d3.selectAll( '.measure-vertex-' + nodeId ).remove();

        if ( d3.select( '.data-layer-measure' ).selectAll( 'g' ).size() ) {
            d3.select( '.tools-toggle' ).text( 'Clear' );
        }

        context.enter( modeBrowse( context ) );
    }

    addLine.cancel = function() {

    };

    addLine.enter = function() {
        d3.select('.data-layer-measure').selectAll('g').remove();
        context.install( behavior );
    };

    addLine.exit = function() {
        context.uninstall( behavior );
    };

    return addLine;
}
