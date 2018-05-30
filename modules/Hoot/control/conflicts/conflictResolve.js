/*******************************************************************************************************
 * File: conflictResolve.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/24/18
 *******************************************************************************************************/

import _       from 'lodash-es';
import HootOSM from '../../managers/hootOsm';

export default class ConflictResolve {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    retainFeature() {
        let reviewItem = this.data.currentReviewItem,
            reviewRel  = this.data.currentRelation;

        if ( reviewItem ) {
            if ( reviewRel ) {
                for ( let i = 0; i < reviewRel.members.length; i++ ) {
                    let key = i + 1;

                    d3.selectAll( `.review-feature${ key }` )
                        .classed( `highlight review-feature${ key }`, false );
                }

                this.instance.graphSync.updateReviewTagsForResolve( reviewRel );
            }

            this.instance.info.tableContainer.remove();

            let hasChanges = this.context.history().hasChanges();

            if ( hasChanges ) {
                HootOSM.save( this.data.mergedItems, false, () => {
                    this.instance.traverse.jumpTo( 'forward' );
                } );
            }
        } else {
            // TODO: alert nothing to review
        }
    }

    acceptAll() {

    }
}