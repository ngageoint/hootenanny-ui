/** ****************************************************************************************************
 * File: editBookmarkNote.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import _find from 'lodash-es/find';

import FormFactory from '../../tools/formFactory';

export default class EditBookmarkNote {
    constructor( instance, type, noteData ) {
        this.instance = instance;
        this.type     = type;
        this.data     = noteData;

        let label = type === 'edit' ? 'Edit' : 'Add';

        this.formMeta = {
            title: `${label} Comment`,
            form: [
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

        if ( this.type === 'edit' ) {
            this.submitButton.property( 'disabled', false );
            this.commentInput.property( 'value', this.data.note );
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

    async handleSubmit() {
        let comment         = this.commentInput.property( 'value' ),
            currentBookmark = this.instance.bookmark,
            note            = {},
            user            = Hoot.user().id;

        if ( this.type === 'edit' ) {
            let notes = currentBookmark.detail.bookmarknotes;
            note  = _find( notes, n => n.id === this.data.id );

            if ( note ) {
                note.note       = comment;
                note.modifiedAt = new Date().getTime();
                note.modifiedBy = user;
            }
        } else {
            note.userId = user;
            note.note   = comment;

            currentBookmark.detail.bookmarknotes.push( note );
        }

        let params = {
            bookmarkId: currentBookmark.id,
            mapId: currentBookmark.mapId,
            relationId: currentBookmark.relationId,
            userId: user,
            detail: currentBookmark.detail
        };

        return Hoot.api.saveReviewBookmark( params )
            .then( () => this.instance.refresh() )
            .finally( () => this.container.remove() );
    }
}
