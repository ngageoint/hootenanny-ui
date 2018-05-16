/*******************************************************************************************************
 * File: conflictTraverse.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import API from '../api';
import LayerManager from '../../managers/layerManager';

export default class ConflictTraverse {
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;

        this.nextId   = 'next';
        this.prevId   = 'previous';
        this.sequence = -999;
    }

    async jumpTo( direction ) {
        let reviewData = {};

        reviewData.mapId     = this.data.mapId;
        reviewData.sequence  = this.sequence;
        reviewData.direction = direction;

        let reviewItem = await API.reviewGetNext( reviewData );

        this.data.currentReviewItem = reviewItem;

        this.instance.graphSync.getRelationMembers( reviewItem.relationId )
            .then( members => this.instance.map.highlightLayer( members[ 0 ], members[ 1 ], true ) );
    }

    traverseForward() {
        this.vischeck();

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