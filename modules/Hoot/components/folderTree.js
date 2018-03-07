/** ****************************************************************************************************
 * File: folderTree.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/5/18
 *******************************************************************************************************/

import FolderManager from '../model/FolderManager';
import _ from 'lodash-es';
import moment from 'moment';

export default function FolderTree() {
    const self = this;
    let i      = 0;

    this.selectedLayerIDs = [];

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

    this.zoom = d3.zoom()
        .scaleExtent( [ 1, 2 ] );

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

    let root;

    this.init = container => {
        this.container = container;
        this.isDatasetTable = this.container.attr( 'id' ) === 'dataset-table';

        this._svg = container.selectAll( 'svg' );

        if ( !this._svg.empty() ) {
            this._svg.selectAll( 'g' ).remove();
            this.svg = this._svg.append( 'g' )
                .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
        } else {
            this.svg = container.append( 'svg' )
                .attr( 'width', this.width )
                .attr( 'height', this.height )
                .append( 'g' )
                .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
        }

        let folders = FolderManager.getAvailFoldersWithLayers();

        if ( this.isDatasetTable ) {
            folders = _.without( folders, _.find( folders, { id: -1 } ) );
        }

        folders = {
            name: 'Datasets',
            id: 'Datasets',
            children: folders
        };

        root    = d3.hierarchy( folders );
        root.x0 = 0;
        root.y0 = 0;

        this.update( root );
    };

    this.update = source => {
        let nodes       = this.tree( root ),
            links       = nodes.links(),
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
                n.data  = n;
                n.depth = parentDepth + 1;
            }

            nodesSort.push( n );
        } );

        // Set vertical position of node
        nodesSort.forEach( ( n, i ) => {
            n.x = ( i - 1 ) * this.barHeight;
            n.y = n.depth * 20;
        } );

        let node = this.svg.selectAll( 'g.node' )
            .data( nodesSort, d => d );

        let nodeElement = node.enter().append( 'g' )
            .attr( 'class', 'node' )
            .attr( 'transform', `translate( 0, ${ source.x0 } )` )
            .style( 'opacity', 0 )
            .on( 'click', function( d ) {
                self.click.call( this, d );
            } );

        nodeElement.append( 'rect' )
            .attr( 'y', -this.barHeight / 2 )
            .attr( 'height', this.barHeight )
            .attr( 'width', '100%' )
            .style( 'fill', this.fillColor )
            .attr( 'class', this.rectClass );

        nodeElement.append( 'g' )
            .append( 'svg:foreignObject' )
            .attr( 'width', 20 )
            .attr( 'height', 20 )
            .attr( 'transform', d => {
                let dd = d.depth - 1,
                    dy = 5.5 + ( 11 * dd );

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

        nodeElement.append( 'text' )
            .style( 'fill', this.fontColor )
            .classed( 'dnameTxt', true )
            .attr( 'dy', 3.5 )
            .attr( 'dx', d => {
                let dd = d.depth - 1;
                return 25.5 + ( 11 * dd );
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

        let nodeDataset = nodeElement.filter( d => d.data.type === 'dataset' );

        nodeDataset.append( 'text' )
            .classed( 'dsizeTxt', true )
            .style( 'fill', this.fontColor )
            .attr( 'dy', 3.5 )
            .attr( 'dx', '98%' )
            .attr( 'text-anchor', 'end' )
            .text( d => {
                let size = d.size,
                    units = [ 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ],
                    u     = -1;

                if ( Math.abs( size ) < 1000 )
                    return size + ' B';

                do {
                    size /= 1000;
                    ++u;
                } while ( Math.abs( size ) >= 1000 && u < units.length - 1 );

                return size.toFixed( 1 ) + ' ' + units[ u ];
            } );

        if ( this.isDatasetTable ) {
            nodeDataset.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '80%' )
                .attr( 'text-anchor', 'end' )
                .text( d => d.date );

            nodeDataset.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '45%' )
                .attr( 'text-anchor', 'end' )
                .text( d => {
                    let lastAccessed = d.lastAccessed,
                        timeAgo = lastAccessed.replace( /[-:]/g, '' ),
                        dateActive = moment( timeAgo ).fromNow(),
                        oldDate = moment().diff( moment( timeAgo ), 'days' ) > 60;

                    if ( oldDate ) {

                    }

                    return dateActive;
                } );
        }

        let nodeDepth = nodeElement.filter( d => d.depth > 1 );

        nodeDepth.append( 'line' )
            .attr( 'x1', d => 2.5 + ( 11 * ( d.depth - 1 ) ) )
            .attr( 'x2', d => 9.5 + ( 11 * ( d.depth - 1 ) ) )
            .attr( 'y1', 0 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );

        nodeDepth.append( 'line' )
            .attr( 'x1', d => 2.5 + ( 11 * ( d.depth - 1 ) ) )
            .attr( 'x2', d => 2.5 + ( 11 * ( d.depth - 1 ) ) )
            .attr( 'y1', -20 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );

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

        node.exit()
            .transition()
            .duration( this.duration )
            .attr( 'transform', `translate( 0, ${ source.x } )` )
            .style( 'opacity', 0 )
            .remove(); // remove old elements

        let link = this.svg.selectAll( 'path.link' )
            .data( links, d => d.target.id );

        link.enter().insert( 'path', 'g' )
            .attr( 'class', 'link' )
            .attr( 'd', () => {
                let o = { x: source.x0, y: source.y0 };
                return this.diagonal( { source: o, target: o } );
            } )
            .transition()
            .duration( this.duration )
            .attr( 'd', this.diagonal );

        link.transition()
            .duration( this.duration )
            .attr( 'd', this.diagonal );

        link.exit().remove();

        root.each( d => {
            d.x0 = d.x;
            d.y0 = d.y;
        } );

    };

    this.click = function( d ) {
        let selected          = d.data.selected,
            updateOpenFolders = self.containerId === 'dataset-table';

        if ( d.data.type === 'folder' ) {

        }

        if ( d.data.type === 'dataset' ) {
            d3.select( this ).classed( 'selected', selected );
        }

        //if ( d.data.state === 'closed' ) {
        //    d.data.state = 'open';
        //
        //    d3.select( this.parentNode )
        //        .select( 'i' )
        //        .classed( 'folder', false )
        //        .classed( 'open-folder', true );
        //
        //    d.data.children  = d.data._children || null;
        //    d.data._children = null;
        //
        //    if ( updateOpenFolders ) {
        //        FolderManager.setOpenFolders( d.data.id, true );
        //    }
        //} else {
        //    d.data.state = 'closed';
        //
        //    d3.select( this.parentNode )
        //        .select( 'i' )
        //        .classed( 'folder', true )
        //        .classed( 'open-folder', false );
        //
        //    if ( d.data.children || typeof d.data.children === 'object' ) {
        //        d.data._children = d.data.children;
        //        d.data.children  = null;
        //        d.data.selected  = false;
        //    }
        //}

        if ( d.data.type === 'folder' ) {
            if ( d.children ) {
                // Close folder
                d.data._children = d.children;
                d.children       = null;
                d.data.selected  = false;
                d.data.state     = 'closed';
                d3.select( this.parentNode )
                    .select( 'i' )
                    .classed( 'folder', true )
                    .classed( 'open-folder', false );

                if ( updateOpenFolders ) {
                    FolderManager.setOpenFolders( d.data.id, false );
                }
            } else if ( !d.children && !d.data._children ) {
                // Toggle an empty folder
                if ( d.data.state === 'open' ) {
                    d.data.state = 'closed';
                    d3.select( this.parentNode )
                        .select( 'i' )
                        .classed( 'folder', true )
                        .classed( 'open-folder', false );
                } else {
                    d.data.state = 'open';
                    d3.select( this.parentNode )
                        .select( 'i' )
                        .classed( 'folder', false )
                        .classed( 'open-folder', true );
                }
            } else {
                // Open folder
                d.children       = d.data._children;
                d.data._children = null;
                d.data.state     = 'open';

                d3.select( this.parentNode )
                    .select( 'i' )
                    .classed( 'folder', false )
                    .classed( 'open-folder', true );

                if ( updateOpenFolders ) {
                    FolderManager.setOpenFolders( d.data.id, true );
                }
            }
        }

        self.update( d );
    };

    this.fillColor = d => {
        let { data } = d;

        if ( data.type === 'folder' ) {
            return '#7092ff';
        }
        else if ( data.type === 'dataset' ) {
            return '#efefef';
        }
        else {
            return '#ffffff';
        }
    };

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

    return this;
}