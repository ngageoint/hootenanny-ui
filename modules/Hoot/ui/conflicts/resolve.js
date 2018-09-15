/*******************************************************************************************************
 * File: resolve.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/24/18
 *******************************************************************************************************/

import Hoot            from '../../hoot';
import PublishBookmark from '../modals/publishBookmark';

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

                    d3.selectAll( `.review-feature${ key }` )
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
                this.performAcceptAll( layer );
            } );
        } else {
            this.performAcceptAll( layer );
        }
    }

    /**
     * Resolve all remaining reviewables
     *
     * @param layer - review layer
     */
    performAcceptAll( layer ) {
        let conflateController = this.sidebar.forms.conflate.controller,
            key                = {
                name: layer.name,
                id: layer.id,
                color: layer.color
            };

        // enter controller refresh state
        conflateController.text.html( 'Refreshing &#8230;' );

        // update layer
        Hoot.layers.removeLayer( layer.id );
        Hoot.layers.loadLayer( key );

        // exit controller refresh state
        conflateController.text.html( layer.name );

        Hoot.events.emit( 'review-complete' );
    }

    publishBookmark() {
        new PublishBookmark().render();
    }
}