/*******************************************************************************************************
 * File: map.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';

// import { isValidCoords } from '../../tools/utilities';
import { geoExtent } from '../../../geo';
import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

/**
 * @class Map
 */
export default class Map {
    /**
     * @param instance - conflicts class
     */
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;
    }

    /**
     * Highlight and pan to the reviewable items on map. Also update review info to reflect
     * metadata of review process.
     *
     * @param item1 - review item 1
     * @param item2 - review item 2
     * @param panTo - true | false
     */
    highlightLayer( item1, item2, panTo ) {
        // reference of current feature data in review process
        this.data.currentFeatures = [];
        let feature         = null,
            againstFeature  = null,
            relation        = this.instance.graphSync.getCurrentRelation();

        //TODO: check hoot:status, input1 should be against feature by default
        //i.e. we merge into the reference feature by default
        if ( item1 ) {
            feature = Hoot.context.hasEntity( item1.id );
            this.data.currentFeatures.push( feature );
        }
        if ( item2 ) {
            againstFeature = Hoot.context.hasEntity( item2.id );
            this.data.currentFeatures.push( againstFeature );
        }

        this.instance.info.buildTagTable();

        this.unsetHighlight();

        // panning will cause a 'drawn' event to fire and will automatically highlight the nodes
        if ( panTo ) {
            this.panToConflict();
        } else {
            this.setHighlight();
        }

        this.instance.merge.checkMergeButton();

        if ( relation && relation.members && relation.members.length > 2 ) {
            let idx1 = relation.members.findIndex( d => d.id === item1.id ),
                idx2 = relation.members.findIndex( d => d.id === item2.id ),
                len  = relation.members.length;

            d3_select( 'td.feature1 .prev' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'prev' ) ], item2 ) );
            d3_select( 'td.feature1 .next' ).on( 'click', () => this.highlightLayer( relation.members[ this.calcNewIndex( idx1, idx2, len, 'next' ) ], item2 ) );

            d3_select( 'td.feature2 .prev' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'prev' ) ] ) );
            d3_select( 'td.feature2 .next' ).on( 'click', () => this.highlightLayer( item1, relation.members[ this.calcNewIndex( idx2, idx1, len, 'next' ) ] ) );
        }

        this.instance.info.updateMeta();
    }

    /**
     * Remove highlight class from previous nodes
     */
    unsetHighlight() {
        d3_selectAll( '.review-feature1' ).classed( 'highlight review-feature1', false );
        d3_selectAll( '.review-feature2' ).classed( 'highlight review-feature2', false );
    }

    /**
     * Apply highlight class to applicable nodes in view. Use feature data to
     * to get the current review feature IDs and update their class
     */
    setHighlight() {
        _forEach( this.data.currentFeatures, ( feature, key ) => {
            key = key + 1;

            d3_selectAll( '.' + feature.id ).classed( `highlight review-feature${ key }`, true );
        } );
    }

    /**
     * Returns zoom level for given extent, bounded by level 16 and 21;
     * @param {Object} extent extent object that represents feature(s) extents
     */
    static getZoomFromExtent(extent) {
        let zoom = Hoot.context.map().trimmedExtentZoom(extent) - 0.5;
        return zoom < 16 ? 16 :
               zoom > 21 ? 21 : zoom;
    }

    /**
     * Pan map to current conflicts
     */
    panToConflict() {
        let extent = this.data.currentFeatures.reduce(function (extent, feature) {
            return extent.extend(feature.extent(Hoot.context.graph()));
        }, geoExtent());

        Hoot.context.map().centerZoom( extent.center(), Map.getZoomFromExtent(extent) );
    }

    /**
     * Calculate the index of the item to highlight when traversing between
     * a relation's members when clicking next/prev in tag table
     *
     * @param actionIdx - index of member in relation to move from
     * @param staticIdx - index of other highlighted member
     * @param memberLen - number of members in relation
     * @param direction - next | prev
     * @returns {number} - new index
     */
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
