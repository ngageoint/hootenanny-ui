/** ****************************************************************************************************
 * File: reviewBookmarkNotes.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _forEach   from 'lodash-es/forEach';
import _merge     from 'lodash-es/merge';

import Tab              from '../tab';
import Note             from './note';
import EditBookmarkNote from '../../modals/editBookmarkNote';

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
        this.id   = 'review-bookmark-notes';
    }

    render() {
        super.render();

        this.tabHeader.classed( 'hidden', true );

        let backButton = this.panelWrapper
            .append( 'button' )
            .classed( 'notes-back-button button primary big flex align-center', true )
            .on( 'click', () => Hoot.ui.managePanel.reviewBookmarks.toggle() );

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

        this.form = this.panelWrapper
            .append( 'div' )
            .classed( 'notes-form keyline-all fill-white', true );

        this.loadBookmarkNotes()
            .then( () => {
                this.createHeader();
                this.createNotes();
            } );
    }

    async loadBookmarkNotes() {
        try {
            const queryParam = {
                bookmarkId: this.bookmark.id
            };
            let resp = await Hoot.api.getBookmarkById( queryParam );

            if ( resp && resp.reviewBookmarks && resp.reviewBookmarks.length ) {
                _merge( this.bookmark, resp.reviewBookmarks[ 0 ] );

                this.currentReviewable = this.bookmark.detail.bookmarkreviewitem;

                let params = {
                    mapId: this.currentReviewable.mapId,
                    sequence: this.currentReviewable.sortOrder
                };

                this.reviewItem = await Hoot.api.getReviewItem( params );
            }
        } catch ( err ) {
            // TODO: show error
            throw new Error( err );
        }
    }

    createHeader() {
        let header = this.form
            .append( 'div' )
            .classed( 'form-header notes-header keyline-bottom flex', true );

        header
            .append( 'h3' )
            .classed( 'note-title', true )
            .text( this.bookmark.detail.bookmarkdetail.title );

        let icons = header
            .append( 'div' )
            .classed( 'notes-actions', true );

        if ( this.reviewItem.resultCount > 0 ) {
            icons.append( 'div' )
                .classed( 'material-icons pointer', true )
                .attr('title', 'Go to review item')
                .text( 'launch' )
                .on( 'click', () => this.jumpToReviewItem() );
        }

        icons.append( 'div' )
            .classed( 'material-icons pointer', true )
            .attr('title', 'Refresh')
            .text( 'refresh' )
            .on( 'click', () => this.refresh() );
    }

    createNotes() {
        this.notesBody = this.form
            .append( 'div' )
            .classed( 'notes-fieldset', true );

        this.notesBody
            .append( 'button' )
            .classed( 'add-note-button round _icon plus big', true )
            .on( 'click', () => {
                let newNote = new EditBookmarkNote( this, 'add' );

                newNote.render();
            } );

        _forEach( this.bookmark.detail.bookmarknotes, item => {
            let note = new Note( this, this.notesBody );

            note.render( item );
        } );
    }

    /**
     * @desc Initiates the jump to review item. Jumping has many dependencies so eventually it ends up in TraverReview
     *   and the value in _forcedReviewableItem gets used to display review item.
     **/
    async jumpToReviewItem() {
        let params = {
            name: this.bookmark.layerName,
            id: this.bookmark.mapId
        };

        if ( Hoot.layers.loadedLayers[ params.id ] ) {
            Hoot.ui.navbar.toggleManagePanel();
            Hoot.ui.conflicts.data.forcedReviewItem = this.currentReviewable;

            Hoot.ui.conflicts.graphSync.getRelationMembers( this.currentReviewable.relationId )
                .then( members => Hoot.ui.conflicts.map.highlightLayer( members[ 0 ], members[ 1 ], true ) );
        } else {
            Hoot.layers.removeAllLoadedLayers();
            Hoot.ui.navbar.toggleManagePanel();
            Hoot.ui.conflicts.data.forcedReviewItem = this.currentReviewable;

            Hoot.ui.sidebar.forms.reference.submitLayer( params );
        }
    }

    refresh() {
        this.load( this.bookmark );
    }

}
