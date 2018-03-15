/** ****************************************************************************************************
 * File: folderTree.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/5/18
 *******************************************************************************************************/

import FolderManager from '../models/folderManager';
import _ from 'lodash-es';
import moment from 'moment';
import { contextMenus } from '../config/domElements';

/**
 * Class for creating, displaying and maintaining a folder tree hierarchy
 *
 * @param container - Container used to render the tree into
 * @constructor
 */
export default function FolderTree( container ) {
    const self = this;

    this.container      = container;
    this.isDatasetTable = this.container.attr( 'id' ) === 'dataset-table';

    this.margin    = { top: 10, right: 20, bottom: 30, left: 0 };
    this.width     = '100%';
    this.height    = '100%';
    this.barHeight = 20;
    this.duration  = 0;

    this.x = d3.scaleLinear()
        .domain( [ 0, 0 ] )
        .range( [ 0, 0 ] );

    this.y = d3.scaleLinear()
        .domain( [ 0, 0 ] )
        .range( [ 20, 0 ] );

    this.tree = d3.tree()
        .nodeSize( [ 0, 20 ] );

    this.diagonal = d => {
        if ( d.source && d.target ) {
            return 'M' + d.source.y + ',' + d.source.x
                + 'C' + (d.source.y + d.target.y) / 2 + ',' + d.source.x
                + ' ' + (d.source.y + d.target.y) / 2 + ',' + d.target.x
                + ' ' + d.target.y + ',' + d.target.x;
        }
    };

    this.svg = container.append( 'svg' )
        .attr( 'width', this.width )
        .attr( 'height', this.height )
        .append( 'g' )
        .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );

    /**
     * Initialize the folder tree
     */
    this.init = () => {
        let folders = FolderManager.getAvailFolderData();

        if ( this.isDatasetTable ) {
            folders = _.without( folders, _.find( folders, { id: -1 } ) );
        }

        folders = {
            name: 'Datasets',
            id: 'Datasets',
            children: folders
        };

        this.root    = d3.hierarchy( folders );
        this.root.x0 = 0;
        this.root.y0 = 0;

        this.update( this.root );
    };

    /**
     * Update the tree by adding/deleting nodes
     *
     * @param source - source node
     */
    this.update = source => {
        let nodes       = this.tree( this.root ),
            height      = Math.max( 150, nodes.length * this.barHeight + this.margin.top + this.margin.bottom ),
            nodesSort   = [],
            parentDepth = 0;

        this.container.select( 'svg' ).transition()
            .duration( 0 )
            .style( 'height', `${height}px` );

        nodes.eachBefore( n => {
            // Update leaf nodes to have similar structure to regular nodes
            if ( n.depth && n.depth > 0 ) {
                parentDepth = n.depth;
            } else {
                n.depth = parentDepth + 1;
            }

            if ( !n.data ) {
                n.data = n;
            }

            nodesSort.push( n );
        } );

        // Set vertical position of node
        nodesSort.forEach( ( n, i ) => {
            n.x = (i - 1) * this.barHeight;
            n.y = n.depth * 20;
        } );

        // Bind node data
        let node = this.svg.selectAll( 'g.node' )
            .data( nodesSort, d => d );

        // Render parent g element of node
        let nodeElement = node.enter().append( 'g' )
            .attr( 'class', 'node' )
            .attr( 'transform', `translate( 0, ${ source.x0 } )` )
            .style( 'opacity', 0 )
            .on( 'click', function( d ) {
                self.click.call( this, d );
            } )
            .on( 'contextmenu', function( d ) {
                self.bindContextMenu.call( this, d );
            } );

        // Render node rect
        nodeElement.append( 'rect' )
            .attr( 'y', -this.barHeight / 2 )
            .attr( 'height', this.barHeight )
            .attr( 'width', '100%' )
            .style( 'fill', this.fillColor )
            .attr( 'class', this.rectClass );

        // Render node icon
        nodeElement.append( 'g' )
            .append( 'svg:foreignObject' )
            .attr( 'width', 20 )
            .attr( 'height', 20 )
            .attr( 'transform', d => {
                let dd = d.depth - 1,
                    dy = 5.5 + (11 * dd);

                return `translate( ${ dy }, -11 )`;
            } )
            .html( d => {
                let { data } = d;

                if ( data.type === 'folder' ) {
                    if ( data.state === 'open' ) {
                        return '<i class="_icon open-folder"></i>';
                    } else {
                        return '<i class="_icon folder"></i>';
                    }
                } else if ( data.type === 'dataset' ) {
                    return '<i class="_icon data"></i>';
                }
            } );

        // Render node name
        nodeElement.append( 'text' )
            .style( 'fill', this.fontColor )
            .classed( 'dnameTxt', true )
            .attr( 'dy', 3.5 )
            .attr( 'dx', d => {
                let dd = d.depth - 1;
                return 25.5 + (11 * dd);
            } )
            .append( 'tspan' ).text( d => d.data.name )
            .each( function( d ) {
                let textNode = d3.select( this );

                if ( d.data.type === 'folder' ) {
                    textNode.attr( 'folder-id', d => d.id );
                } else if ( d.data.type === 'dataset' ) {
                    textNode.attr( 'layer-id', d => d.id );
                }
            } );

        // Render text values and lines for nodes
        this.renderText( nodeElement.filter( d => d.data.type === 'dataset' ) );
        this.renderLines( nodeElement.filter( d => d.depth > 1 ) );

        // Transition nodes to their new position
        nodeElement.transition()
            .duration( this.duration )
            .attr( 'transform', d => `translate( 0, ${ d.x } )` )
            .style( 'opacity', 1 );

        node.transition()
            .duration( this.duration )
            .attr( 'transform', d => `translate( 0, ${ d.x } )` )
            .style( 'opacity', 1 )
            .select( 'rect' )
            .style( 'fill', this.fillColor )
            .attr( 'class', this.rectClass );

        node.exit().remove(); // remove old elements

        this.root.each( d => {
            d.x0 = d.x;
            d.y0 = d.y;
        } );
    };

    /**
     * Render lines that connect nodes together
     *
     * @param nodes - tree nodes
     */
    this.renderLines = nodes => {
        nodes.append( 'line' )
            .attr( 'x1', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'x2', d => 9.5 + (11 * (d.depth - 1)) )
            .attr( 'y1', 0 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );

        nodes.append( 'line' )
            .attr( 'x1', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'x2', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'y1', -20 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );
    };

    /**
     * Render all text values for each node
     *
     * @param nodes - tree nodes
     */
    this.renderText = nodes => {
        nodes.append( 'text' )
            .classed( 'dsizeTxt', true )
            .style( 'fill', this.fontColor )
            .attr( 'dy', 3.5 )
            .attr( 'dx', '98%' )
            .attr( 'text-anchor', 'end' )
            .text( d => {
                let size  = d.data.size,
                    units = [ 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ],
                    u     = -1;

                if ( Math.abs( size ) < 1000 ) {
                    return size + ' B';
                }

                do {
                    size /= 1000;
                    ++u;
                } while ( Math.abs( size ) >= 1000 && u < units.length - 1 );

                return size.toFixed( 1 ) + ' ' + units[ u ];
            } );

        if ( this.isDatasetTable ) {
            nodes.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '80%' )
                .attr( 'text-anchor', 'end' )
                .text( d => d.data.date );

            nodes.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '45%' )
                .attr( 'text-anchor', 'end' )
                .text( d => {
                    let lastAccessed = d.data.lastAccessed,
                        timeAgo      = lastAccessed.replace( /[-:]/g, '' ),
                        dateActive   = moment( timeAgo ).fromNow(),
                        oldData      = moment().diff( moment( timeAgo ), 'days' ) > 60;

                    if ( oldData ) {

                    }

                    return dateActive;
                } );
        }
    };

    /**
     * Logic for right-click and ctrl+click
     *
     * @param d - tree node
     */
    this.bindContextMenu = function( d ) {
        let selected = d.selected || false;

        d3.event.preventDefault();

        if ( d3.event.ctrlKey && d3.event.which === 1 ) {
            d.selected = !selected;
            FolderManager.updateSelectedDatasets( d.id );
        } else if ( d.data.type === 'dataset' ) {
            if ( !selected ) {
                let selectedNodes = _.filter( self.root.descendants(), node => node.selected );

                // Un-select all other nodes
                _.each( selectedNodes, node => {
                    node.selected = false;
                } );

                d.selected = true;
                FolderManager.updateSelectedDatasets( d.id, true );
            }

            self.openContextMenu( d );
        }

        self.update( d );
    };

    /**
     * Create and open a context menu
     *
     * @param d - tree node
     */
    this.openContextMenu = d => {
        let { data } = d,
            items;

        if ( data.type === 'dataset' ) {
            const selectedCount = FolderManager.selectedDatasets.length;

            items = [
                {
                    title: `Delete (${ selectedCount })`,
                    icon: 'trash',
                    click: 'deleteDataset'
                },
                {
                    title: `Move (${ selectedCount })`,
                    icon: 'info',
                    click: 'moveDataset'
                }
            ];

            if ( selectedCount > 1 && selectedCount <= 10 ) {
                items.push( contextMenus.dataset.multiDataset );
            } else {
                items = _.concat( items, contextMenus.dataset.singleDataset );
                items.splice( 3, 0, {
                    title: `Rename ${ d.name }`,
                    icon: 'info',
                    click: 'renameDataset'
                } );
            }
        } else if ( data.type === 'folder' ) {
            items = contextMenus.folder;
            items = items.splice( 1, 0, {
                title: `Rename/Move ${ d.name }`,
                icon: 'info',
                click: 'modifyFolder'
            } );
        }

        if ( this.contextMenu ) {
            this.contextMenu.remove();
        }

        const body = d3.select( 'body' )
            .on( 'click', () => d3.select( '.context-menu' ).style( 'display', 'none' ) );

        this.contextMenu = body
            .append( 'div' )
            .classed( 'context-menu', true )
            .style( 'display', 'none' );

        this.contextMenu
            .html( '' )
            .append( 'ul' )
            .selectAll( 'li' )
            .data( items ).enter()
            .append( 'li' )
            .attr( 'class', item => `_icon ${ item.icon }` )
            .text( item => item.title )
            .on( 'click', item => {
                let { data } = d,
                    node,
                    key      = {
                        name: data.name,
                        id: data.id
                    };

                console.log( item );
            } );

        this.contextMenu
            .style( 'left', `${ d3.event.pageX - 2 }px` )
            .style( 'top', `${ d3.event.pageY - 2 }px` )
            .style( 'display', 'block' );
    };

    /**
     * Select, expand, or collapse an item in the table.
     *
     * @param d - tree node
     */
    this.click = function( d ) {
        let selected = d.data.selected || false,
            isOpen   = d.data.state === 'open';

        if ( d.data.type === 'dataset' ) {
            if ( d3.event.metaKey ) {
                d.data.selected = !d.data.selected;
                FolderManager.updateSelectedDatasets( d.data.id );
            } else {
                // Get all currently selected nodes
                let selectedNodes = _.filter( self.root.descendants(), node => node.data.selected );

                // Un-select all other nodes
                _.each( selectedNodes, node => {
                    node.data.selected = false;
                } );

                // If multiple are already selected, keep the target node selected
                if ( selectedNodes.length > 1 && selected ) {
                    d.data.selected = true;
                } else {
                    d.data.selected = !selected;
                }

                FolderManager.updateSelectedDatasets( d.data.id, true );
            }
        }

        // Folder
        if ( isOpen ) {
            d.data.state = 'closed';

            d3.select( this.parentNode )
                .select( 'i' )
                .classed( 'folder', true )
                .classed( 'open-folder', false );

            if ( d.children ) {
                d.data._children = d.children;
                d.children       = null;
                d.data.selected  = false;
            }
        } else {
            d.data.state = 'open';

            d3.select( this.parentNode )
                .select( 'i' )
                .classed( 'folder', false )
                .classed( 'open-folder', true );

            d.children       = d.data._children || null;
            d.data._children = null;
        }

        self.update( d );
    };

    /**
     * Fill a rect element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - Hex color code
     */
    this.fillColor = d => {
        let { data } = d;

        if ( data.type === 'folder' ) {
            return '#7092ff';
        }
        else if ( data.type === 'dataset' ) {
            if ( data.selected ) {
                return '#ffff99';
            }
            return '#efefef';
        }
        else {
            return '#ffffff';
        }
    };

    /**
     * Fill a text element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - hex color code
     */
    this.fontColor = d => {
        let { data } = d;

        if ( data.type === 'folder' ) {
            return '#ffffff';
        }
        else if ( data.type === 'dataset' ) {
            return '#7092ff';
        }
        else {
            return '#ffffff';
        }
    };

    /**
     * Assign a CSS class to a rect element based
     * on it's type and the current state that it's in
     *
     * @param d - tree node
     * @returns {string} - CSS class
     */
    this.rectClass = d => {
        let { data } = d;

        // set selected layers
        if ( data.type === 'dataset' && self.containerId === 'dataset-table' ) {
            if ( data.selected ) {
                if ( self.selectedLayerIDs.indexOf( data.layerId ) === -1 ) {
                    self.selectedLayerIDs.push( data.layerId );
                }
            } else {
                let idx = this.selectedLayerIDs.indexOf( data.layerId );
                if ( idx > -1 ) {
                    self.selectedLayerIDs.splice( idx, 1 );
                }
            }
        }

        return data.selected
            ? 'sel'
            : data._children
                ? 'more'
                : 'flat';
    };
}