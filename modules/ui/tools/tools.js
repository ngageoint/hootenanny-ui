/*******************************************************************************************************
 * File: tools.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/19/18
 *******************************************************************************************************/

import {
    modeAddMeasureArea,
    modeAddMeasureLine
} from '../../modes';

import { svgIcon }  from '../../svg';
import selectBounds from '../../Hoot/tools/selectBounds';
import { uiTooltip }  from '../../ui/tooltip';
import { t } from '../../core/localizer';
import { select as d3_select }     from 'd3-selection';

export function uiTools( context ) {
    let menuItemMeta = [
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

    function renderButton( selection ) {
        toolsToggle = selection
            .append( 'button' )
            .classed( 'tools-toggle', true )
            .call( svgIcon( '#iD-icon-tools', 'pre-text' ) )
            .on('click', function() {
                renderMenu();
                d3_select(this).on('click', null);
            });

        toolsToggle
            .append( 'span' )
            .classed( 'label', true )
            .text( 'Tools' );

    }

    function addGrailItems() {
        const reference = Hoot.config.referenceLabel,
            secondary = Hoot.config.secondaryLabel;
        const grailItems = {
            title: 'Grail Tools',
            icon: 'line',
            group: 'grail',
            items: [
                {
                    title: 'Pull Remote Data',
                    tooltip: `Pull data for a bounding box from ${reference} and ${secondary} into Hootenanny datasets`,
                    placement: 'right',
                    group: 'grail',
                    type: 'area',
                    icon: 'iD-icon-load',
                    action: 'grailPull'
                },
                {
                    title: 'Derive Differential Changeset',
                    tooltip: `Derives a differential conflation changeset for a bounding box between ${reference} and ${secondary}`,
                    placement: 'right',
                    group: 'grail',
                    type: 'area',
                    icon: 'iD-icon-layers',
                    action: 'createDifferentialChangeset'
                },
                {
                    title: 'Derive Differential w/Tags Changeset',
                    tooltip: `Derives a differential with tags conflation changeset for a bounding box between ${reference} and ${secondary}`,
                    placement: 'right',
                    group: 'grail',
                    type: 'area',
                    icon: 'iD-icon-paste-tags-overwrite',
                    action: 'createDifferentialWithTagsChangeset'
                }
            ]
        };

        menuItemMeta.push(grailItems);
    }

    function renderMenu( ) {
        if ( Hoot.users.isAdvanced() ) {
            addGrailItems();
        }

        toolsMenu = d3_select( '.hoot-tools' )
            .append( 'ul' )
            .classed( 'tools-menu dropdown-content round', true );

        menuItems = toolsMenu
            .selectAll( 'li' )
            .data( menuItemMeta.filter(m => {
                return m.group !== 'grail' || Hoot.users.isAdvanced();
            }) );

        menuItems.exit().remove();

        let item = menuItems
            .enter()
            .append( 'li' )
            .attr( 'class', d => `menu-item tools-${ d.group }` )
            .on( 'click', (d3_event) => d3_event.stopPropagation() )
            .on( 'mouseenter', function( d3_event, d ) {
                renderSubMenu( this, d.items );
            } );

        item.append( 'span' )
            .text( d => d.title );

        item.append( 'i' )
            .classed( 'material-icons', true )
            .text( 'arrow_right' );

        initDropdown();
        toggle();
    }

    function renderSubMenu( node, items ) {
        let selected = d3_select( node );

        if ( !selected.select( '.sub-menu' ).empty() ) return;

        destroySubMenu();

        selected.classed( 'highlight', true );

        subMenu = d3_select( node.parentNode )
            .append( 'ul' )
            .classed( 'sub-menu round', true )
            .style( 'left', () => {
                let menuWidth  = Math.ceil( toolsMenu.node().getBoundingClientRect().width ),
                    marginLeft = 5;

                return menuWidth + marginLeft + 'px';
            } )
            .style( 'top', selected.node().offsetTop + 'px' );

        subItems = subMenu
            .selectAll( '.sub-items' )
            .data( items )
            .enter();

        let item = subItems
            .append( 'li' )
            .attr( 'class', d => `${ d.icon } tools-${ d.group }` )
            .style( 'height', selected.node().getBoundingClientRect().height + 'px' )
            .on( 'click', (d3_event, d) => {
                if ( d.mode ) {
                    context.enter( d.mode );
                } else if ( d.action === 'clipData' ) {
                    if ( Object.keys( Hoot.layers.loadedLayers ).length ) {
                        let clipSelectBounds = new selectBounds( context );

                        clipSelectBounds.render( 'clipData' );
                    } else {
                        let message = 'Add a layer before clipping',
                            type    = 'warn';

                        Hoot.message.alert( { message, type } );
                    }
                } else if ( d.action === 'grailPull' || d.action.startsWith('createDifferential')) {
                    let grailSelectBounds = new selectBounds( context );

                    grailSelectBounds.render( d.action );
                }
            } );

        item.each( function( d ) {
            d3_select( this )
                .call( svgIcon( `#${ d.icon }`, 'pre-text' ) )
                .call( uiTooltip().title( d.tooltip ) );
        } );

        item.append( 'span' )
            .text( d => d.title );
    }

    function destroySubMenu() {
        toolsMenu.selectAll( 'li' ).classed( 'highlight', false );
        toolsMenu.selectAll( '.sub-menu' ).remove();
    }

    function initDropdown() {
        let toolsToggle = d3_select( '.tools-toggle' );

        toolsToggle.on( 'click', () => {
            if ( toolsToggle.text() === 'Clear' ) {
                d3_select( '.data-layer.measure' ).selectAll( 'g' ).remove();
                toolsToggle
                    .text( '' )
                    .call( svgIcon( '#iD-icon-tools', 'pre-text' ) )
                    .append( 'span' )
                    .classed( 'label', true )
                    .text( 'Tools' );

                initDropdown();
            } else {
                toggle();
            }
        } );
    }

    function toggle( cb ) {
        d3_select('.hoot-tools').selectAll('.tools-menu')
            .style('display', function(d) {
                if ( cb ) cb();
                if ( d3_select(this).style( 'display' ) === 'none' ) {
                    setTimeout(bindSingleBodyClick, 100);
                    return 'block';
                } else {
                    setTimeout(destroySubMenu, 100);
                    return 'none';
                }
            });
    }

    function bindSingleBodyClick() {
        d3_select( 'body' ).on( 'click', () => {
            toggle( () => initDropdown() );
            d3_select( 'body' ).on('click', null);
        });
    }

    var tool = {
        id: 'tools',
        label: t.append('toolbar.tools')
    }

    tool.render = renderButton;

    return tool;
}
