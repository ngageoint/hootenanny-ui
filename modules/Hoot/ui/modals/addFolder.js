/*******************************************************************************************************
 * File: addFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import FormFactory       from '../../tools/formFactory';
import { addFolderForm } from '../../config/domMetadata';
import {unallowableWordsExist} from '../../tools/utilities';
import { select as d3_select } from 'd3-selection';

export default class AddFolder {
    constructor(parentId = 0) {
        this.form     = addFolderForm.call( this );
        this.parentId = parentId;
    }

    render() {
        let metadata = {
            title: 'Add New Folder',
            form: this.form,
            button: {
                text: 'Add',
                location: 'right',
                id: 'addSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'add-folder-form', metadata );

        this.folderNameInput = this.container.select( '#addFolderName' );
        this.folderVisibilityInput = this.container.select( '#addFolderVisibility' );
        this.submitButton    = this.container.select( '#addSubmitBtn' );

        return this;
    }

    validateTextInput( d ) {
        let target           = d3_select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length || unallowableWordsExist( str ) || unallowedPattern.test( str ) ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let folderName = this.folderNameInput.node().value,
            self       = this;

        this.container.selectAll( '.text-input' )
            .each( function() {
                let classes = d3_select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !folderName.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    handleSubmit() {
        let name = this.folderNameInput.property( 'value' );
        let isPublic = this.folderVisibilityInput.property( 'checked' );

        let params = {
            parentId: this.parentId,
            folderName: name,
            isPublic: isPublic
        };

        //Disable submit so it can't be clicked while processing
        this.submitButton.node().disabled = true;

        this.processRequest = Hoot.api.addFolder( params )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .catch( err => {
                // TODO: alert - unable to add folder
            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }
}
