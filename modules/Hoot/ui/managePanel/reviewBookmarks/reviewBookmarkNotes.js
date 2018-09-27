/** ****************************************************************************************************
 * File: reviewBookmarkNotes.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _merge     from 'lodash-es/merge';

import Tab            from '../tab';
import Hoot           from '../../../hoot';
import { svgIcon }    from '../../../../svg';
import AddTranslation from '../../modals/addTranslation';

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

    load( d ) {
        this.bookmark = _cloneDeep( d );

        this.removeSelf();

        this.loadBookmarkNotes( d )
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

                let currentReviewable = this.bookmark.detail.bookmarkreviewitem;

                let params = {
                    mapId : currentReviewable.mapId,
                    sequence : currentReviewable.sortOrder
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

    jumpToReviewItem() {
        Hoot.ui.navbar.toggleManagePanel();
        Hoot.layers.removeAllLoadedLayers();
    }
}
