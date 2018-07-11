/** ****************************************************************************************************
 * File: folderTree.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/5/18
 *******************************************************************************************************/

import _                from 'lodash-es';
import moment           from 'moment';
import Event            from '../managers/eventManager';
import FolderManager    from '../managers/folderManager';
import { contextMenus } from '../config/domElements';

/**
 * Class for creating, displaying and maintaining a folder tree hierarchy
 *
 * @param container - Container used to render the tree into
 * @constructor
 */
export default class FolderTree {
    constructor( container ) {
        this.container              = container;
        this.isDatasetTable         = this.container.attr( 'id' ) === 'datasets-table';
        this.selectedNodes          = [];
        this.lastSelectedNode       = null;
        this.lastSelectedRangeNodes = null;

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

        this.svg = this.container.append( 'svg' )
            .attr( 'width', this.width )
            .attr( 'height', this.height )
            .append( 'g' )
            .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
    }

    /**
     * Initialize the folder tree
     */
    async render() {
        let folders = await FolderManager.getAvailFolderData();

        if ( this.isDatasetTable ) {
            folders = _.without( folders, _.find( folders, { id: -1 } ) );
        }

        folders = {
            name: 'Datasets',
            id: 'Datasets',
            children: folders // prevent collision of data
        };

        this.root    = d3.hierarchy( folders );
        this.root.x0 = 0;
        this.root.y0 = 0;

        this.update( this.root );
    }

    /**
     * Update the tree by adding/deleting nodes
     *
     * @param source - source node used to update tree
     */
    update( source ) {
        let nodeTree = this.tree( this.root ),
            height;

        let nodesSort   = this.sortNodes( nodeTree ),
            nodes       = this.svg.selectAll( 'g.node' ).data( nodesSort, d => d ),
            nodeElement = this.createNodeElement( nodes, source );

        height = Math.max( 150, nodesSort.length * this.barHeight );

        this.container.select( 'svg' ).transition()
            .duration( 0 )
            .style( 'height', `${ height }px` );

        // Render text values and lines for nodes
        this.renderText( nodeElement.filter( d => d.data.type === 'dataset' ) );
        this.renderLines( nodeElement.filter( d => d.depth > 1 ) );

        this.root.each( d => {
            d.x0 = d.x;
            d.y0 = d.y;
        } );
    }

    /**
     * Update nodes to all have a consistent data structure and
     * sort them so that they render in the correct order
     *
     * @param nodes - tree nodes
     * @returns {Array} - sorted nodes
     */
    sortNodes( nodes ) {
        let nodesSort   = [],
            parentDepth = 0,
            i           = 0; // manual iteration because eachBefore doesn't provide a key

        nodes.eachBefore( n => {
            // set vertical and horizontal position of node
            n.x = (i - 1) * this.barHeight;
            n.y = n.depth * 20;

            // update leaf nodes (nodes with no children) to have similar structure to regular nodes
            if ( n.depth && n.depth > 0 ) {
                parentDepth = n.depth;
            } else {
                n.depth = parentDepth + 1;
            }

            if ( !n.data ) {
                n.data = n;
            }

            nodesSort.push( n );
            i++;
        } );

        return nodesSort;
    }

    /**
     * Create base DOM element for node. Set it's position, icon, and name
     *
     * @param nodes - node data
     * @param source - source node used to update tree
     * @returns {d3} - node DOM element
     */
    createNodeElement( nodes, source ) {
        const self = this;

        let nodeElement = nodes.enter().append( 'g' )
            .attr( 'data-name', d => d.data.name )
            .attr( 'data-id', d => d.data.id )
            .attr( 'transform', `translate( 0, ${ source.x0 } )` )
            .classed( 'node', true )
            .style( 'opacity', 0 )
            .on( 'click', function( d ) {
                // use self as context but still pass in the clicked element
                self.click.call( self, this, d );
            } )
            .on( 'mousedown', () => {
                d3.event.preventDefault();
            } )
            .on( 'contextmenu', d => {
                d3.event.preventDefault();

                if ( this.isDatasetTable ) {
                    this.bindContextMenu( d );
                }
            } );

        // Render node rect
        nodeElement.append( 'rect' )
            .attr( 'y', -this.barHeight / 2 )
            .attr( 'height', this.barHeight )
            .attr( 'width', '100%' )
            .attr( 'class', d => this.rectClass( d ) )
            .style( 'fill', d => this.fillColor( d ) );

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
            .append( 'tspan' ).text( d => d.data.name );

        // Transition nodes to their new position
        nodeElement.transition()
            .duration( this.duration )
            .attr( 'transform', d => `translate( 0, ${ d.x } )` )
            .style( 'opacity', 1 );

        // remove old elements
        nodes.exit().remove();

        return nodeElement;
    }

    /**
     * Render lines that connect nodes together
     *
     * @param nodes - tree nodes
     */
    renderLines( nodes ) {
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
    }

    /**
     * Render text values for each node
     *
     * @param nodes - tree nodes
     */
    renderText( nodes ) {
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
    }

    wrapText( d, elem ) {
        let parent = elem.node().parentNode.parentNode;

        //elem.text( d.data.name );
        d3.select( parent ).append( 'title' ).text( d.data.name );
    }

    /**
     * Fill a rect element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - Hex color code
     */
    fillColor( d ) {
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
    }

