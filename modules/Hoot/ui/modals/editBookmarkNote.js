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
                    id: 'noteUserEmail',
                    label: this.type === 'edit' ? 'Edit As' : 'Creator Email',
                    inputType: 'text',
                    onChange: d => this.validateTextInput( d )
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

        this.emailInput   = this.container.select( '#noteUserEmail' );
        this.commentInput = this.container.select( '#noteComment' );
        this.submitButton = this.container.select( '#noteSubmitBtn' );

        if ( this.type === 'edit' ) {
            this.submitButton.property( 'disabled', false );

            this.emailInput.property( 'value', () => {
                let editAs = 'anonymous',
                    uid    = this.data.modifiedBy ? this.data.modifiedBy : this.data.userId;

                if ( uid && uid > -1 ) {
                    editAs = Hoot.config.users[ uid ].email;
                }

                return editAs;
            } );

            this.commentInput.property( 'value', this.data.note );
        } else {
            let currentUser = Hoot.context.storage( 'currentUser' ),
                createAs;

            if ( Hoot.config.users[ currentUser ] ) {
                createAs = Hoot.config.users[ currentUser ].email;
            }

            this.emailInput.property( 'value', createAs );
        }
    }

    validateTextInput( d ) {
        let target        = d3.select( `#${ d.id }` ),
            node          = target.node(),
            str           = node.value,

            reservedWords = [ 'root', 'dataset', 'dataset', 'folder' ],
            emailRe       = new RegExp( /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ),
            valid         = true;

        if ( d.id === 'noteUserEmail' && !emailRe.test( str ) ) {
            valid = false;
        }

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
        let email           = this.emailInput.property( 'value' ),
            comment         = this.commentInput.property( 'value' ),
            currentBookmark = this.instance.bookmark,
            note            = {},
            userInfo;

        if ( email === 'anonymous' ) {
            let message = 'If you continue this bookmark will be published by as anonymous user. Do you want to continue?',
                confirm = await Hoot.message.confirm( message );

            if ( !confirm ) return;

            userInfo = { id: '-1' };
        } else {
            let resp = await Hoot.api.getSaveUser( email );

            userInfo = resp.user;
        }

        if ( this.type === 'edit' ) {
            let notes = currentBookmark.detail.bookmarknotes,
                note  = _find( notes, n => n.id === this.data.id );

            if ( note ) {
                note.note       = comment;
                note.modifiedAt = new Date().getTime();
                note.modifiedBy = userInfo.id;
            }
        } else {
            note.userId = userInfo.id;
            note.note   = comment;

            currentBookmark.detail.bookmarknotes.push( note );
        }

        let params = {
            bookmarkId: currentBookmark.id,
            mapId: currentBookmark.mapId,
            relationId: currentBookmark.relationId,
            userId: userInfo.userId,
            detail: currentBookmark.detail
        };

        return Hoot.api.saveReviewBookmark( params )
            .then( () => this.instance.refresh() )
            .finally( () => this.container.remove() );
    }
}
