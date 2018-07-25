/*******************************************************************************************************
 * File: tools.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/19/18
 *******************************************************************************************************/

import {
    modeAddMeasureArea,
    modeAddMeasureLine
} from '../modes';

import { svgIcon } from '../svg';

import { dropdown } from '../Hoot/tools/utilities';

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
                    icon: 'iD-icon-line',
                    mode: modeAddMeasureLine( context )
                },
                {
                    title: 'Measure Area',
                    tooltip: 'Shortcut: 7',
                    group: 'measure',
                    type: 'area',
                    icon: 'iD-icon-area',
                    mode: modeAddMeasureArea( context )
                },
                {
                    title: 'Measure Help',
                    tooltip: '',
                    group: 'measure',
                    type: 'help',
                    icon: 'iD-icon-help',
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
                    icon: 'iD-operation-split',
                    action: 'clipData'
                }
            ]
        }
    ];

    let toolsToggle,
        toolsMenu,
        menuItems,
        subMenu,
        subItems;

    return function( selection ) {
        toolsToggle = selection
            .append( 'button' )
            .classed( 'tools-toggle', true )
            .text( 'Tools' );

        toolsMenu = d3.select( '.limiter' )
            .append( 'ul' )
            .classed( 'tools-menu dropdown-content round', true );

        menuItems = toolsMenu
            .selectAll( 'li' )
            .data( items )
            .enter();

        let item = menuItems
            .append( 'li' )
            .attr( 'class', d => `${ d.icon } tools-${ d.group }` )
            .on( 'mouseenter', renderSubMenu );

        item.append( 'span' )
            .text( d => d.title );

        item.append( 'i' )
            .classed( 'material-icons', true )
            .text( 'arrow_right' );

        initDropdown();
    };

    function initDropdown() {
        let duration = 50,
            $toolsToggle = $( '.tools-toggle' );

        $toolsToggle.one( 'click', () => {
            if ( toolsToggle.text() === 'Clear' ) {
                d3.select( '.data-layer-measure' ).selectAll( 'g' ).remove();
                toolsToggle.text( 'Tools' );

                initDropdown();
            } else {
                toggle();
            }
        } );

        function toggle( cb ) {
            $toolsToggle.parent().siblings( '.dropdown-content' ).slideToggle( duration, function() {
                if ( cb ) {
                    cb();
                }

                if ( toolsMenu.style( 'display' ) === 'none' ) {
                    destroySubMenu();
                }

                if ( !$( this ).is( ':visible' ) ) return;

                bindBodyClick();
            } );
        }

        function bindBodyClick() {
            $( 'body' ).one( 'click', () => toggle( () => initDropdown() ) );
        }
    }

    function renderSubMenu() {
        let selected = d3.select( this );

        if ( !selected.select( '.sub-menu' ).empty() ) return;

        destroySubMenu();

        selected.classed( 'highlight', true );

        subMenu = d3.select( this )
            .append( 'ul' )
            .classed( 'sub-menu round', true )
            .style( 'left', () => {
                let menuWidth = Math.ceil( toolsMenu.node().getBoundingClientRect().width ),
                    marginLeft = 5;

                return menuWidth + marginLeft + 'px';
            } )
            .style( 'top', selected.node().offsetTop + 'px' );

        subItems = subMenu
            .selectAll( '.sub-items' )
            .data( d => d.items )
            .enter();

        let item = subItems
            .append( 'li' )
            .attr( 'class', d => `${ d.icon } tools-${ d.group }` )
            .style( 'height', selected.node().getBoundingClientRect().height + 'px' )
            .on( 'click', d => {
                if ( d.mode ) {
                    context.enter( d.mode );
                }
            } );

        item.each( function( d ) {
            d3.select( this ).call( svgIcon( `#${ d.icon }`, 'pre-text' ) );
        } );

        item.append( 'span' )
            .text( d => d.title );
    }

    function destroySubMenu() {
        toolsMenu.selectAll( 'li' ).classed( 'highlight', false );
        toolsMenu.selectAll( '.sub-menu' ).remove();
    }
}