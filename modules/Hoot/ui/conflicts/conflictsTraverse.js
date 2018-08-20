/*******************************************************************************************************
 * File: conflictsTraverse.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _            from 'lodash-es';
import Hoot         from '../../hoot';

/**
 * @class ConflictsTraverse
 */
export default class ConflictsTraverse {
    /**
     * @param instance - conflicts class
     */
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;
    }

    /**
     * Jumps to next available reviewable relation
     *
     * @param direction - forward | backward
     * @returns {Promise<void>}
     */
    async jumpTo( direction ) {
        let reviewData = {},
            hasChanges = Hoot.context.history().hasChanges();

        if ( hasChanges ) {
            // TODO: set processing to false

            alert( 'Please resolve or undo the current feature changes before proceeding to the next review.' );
            return;
        }

        let reviewStats       = await Hoot.api.getReviewStatistics( this.data.mapId );
        this.data.reviewStats = reviewStats;

        const sequence = -999;

        if ( this.data.currentReviewItem ) {
            reviewData.mapId     = this.data.currentReviewItem.mapId;
            reviewData.sequence  = this.data.currentReviewItem.sortOrder;
            reviewData.direction = direction;
        } else {
            reviewData.mapId     = this.data.mapId;
            reviewData.sequence  = sequence;
            reviewData.direction = direction;
        }

        let reviewItem = await Hoot.api.getNextReview( reviewData );

        if ( reviewItem.resultCount > 0 ) {
            this.data.currentReviewItem = reviewItem;

            this.instance.graphSync.getRelationMembers( reviewItem.relationId )
                .then( members => this.instance.map.highlightLayer( members[ 0 ], members[ 1 ], true ) );
        } else {
            this.instance.map.unsetHighlight();
            this.instance.deactivate();
        }
    }

    /**
     * Go forward
     */
    traverseForward() {
        if ( !this.vischeck() ) return;

        this.jumpTo( 'forward' );
    }

    /**
     * Go backward
     */
    traverseBackward() {
        if ( !this.vischeck() ) return;

        this.jumpTo( 'backward' );
    }

    /**
     * Check to see if there are layers visible on the map
     *
     * @returns {boolean}
     */
    vischeck() {
        let visible = _.filter( Hoot.layers.loadedLayers, layer => layer.visible );

        return visible.length === 1;
    }
}