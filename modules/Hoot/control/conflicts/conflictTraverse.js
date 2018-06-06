/*******************************************************************************************************
 * File: conflictTraverse.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _            from 'lodash-es';
import API          from '../api';
import LayerManager from '../../managers/layerManager';

export default class ConflictTraverse {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    async jumpTo( direction ) {
        let reviewData = {},
            hasChanges = this.context.history().hasChanges();

        if ( hasChanges ) {
            // TODO: set processing to false

            alert( 'Please resolve or undo the current feature changes before proceeding to the next review.' );
            return;
        }

        this.data.reviewStats = await API.getReviewStatistics( this.data.mapId );

        this.instance.info.updateMeta();

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

        let reviewItem = await API.reviewGetNext( reviewData );

        if ( reviewItem.resultCount > 0 ) {
            this.data.currentReviewItem = reviewItem;

            this.instance.graphSync.getRelationMembers( reviewItem.relationId )
                .then( members => this.instance.map.highlightLayer( members[ 0 ], members[ 1 ], true ) );
        } else {
            this.instance.deactivate();
        }
    }

    traverseForward() {
        if ( !this.vischeck() ) return;

        this.jumpTo( 'forward' );
    }

    traverseBackward() {
        if ( !this.vischeck() ) return;

        this.jumpTo( 'backward' );
    }

    vischeck() {
        let visible = _.filter( LayerManager.loadedLayers, layer => layer.visible );

        return visible.length === 1;
    }
}