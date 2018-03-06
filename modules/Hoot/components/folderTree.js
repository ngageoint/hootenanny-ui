/** ****************************************************************************************************
 * File: folderTree.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/5/18
 *******************************************************************************************************/

import FolderManager from '../model/FolderManager';
import _ from 'lodash-es';

export default function FolderTree() {
    const self = this;

    this.selectedLayerIDs = [];

    this.margin    = { top: 10, right: 20, bottom: 30, left: 0 };
    this.width     = '100%';
    this.height    = '100%';
    this.barHeight = 20;

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

    this.init = container => {
        this.container = container;

        this._svg = container.selectAll( 'svg' );

        if ( !this._svg.empty() ) {
            this._svg.selectAll( 'g' ).remove();
            this.svg = this._svg.append( 'g' )
                .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
        } else {
            this.svg = container.append( 'svg' )
                .attr( 'width', this.width )// + margin.left + margin.right)
                .attr( 'height', this.height )// + margin.left + margin.right)
                .append( 'g' )
                .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
        }

        let folders = FolderManager.getAvailFoldersWithLayers();

        if ( this.container.attr( 'id' ) === 'datasettable' ) {
            folders = _.without( folders, _.find( folders, { id: -1 } ) );
        }

        folders = {
            name: 'Datasets',
            id: 'Datasets',
            children: folders
        };

        folders.x = 0;
        folders.y = 0;

        this.update( d3.hierarchy( folders ) );
    };

    this.update = root => {
        let nodes  = this.tree( root ).descendants(),
            height = Math.max( 150, nodes.length * this.barHeight + this.margin.top + this.margin.bottom );

        this.container.select( 'svg' ).transition()
            .duration( 0 )
            .style( 'height', `${height}px` );

        _.forEach( nodes, ( node, i ) => node.x = ( i - i ) * this.barHeight );

        let node = this.svg.selectAll( 'g.node' )
            .data( nodes, function( d ) {
                //if ( d.type ) {
                //    return d.type.charAt( 0 ) + d.id || d.id || (d.id = ++i);
                //}
                //else {
                //    return d.id || (d.id = ++i);
                //}
            } );

        let nodeEnter = node.enter().append( 'g' )
            .attr( 'class', 'node' )
            .attr( 'transform', `translate( 0, ${ root.x } )` );

        nodeEnter.append( 'rect' )
            .attr( 'y', this.barHeight / 2 )
            .attr( 'height', this.barHeight )
            .attr( 'width', '100%' )
            .style( 'fill', this.fillColor )
            .attr( 'class', this.rectClass )
            //.on( 'click', click );
    };

    this.fillColor = d => {
        if ( d.type === 'folder' ) {
            return '#7092ff';
        }
        else if ( d.type === 'dataset' ) {
            return '#efefef';
        }
        else {
            return '#ffffff';
        }
    };

    this.fontColor = d => {
        if ( d.type === 'folder' ) {
            return '#ffffff';
        }
        else if ( d.type === 'dataset' ) {
            return '#7092ff';
        }
        else {
            return '#ffffff';
        }
    };

    this.rectClass = d => {
        //set selected layers
        if ( d.type === 'dataset' && container.attr( 'id' ) === 'datasettable' ) {
            let lyrid = d.id;
            if ( d.selected ) {
                if ( self.selectedLayerIDs.indexOf( lyrid ) === -1 ) {
                    self.selectedLayerIDs.push( lyrid );
                }
            } else {
                let idx = this.selectedLayerIDs.indexOf( lyrid );
                if ( idx > -1 ) {
                    self.selectedLayerIDs.splice( idx, 1 );
                }
            }
        }

        return d.selected ? 'sel' : d._children ? 'more' : 'flat';
    };

    return this;
}