    /**
     * Fill a text element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - hex color code
     */
    fontColor( d ) {
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
    }

    /**
     * Assign a CSS class to a rect element based
     * on it's type and the current state that it's in
     *
     * @param d - tree node
     * @returns {string} - CSS class
     */
    rectClass( d ) {
        let { data } = d;

        // set selected layers
        if ( data.type === 'dataset' && this.containerId === 'datasets-table' ) {
            if ( data.selected ) {
                if ( this.selectedLayerIDs.indexOf( data.layerId ) === -1 ) {
                    this.selectedLayerIDs.push( data.layerId );
                }
            } else {
                let idx = this.selectedLayerIDs.indexOf( data.layerId );
                if ( idx > -1 ) {
                    this.selectedLayerIDs.splice( idx, 1 );
                }
            }
        }

        return data.selected
            ? 'sel'
            : data._children
                ? 'more'
                : 'flat';
    }

    /**
     * Logic for right-click and ctrl+click
     *
     * @param d - tree node
     */
    bindContextMenu( d ) {
        let { data } = d,
            selected = d.data.selected || false;

        if ( d3.event.ctrlKey && d3.event.which === 1 ) {
            data.selected = !selected;
            this.selectedNodes.push( data );
        } else if ( d.data.type === 'dataset' ) {
            if ( !selected ) {
                let selectedNodes = _.filter( this.root.descendants(), node => node.data.selected );

                // Un-select all other nodes
                _.each( selectedNodes, node => {
                    node.data.selected = false;
                } );

                data.selected      = true;
                this.selectedNodes = [ data ];
            }

            this.openContextMenu( d );
        }

        this.update( d );
    }

    /**
     * Create and open a context menu
     *
     * @param d - tree node
     */
    openContextMenu( d ) {
        let { data } = d,
            items;

        if ( data.type === 'dataset' ) {
            const selectedCount = this.selectedNodes.length;

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
                switch ( item.click ) {
                    case 'deleteDataset': {
                        let params = {
                            layers: this.selectedNodes,
                            d
                        };

                        Event.send( 'delete-dataset', params );
                        break;
                    }
                }
            } );

        this.contextMenu
            .style( 'left', `${ d3.event.pageX - 2 }px` )
            .style( 'top', `${ d3.event.pageY - 2 }px` )
            .style( 'display', 'block' );
    }

    /**
     * Select, expand, or collapse an item in the table.
     *
     * @param elem - clicked DOM element
     * @param d - tree node
     */
    click( elem, d ) {
        let { data } = d,
            selected = data.selected || false,
            isOpen   = data.state === 'open';

        if ( data.type === 'dataset' ) {
            if ( d3.event.metaKey ) {
                data.selected = !data.selected;
                this.selectedNodes.push( data );
                this.lastSelectedNode = data.selected ? data.id : null;
            }
            else if ( d3.event.shiftKey && this.lastSelectedNode ) {
                let nodes        = _.drop( this.root.descendants(), 1 ),
                    basePosition = _.findIndex( nodes, node => node.data.id === this.lastSelectedNode ),
                    position     = _.findIndex( nodes, node => node.data.id === data.id ),
                    selectBegin  = Math.min( basePosition, position ),
                    selectEnd    = Math.max( basePosition, position ) + 1,

                    rangeNodes   = _.slice( nodes, selectBegin, selectEnd );

                if ( basePosition !== this.lastBasePosition ) {
                    // user ctrl+clicked on a new location
                    this.lastSelectedRangeNodes = [];
                }
                else {
                    // unselect nodes from previous range that don't match the new range
                    let oldNodes = _.difference( this.lastSelectedRangeNodes, rangeNodes );

                    _.each( oldNodes, node => {
                        node.data.selected = false;
                        _.remove( this.selectedNodes, layer => layer.id === node.data.id );
                    } );
                }

                // select nodes starting from base position to current position
                _.each( rangeNodes, node => {
                    node.data.selected = true;
                    this.selectedNodes.push( node.data );
                    this.lastSelectedRangeNodes.push( node );
                } );

                this.selectedNodes    = _.uniq( this.selectedNodes );
                this.lastBasePosition = basePosition;
            }
            else {
                // Get all currently selected nodes
                let selectedNodes = _.filter( this.root.descendants(), d => d.data.selected );

                // Un-select all other nodes
                _.each( selectedNodes, node => {
                    node.data.selected = false;
                } );

                // If multiple are already selected, keep the target node selected
                if ( selectedNodes.length > 1 && selected ) {
                    data.selected = true;
                } else {
                    data.selected = !selected;
                }

                this.selectedNodes    = [ data ];
                this.lastSelectedNode = data.selected ? data.id : null;
            }
        }

        // Folder
        if ( isOpen ) {
            data.state = 'closed';

            d3.select( elem.parentNode )
                .select( 'i' )
                .classed( 'folder', true )
                .classed( 'open-folder', false );

            if ( d.children ) {
                data._children = d.children;
                d.children     = null;
                data.selected  = false;
            }
        } else {
            data.state = 'open';

            d3.select( elem.parentNode )
                .select( 'i' )
                .classed( 'folder', false )
                .classed( 'open-folder', true );

            d.children     = data._children || null;
            data._children = null;
        }

        this.update( d );
    }
}