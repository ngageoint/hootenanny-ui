/*******************************************************************************************************
 * File: addFolderForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import API                      from '../../../managers/api';
import Event                    from '../../../managers/eventManager';
import FolderManager            from '../../../managers/folderManager';
import FormFactory              from '../../../tools/formFactory';
import { datasetAddFolderForm } from '../../../config/domMetadata';

export default class AddFolderForm {
    constructor() {
        this.form = datasetAddFolderForm.call( this );
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
        this.submitButton    = this.container.select( '#addSubmitBtn' );
    }

    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
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
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !folderName.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    handleSubmit() {
        let name = this.folderNameInput.property( 'value' );

        let params = {
            parentId: 0, // eventually needs to change when path is specified
            folderName: name
        };

        return API.addFolder( params )
            .then( () => FolderManager.refreshAll() )
            .then( () => Event.send( 'render-dataset-table' ) )
            .then( () => this.container.remove() )
            .catch( err => {
                console.log( err );
                // TODO: response - unable to add folder
            } );
    }
}