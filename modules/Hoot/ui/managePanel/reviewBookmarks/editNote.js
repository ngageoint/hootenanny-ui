/** ****************************************************************************************************
 * File: editNote.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import FormFactory from '../../../tools/formFactory';

export default class EditNote {
    constructor( type ) {
        let label = type === 'edit' ? 'Edit' : 'Add';

        this.type = type;

        this.formMeta = {
            title: `${label} Comment`,
            form: [
                {
                    id: 'creatorEmail',
                    label: 'Creator Email',
                    inputType: 'text',
                    onChange: d => this.validateTextInput( d )
                },
                {
                    id: 'comment',
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
        this.container    = new FormFactory().generateForm( 'body', 'editComment', this.formMeta );
        this.submitButton = this.container.select( '#noteSubmitBtn' );

        if ( this.type === 'edit' ) {
            this.submitButton.property( 'disabled', false );
        }
    }

    validateTextInput() {

    }

    handleSubmit() {

    }
}
