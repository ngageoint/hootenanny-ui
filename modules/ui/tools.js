/*******************************************************************************************************
 * File: tools.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/19/18
 *******************************************************************************************************/

import {
    modeAddArea,
    modeAddLine,
} from '../modes';

export function uiTools( context ) {
    let items = [
        {
            title: 'Measurement Tools',
            icon: 'line',
            group: 'measure',
            items: [
                {
                    title: 'Measure Length',
                    tooltip: 'Shortcut: 6',
                    group: 'measure',
                    type: 'line',
                    icon: 'line',
                    mode: modeAddLine( context )
                },
                {
                    title: 'Measure Area',
                    tooltip: 'Shortcut: 7',
                    group: 'measure',
                    type: 'area',
                    icon: 'area',
                    mode: modeAddArea( context )
                },
                {
                    title: 'Measure Help',
                    tooltip: '',
                    group: 'measure',
                    type: 'help',
                    icon: 'help',
                    action: 'measureHelp'
                }
            ]
        },
        {
            title: 'Clip Tools',
            icon: 'clip',
            group: 'clip',
            items: [
                {
                    title: 'Clip Dataset',
                    tooltip: 'Shortcut: 8',
                    group: 'clip',
                    type: 'area',
                    icon: 'clip',
                    action: 'clipData'
                }
            ]
        }
    ];

    function toggleMenu() {
        let toolsMenu = d3.select( '.tools-menu' ),
            menuState = toolsMenu.classed( 'hidden' );

        toolsMenu.classed( 'hidden', !menuState );
    }

    return function( selection ) {
        let toolsMenu = selection
            .append( 'button' )
            .classed( 'tools-toggle', true )
            .on( 'click', () => toggleMenu() );

        let toolItems = d3.select( '.limiter' )
            .append( 'ul' )
            .classed( 'tools-menu hidden', true )
            .selectAll( 'li' )
            .data( items )
            .enter()
            .append( 'li' )
            .attr( 'class', d => `${ d.icon } tools-${ d.group }` )
            .on( 'mouseenter', d => {

            } );

        toolItems
            .append( 'span' )
            .text( d => d.title );
    };
}