/*******************************************************************************************************
 * File: conflictMap.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _                 from 'lodash-es';
import { isValidCoords } from '../utilities';

export default class ConflictMap {
    constructor( instance ) {
        this.conflicts = instance;
        this.context   = instance.context;
        this.data      = instance.data;
    }

    highlightLayer( item1, item2, panTo ) {
        let feature        = this.context.hasEntity( item1.id ),
            againstFeature = this.context.hasEntity( item2.id ),
            features       = [ feature, againstFeature ],
            relation       = this.data.currentRelation,
            poiTableCols   = [],
            panToId        = null,
            extent         = null;

        _.forEach( features, ( feature, key ) => {
            key = key + 1;
            extent = feature.extent( this.context.graph() );

            if ( !panToId && isValidCoords( extent[ 0 ] ) && isValidCoords( extent[ 1 ] ) ) {
                panToId = feature.id;
            }

            poiTableCols.push( feature );

            if ( panTo && panToId ) {
                this.context.map().centerZoom( extent.center(), this.context.map().trimmedExtentZoom( extent ) - 0.5 );
            }

            d3.selectAll( `.review-feature${ key }` )
                .classed( `highlight review-feature${ key }`, false );
            d3.selectAll( '.' + feature.id )
                .classed( `highlight review-feature${ key }`, true );
        } );

        this.conflicts.info.buildPoiTable( poiTableCols );

        if ( relation.tags[ 'hoot:review:type' ] === 'POI to Polygon' ||
            feature.id.charAt( 0 ) === 'n' && againstFeature.id.charAt( 0 ) === 'n'
        ) {
            this.conflicts.container.select( 'button.merge' ).classed( 'hidden', false );
        } else {
            this.conflicts.container.select( 'button.merge' ).classed( 'hidden', true );
        }

        if ( relation && relation.members && relation.members.length > 2 ) {
            let idx1 = relation.members.findIndex( d => d.id === item1.id ),
                idx2 = relation.members.findIndex( d => d.id === item2.id ),
                len  = relation.members.length;

            d3.select( 'td.feature1 .prev' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'prev' ) ], item2 ) );
            d3.select( 'td.feature1 .next' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'next' ) ], item2 ) );

            d3.select( 'td.feature2 .prev' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'prev' ) ] ) );
            d3.select( 'td.feature2 .next' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'next' ) ] ) );
        }

        this.conflicts.info.updateMeta();

        // TODO: update meta
    }

    calcNewIndex( actionIdx, staticIdx, memberLen, direction ) {
        let newIdx = direction === 'next' ? actionIdx + 1 : actionIdx - 1;

        if ( newIdx < 0 ) {
            newIdx = memberLen - 1;
        }

        if ( newIdx > memberLen - 1 ) {
            newIdx = 0;
        }

        if ( newIdx === staticIdx ) {
            return this.calcNewIndex( newIdx, staticIdx, memberLen, direction );
        }

        return newIdx;
    }
}