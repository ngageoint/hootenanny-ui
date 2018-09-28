/** ****************************************************************************************************
 * File: reviewBookmarkNotes.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _merge     from 'lodash-es/merge';

import Tab            from '../tab';
import Hoot           from '../../../hoot';

/**
 * Creates the review-bookmark-notes tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class ReviewBookmarkNotes extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Review Bookmark Notes';
        this.id   = 'util-review-bookmark-notes';

        this.notesForm = null;
    }

    render() {
        super.render();

        this.tabHeader.classed( 'hidden', true );

        let backButton = this.panelWrapper
            .append( 'button' )
            .classed( 'bookmark-notes-back-button button primary big flex align-center', true )
            .on( 'click', () => {
                //TODO: go back to review bookmarks panel
            } );

        backButton
            .append( 'span' )
            .classed( 'material-icons', true )
            .text( 'chevron_left' );

        backButton
            .append( 'span' )
            .text( 'Back' );

        return this;
    }

    removeSelf() {
        if ( this.form && !this.form.empty() ) {
            this.form.remove();
        }
    }

    load( bookmark ) {
        this.bookmark = _cloneDeep( bookmark );

        this.removeSelf();

        this.loadBookmarkNotes( bookmark )
            .then( () => {
                this.createHeader();
                this.createBody();
            } );
    }

    async loadBookmarkNotes() {
        try {
            let resp = await Hoot.api.getReviewBookmarks( this.bookmark.id );

            if ( resp && resp.reviewBookmarks && resp.reviewBookmarks.length ) {
                _merge( this.bookmark, resp.reviewBookmarks[ 0 ] );

                this.currentReviewable = this.bookmark.detail.bookmarkreviewitem;

                let params = {
                    mapId : this.currentReviewable.mapId,
                    sequence : this.currentReviewable.sortOrder
                };

                this.reviewItem = await Hoot.api.getReviewItem( params );
            }
        } catch ( err ) {

        }

        this.form = this.panelWrapper
            .append( 'div' )
            .classed( 'notes-form keyline-all fill-white', true );
    }

    createHeader() {
        let header = this.form
            .append( 'div' )
            .classed( 'bookmark-notes-header keyline-bottom flex justify-between align-center', true );

        header
            .append( 'h3' )
            .classed( 'bookmark-notes-title', true )
            .text( this.bookmark.detail.bookmarkdetail.title );

        let icons = header
            .append( 'div' )
            .classed( 'bookmark-notes-actions', true );

        if ( this.reviewItem.resultCount > 0 ) {
            icons
                .append( 'div' )
                .classed( 'material-icons', true )
                .text( 'launch' )
                .on( 'click', () => this.jumpToReviewItem() );
        }

        icons
            .append( 'div' )
            .classed( 'material-icons', true )
            .text( 'refresh' )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

            } );
    }

    createBody() {
        let notesBody = this.form
            .append( 'div' )
            .classed( 'notes-body pad2', true );

        let notes = notesBody
            .selectAll( '.note' )
            .data( this.bookmark.detail.bookmarknotes )
            .enter();
    }

    /**
     * @desc Initiates the jump to review item. Jumping has many dependencies so eventually it ends up in TraverReview
     *   and the value in _forcedReviewableItem gets used to display review item.
     **/
    async jumpToReviewItem() {
        Hoot.ui.navbar.toggleManagePanel();
        Hoot.layers.removeAllLoadedLayers();

        Hoot.ui.conflicts.data.forcedReviewItem = this.currentReviewable;

        let params = {
            name: this.bookmark.layerName,
            id: this.bookmark.mapId
        };

        Hoot.ui.sidebar.forms.reference.submitLayer( params );
    }
}
