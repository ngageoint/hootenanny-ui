/*******************************************************************************************************
 * File: conflictTraverse.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import API from '../api';

export default class ConflictTraverse {
    constructor( parent ) {
        this.conflicts = parent;

        this.mapId    = this.conflicts.mapId;
        this.nextId   = 'next';
        this.prevId   = 'previous';
        this.sequence = -999;
    }

    async jumpTo( direction ) {
        let reviewData = {};

        reviewData.mapId     = this.mapId;
        reviewData.sequence  = this.sequence;
        reviewData.direction = direction;

        let nextReview = await API.reviewGetNext( reviewData );

        this.nextReviewHandler( nextReview );
    }

    nextReviewHandler( review ) {
        if ( review.resultCount > 0 ) {
            this.conflicts.metadata.currentReviewItem = review;
            this.conflicts.graphSync.getRelationFeature( review.relationId );
        }
    }
}