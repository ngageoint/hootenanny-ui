/*******************************************************************************************************
 * File: publishBookmark.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/13/18
 *******************************************************************************************************/

import FormFactory from '../../tools/formFactory';

export default class PublishBookmark {
    constructor() {
        let currentUser = Hoot.context.storage( 'currentUser' ),
            userEmail;

        if ( Hoot.config.users[ currentUser ] > -1 ) {
            userEmail = Hoot.config.users[ currentUser ].email;
        }

        this.formMeta = {
            title: 'Bookmark Review',
            form: [
                {
                    label: 'Title',
                    id: 'bookmarkTitle',
                    placeholder: '',
                    inputType: 'text',
                    onChange: d => this.validateTextInput( d )
                },
                {
                    label: 'Description',
                    id: 'bookmarkDescription',
                    placeholder: '',
                    inpuType: 'text',
                    onChange: d => this.validateTextInput( d )
                },
                {
                    label: 'Creator Email',
                    id: 'bookmarkCreatorEmail',
                    placeholder: '',
                    inputType: 'text',
                    onChange: d => this.validateTextInput( d ),
                    value: userEmail
                },
                {
                    label: 'Note (Optional)',
                    id: 'bookmarkNote',
                    placeholder: '',
                    inputType: 'textarea'
                }
            ],
            button: {
                text: 'Save',
                id: 'bookmarkSubmitButton',
                onClick: () => this.handleSubmit()
            }
        };
    }

    render() {
        this.container = new FormFactory().generateForm( 'body', 'bookmark-review-form', this.formMeta );

        this.titleInput       = this.container.select( '#bookmarkTitle' );
        this.descriptionInput = this.container.select( '#bookmarkDescription' );
        this.emailInput       = this.container.select( '#bookmarkCreatorEmail' );
        this.noteInput        = this.container.select( '#bookmarkNote' );
        this.submitButton     = this.container.select( '#bookmarkSubmitButton' );
    }

    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( d.id !== 'bookmarkCreatorEmail' ) {
            if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
                valid = false;
            }
        }

        if ( !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.updateButtonState();
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let title       = this.titleInput.property( 'value' ),
            description = this.descriptionInput.property( 'value' ),
            valid       = true;

        this.container.selectAll( '.text-input' )
            .each( function() {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 ) {
                    valid = false;
                }
            } );

        if ( !title.length || !description.length ) {
            valid = false;
        }

        this.submitButton.node().disabled = !valid;
    }

    async handleSubmit() {
        let title = this.titleInput.property( 'value' ),
            desc  = this.descriptionInput.property( 'value' ),
            email = this.emailInput.property( 'value' ),
            note  = this.noteInput.property( 'value' );

        let currentReviewItem = Hoot.ui.conflicts.data.currentReviewItem,
            userInfo;

        if ( !email.length ) {
            let message = 'If you continue this bookmark will be published by as anonymous user. Do you want to continue?',
                confirm = await Hoot.message.confirm( message );

            if ( !confirm ) return;

            userInfo = { id: '-1' };
        } else {
            userInfo = await Hoot.api.getSaveUser( email );
        }

        let params = {
            detail: {
                bookmarkdetail: { title, desc },
                bookmarknotes: [ { userId: userInfo.id, note } ],
                bookmarkreviewitem: currentReviewItem
            },
            mapId: currentReviewItem.mapId,
            relationId: currentReviewItem.relationId,
            userId: userInfo.id
        };

        Hoot.context.storage( 'currentUser', userInfo.id );

        Hoot.api.saveReviewBookmark( params )
            .then( resp => Hoot.message.alert( resp ) )
            .finally( () => this.container.remove() );
    }
}
