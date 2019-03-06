/*******************************************************************************************************
 * File: traverse.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _filter from 'lodash-es/filter';

/**
 * @class Traverse
 */
export default class Traverse {
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
        let hasChanges = Hoot.context.history().hasChanges(),
            reviewData = {},
            reviewItem = null;

        if ( hasChanges ) {
            let message = 'Please resolve or undo the current feature changes before proceeding to the next review.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return;
        }

        this.data.reviewStats = await Hoot.api.getReviewStatistics( this.data.mapId );

        if ( this.data.forcedReviewItem ) {
            reviewItem = this.data.forcedReviewItem;

            this.data.forcedReviewItem = null;
        } else {
            let sequence = -999;

            if ( this.data.currentReviewItem ) {
                reviewData.mapId     = this.data.currentReviewItem.mapId;
                reviewData.sequence  = this.data.currentReviewItem.sortOrder;
                reviewData.direction = direction;
            } else {
                reviewData.mapId     = this.data.mapId;
                reviewData.sequence  = sequence;
                reviewData.direction = direction;
            }

            reviewItem = await Hoot.api.getNextReview( reviewData );
        }

        if ( reviewItem.resultCount > 0 ) {
            this.data.currentReviewItem = reviewItem;

            this.instance.graphSync.getRelationMembers( reviewItem.relationId )
                .then( members => this.instance.map.highlightLayer( members[ 0 ], members[ 1 ], true ) );
        } else {
            let message = 'There are no more available features to review. Exiting the review session.',
                type    = 'info';

            Hoot.message.alert( { message, type } );

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
        let visible = _filter( Hoot.layers.loadedLayers, layer => layer.visible );

        return visible.length === 1;
    }
}
