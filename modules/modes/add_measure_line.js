/*******************************************************************************************************
 * File: add_measure_line.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/23/18
 *******************************************************************************************************/

import { behaviorDrawMeasureLine } from '../behavior';
import { modeBrowse }              from './browse';

export function modeAddMeasureLine( context ) {
    let mode = {
        id: 'measure-add-line',
        key: '6'
    };

    let svg = d3.select( '.layer-measure' ).select( 'svg' );

    let behavior = behaviorDrawMeasureLine( context, svg )
        .on( 'finish', finish );

    d3.select('.layer-measure').selectAll('g').remove();

    function finish() {
        d3.event.stopPropagation();
        context.pop();
        context.enter( modeBrowse( context ) );
    }

    mode.enter = function() {
        d3.select('.layer-measure').selectAll('g').remove();
        context.install( behavior );
    };

    mode.exit = function() {
        context.uninstall( behavior );
    };

    return mode;
}
