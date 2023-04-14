/*******************************************************************************************************
 * File: resolve.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/24/18
 *******************************************************************************************************/

import PublishBookmark from '../modals/publishBookmark';
import EditBookmarkNote from '../modals/editBookmarkNote';
import { selectAll as d3_selectAll } from 'd3-selection';

/**
 * @class Resolve
 */
export default class Resolve {
    /**
     * @param instance - conflicts class
     */
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;

        this.sidebar = Hoot.ui.sidebar;
    }

    /**
     * Resolve current review item
     */
    retainFeature() {
        let reviewItem      = this.data.currentReviewItem,
            currentRelation = this.instance.graphSync.getCurrentRelation();

        if ( reviewItem ) {
            if ( currentRelation ) {
                for ( let i = 0; i < currentRelation.members.length; i++ ) {
                    let key = i + 1;

                    d3_selectAll( `.review-feature${ key }` )
                        .classed( `highlight review-feature${ key }`, false );
                }

                this.instance.graphSync.updateReviewTagsForResolve( currentRelation );
            }

            this.instance.info.tableContainer.remove();

            let hasChanges = Hoot.context.history().hasChanges();

            if ( hasChanges ) {
                Hoot.layers.mergedConflicts = this.data.mergedConflicts;
                Hoot.layers.save( false, () => {
                    this.data.mergedConflicts = [];
                    this.instance.traverse.jumpTo( 'forward' );
                } );
            }
        } else {
            // TODO: alert nothing to review
        }
    }

    /**
     * Save any unsaved items and resolve all remaining reviewables
     *
     * @param layer - review layer
     */
    acceptAll( layer ) {
        let hasChanges = Hoot.context.history().hasChanges();

        if ( hasChanges ) {
            Hoot.layers.save( false, () => {
                Hoot.events.emit( 'review-complete' );
            } );
        } else {
            Hoot.api.resolveAllReviews(layer.id)
                .then ( () => {
                    Hoot.ui.conflicts.deactivate();
                    Hoot.events.emit( 'review-complete' );
                });
        }
    }

    publishBookmark() {
        new PublishBookmark().render();
    }

    displayBookmarkComments( bookmark ) {
        this.bookmark = bookmark;
        let newNote = new EditBookmarkNote( this, 'add' );
        newNote.render();
        newNote.addPastComments();
    }
}
