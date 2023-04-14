/*******************************************************************************************************
 * File: publishBookmark.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/13/18
 *******************************************************************************************************/

import FormFactory from '../../tools/formFactory';
import EditBookmarkNote from './editBookmarkNote';
import { unallowableWordsExist } from '../../tools/utilities';
import { select as d3_select } from 'd3-selection';

export default class PublishBookmark {
    constructor() {
        this.usersList = Hoot.getUserIdObjectsList();

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
                    id: 'tagUser',
                    containerId: 'tagUserContainer',
                    label: 'Tag Users',
                    inputType: 'multiCombobox',
                    data: this.usersList,
                    readonly: true,
                    valueKey: 'name',
                    _valueKey: 'id',
                    placeholder: 'Select user',
                    onChange: d => EditBookmarkNote.userTagSelect( this.taggedUsers, d )
                },
                {
                    label: 'Comment',
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
        this.taggedUsers      = this.container.select( '#tagUserContainer' );
        this.noteInput        = this.container.select( '#bookmarkNote' );
        this.submitButton     = this.container.select( '#bookmarkSubmitButton' );
    }

    validateTextInput( d ) {
        let target           = d3_select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( d.id !== 'bookmarkCreatorEmail' ) {
            if ( unallowableWordsExist( str ) || unallowedPattern.test( str ) ) {
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
                let classes = d3_select( this ).attr( 'class' ).split( ' ' );

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
            note  = this.noteInput.property( 'value' );

        let currentReviewItem = Hoot.ui.conflicts.data.currentReviewItem;
        let user = Hoot.user().id;
        const taggedUserIds = this.taggedUsers.selectAll( '.tagItem' ).nodes().map( data =>
            Number( d3_select(data).attr( '_value' ) )
        );

        let params = {
            detail: {
                bookmarkdetail: { title, desc },
                bookmarknotes: [ { userId: user, note, taggedUsers: taggedUserIds } ],
                bookmarkreviewitem: currentReviewItem,
                taggedUsers: taggedUserIds
            },
            mapId: currentReviewItem.mapId,
            relationId: currentReviewItem.relationId,
            userId: user
        };

        Hoot.api.saveReviewBookmark( params )
            .then( resp => Hoot.message.alert( resp ) )
            .finally( () => this.container.remove() );
    }
}
