/** ****************************************************************************************************
 * File: editBookmarkNote.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import FormFactory from '../../tools/formFactory';
import Hoot        from '../../hoot';

export default class EditBookmarkNote {
    constructor( type, noteData ) {
        this.type = type;
        this.data = noteData;

        let label = type === 'edit' ? 'Edit' : 'Add';

        this.formMeta = {
            title: `${label} Comment`,
            form: [
                {
                    id: 'noteEmail',
                    label: 'Creator Email',
                    inputType: 'text',
                    onChange: d => this.validateTextInput( d )
                },
                {
                    id: 'noteComment',
                    label: 'Comment',
                    inputType: 'textarea'
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

        this.emailInput   = this.container.select( '#noteEmail' );
        this.commentInput = this.container.select( '#noteComment' );
        this.submitButton = this.container.select( '#noteSubmitBtn' );

        if ( this.type === 'edit' ) {
            this.submitButton.property( 'disabled', false );

            this.emailInput.property( 'value', () => {
                let createByEmail = 'anonymous',
                    uid = this.data.modifiedBy ? this.data.modifiedBy : this.data.userId;

                if ( uid && uid > -1 ) {
                    createByEmail = Hoot.config.users[ uid ].email;
                }

                return createByEmail;
            } );

            this.commentInput.property( 'value', this.data.note );
        } else {
            let currentUser = Hoot.context.storage( 'currentUser' ),
                createdByEmail;

            if ( Hoot.config.users[ currentUser ] > -1 ) {
                createdByEmail = Hoot.config.users[ currentUser ].email;
            }

            this.emailInput.property( 'value', createdByEmail );
        }
    }

    validateTextInput() {

    }

    handleSubmit() {

    }
}
