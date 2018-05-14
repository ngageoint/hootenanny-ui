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

    highlightLayer( item1, item2 ) {
        let feature        = this.context.hasEntity( item1.id ),
            againstFeature = this.context.hasEntity( item2.id ),
            features       = [ feature, againstFeature ],
            relation       = this.data.currentRelation,
            poiTableCols   = [],
            panToId;

        _.forEach( features, ( feature, key ) => {
            let extent = feature.extent( this.context.graph() ),
                k      = key + 1;

            if ( !panToId && isValidCoords( extent[ 0 ] ) && isValidCoords( extent[ 1 ] ) ) {
                panToId = feature.id;
            }

            poiTableCols.push( feature );

            d3.selectAll( `.activeReviewFeature${ k }` )
                .classed( `activeReviewFeature${ k }`, false );
            d3.selectAll( '.' + feature.id )
                .classed( `tag-hoot activeReviewFeature${ k }`, true );
        } );

        this.conflicts.info.buildPoiTable( poiTableCols );

        if ( relation && relation.members && relation.members.length > 2 ) {
            let idx1 = relation.members.findIndex( d => d.id === item1.id ),
                idx2 = relation.members.findIndex( d => d.id === item2.id ),
                len = relation.members.length;

            d3.select( 'td.feature1 .prev' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'prev' ) ], item2 ) );
            d3.select( 'td.feature1 .next' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'next' ) ], item2 ) );

            d3.select( 'td.feature2 .prev' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'prev' ) ] ) );
            d3.select( 'td.feature2 .next' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'next' ) ] ) );
        }
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

    //calculatePrevious( actionIdx, staticIdx, memberLen ) {
    //    let prev = actionIdx - 1;
    //
    //    if ( prev < 0 ) {
    //        prev = memberLen - 1;
    //    }
    //
    //    if ( prev === staticIdx ) {
    //        return this.calculatePrevious( prev, staticIdx, memberLen );
    //    }
    //
    //    return prev;
    //}
    //
    //calculateNext( actionIdx, staticIdx, memberLen ) {
    //    let next = actionIdx + 1;
    //
    //    if ( next > memberLen - 1 ) {
    //        next = 0;
    //    }
    //
    //    //if ( next === staticIdx)
    //}
}