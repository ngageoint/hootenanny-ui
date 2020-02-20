/** ****************************************************************************************************
 * File: editBookmarkNote.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import _find from 'lodash-es/find';

import FormFactory from '../../tools/formFactory';
import _forEach from 'lodash-es/forEach';
import Note from '../managePanel/reviewBookmarks/note';

export default class EditBookmarkNote {
    constructor( instance, type, noteData ) {
        this.instance = instance;
        this.type     = type;
        this.data     = noteData;

        this.usersList = Object.values(Hoot.config.users).map( user => {
            return {
                name: user.display_name,
                id: user.id
            };
        } );

        let label = type === 'edit' ? 'Edit' : 'Add';

        this.formMeta = {
            title: `${label} Comment`,
            form: [
                {
                    id: 'tagUser',
                    containerId: 'tagUserContainer',
                    label: 'Tag Users (Optional)',
                    inputType: 'multiCombobox',
                    data: this.usersList,
                    readonly: true,
                    valueKey: 'name',
                    _valueKey: 'id',
                    placeholder: 'Select user',
                    onChange: d => this.userTagSelect( d )
                },
                {
                    id: 'noteComment',
                    label: 'Comment',
                    inputType: 'textarea',
                    onChange: d => this.validateTextInput( d )
                }
            ],
            button: {
                id: 'noteSubmitBtn',
                text: 'Submit',
                onClick: () => this.handleSubmit()
            }
        };
    }

    render() {
        this.container = new FormFactory().generateForm( 'body', 'editComment', this.formMeta );

        this.commentInput = this.container.select( '#noteComment' );
        this.submitButton = this.container.select( '#noteSubmitBtn' );
        this.taggedUsers  = this.container.select( '#tagUserContainer' );

        if ( this.type === 'edit' ) {
            this.submitButton.property( 'disabled', false );
            this.commentInput.property( 'value', this.data.note );

            // adds the tag box for each user that is tagged to this bookmark note
            let notes = this.instance.bookmark.detail.bookmarknotes;
            let note  = _find( notes, n => n.id === this.data.id );
            if ( note && note.taggedUsers ) {
                note.taggedUsers.forEach( userId => this.populateTags( Hoot.users.getNameForId(userId), userId ) );
            }
        }
    }

    validateTextInput( d ) {
        let target        = d3.select( `#${ d.id }` ),
            node          = target.node(),
            str           = node.value,

            reservedWords = [ 'root', 'dataset', 'folder' ],
            valid         = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 ) {
            valid = false;
        }

        if ( !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.updateButtonState();
    }

    // creates the tag list item to show that a user has been tagged and allows removing them from tags
    populateTags( name, id ) {
        let listItem = this.taggedUsers.select( '.selectedUserTags' ).append( 'li' )
            .classed( 'tagItem', true )
            .attr( 'value' , name)
            .attr( '_value', id);

        listItem.append( 'span' )
            .text( name );

        listItem.append( 'a' )
            .classed( 'remove', true)
            .text( 'x' )
            .on( 'click', function() {
                listItem.remove();
            });
    }

    // Handler for the tag user dropdown
    userTagSelect( data ) {
        let userTaggedContainer = this.taggedUsers.select( '.selectedUserTags' );

        const addUserValue = this.taggedUsers.select( `#${ data.id }` ),
              userName = this.taggedUsers.select( '#tagUser' ).node().value,
              userId = addUserValue.attr('_value');

        // See if the user has already been tagged OR selected for potential tagging
        const isUserSelected = userTaggedContainer.selectAll( 'li' ).filter( function() {
            return d3.select(this).attr( '_value' ) === userId;
        } );

        if ( isUserSelected.size() === 0 ) {
            this.populateTags( userName, userId );
        }

        addUserValue.node().value = '';
    }

    updateButtonState() {
        let comment = this.commentInput.property( 'value' ),
            valid   = true;

        this.container.selectAll( '.text-input' )
            .each( function() {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 ) {
                    valid = false;
                }
            } );

        if ( !comment.length ) {
            valid = false;
        }

        this.submitButton.node().disabled = !valid;
    }

    addPastComments() {
        const commentsContainer = this.container.select( '.hoot-menu form' ).insert( 'div', 'fieldset' );

        this.notesBody = commentsContainer
            .classed( 'notes-fieldset', true );

        _forEach( this.instance.bookmark.detail.bookmarknotes, item => {
            let note = new Note( this, this.notesBody, true );

            note.render( item );
        } );
    }

    // Used to calculate list of unique user id's across all the notes for a particular bookmark
    calcTaggedUsers() {
        const allNotes = this.instance.bookmark.detail.bookmarknotes;
        let allTaggedUserIds = [];

        allNotes.forEach( data => {
            allTaggedUserIds = allTaggedUserIds.concat( data.taggedUsers );
        } );

        return [ ...new Set( allTaggedUserIds ) ];
    }

    async handleSubmit() {
        let comment         = this.commentInput.property( 'value' ),
            currentBookmark = this.instance.bookmark,
            note            = {},
            user            = Hoot.user().id;

        const taggedUserIds = this.taggedUsers.selectAll( '.tagItem' ).nodes().map( data =>
            Number( d3.select(data).attr( '_value' ) )
        );

        if ( this.type === 'edit' ) {
            let notes = currentBookmark.detail.bookmarknotes;
            note  = _find( notes, n => n.id === this.data.id );

            if ( note ) {
                note.note        = comment;
                note.modifiedAt  = new Date().getTime();
                note.modifiedBy  = user;
                note.taggedUsers = taggedUserIds;
            }
        } else {
            note.userId = user;
            note.note   = comment;
            note.taggedUsers = taggedUserIds;

            currentBookmark.detail.bookmarknotes.push( note );
        }

        // get array of all the tagged users for the entire bookmark, across all the comments
        currentBookmark.detail.taggedUsers = this.calcTaggedUsers();

        let params = {
            bookmarkId: currentBookmark.id,
            mapId: currentBookmark.mapId,
            relationId: currentBookmark.relationId,
            userId: user,
            detail: currentBookmark.detail
        };

        return Hoot.api.saveReviewBookmark( params )
            .then( () => {
                if ( this.instance.refresh ) {
                    this.instance.refresh();
                }
            } )
            .finally( () => this.container.remove() );
    }
}
