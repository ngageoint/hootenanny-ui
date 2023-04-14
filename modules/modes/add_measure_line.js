/*******************************************************************************************************
 * File: add_measure_line.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/23/18
 *******************************************************************************************************/

import { behaviorDrawMeasureLine } from '../behavior';
import { modeBrowse }              from './browse';
import {
    select as d3_select, 
    selectAll as d3_selectAll
} from 'd3-selection';

export function modeAddMeasureLine( context ) {
    let addLine = {
        id: 'measure-add-line',
        key: '6'
    };

    let svg = d3_select( '.data-layer.measure' ).select( 'svg' );

    let behavior = behaviorDrawMeasureLine( context, svg )
        .on( 'cancel', addLine.cancel )
        .on( 'finish', finish );

    function finish( nodeId ) {
        d3_selectAll( '.measure-line-' + nodeId ).remove();

        d3_selectAll( '[class*="measure-line"]')
            .filter(function() {
                return d3_select(this).attr('loc1') === d3_select(this).attr('loc2');
            }).each(function() {
                this.parentNode.remove();
            });

        if ( d3_select( '.data-layer.measure' ).selectAll( 'g' ).size() ) {
            d3_select( '.tools-toggle' ).text( 'Clear' );
        }

        context.enter( modeBrowse( context ) );
    }

    addLine.cancel = function() {

    };

    addLine.enter = function() {
        d3_select('.data-layer.measure').selectAll('g').remove();
        context.install( behavior );
    };

    addLine.exit = function() {
        context.uninstall( behavior );
    };

    return addLine;
}
