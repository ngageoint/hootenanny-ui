import _filter  from 'lodash-es/filter';
import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _reject  from 'lodash-es/reject';
import _remove  from 'lodash-es/remove';

import FormFactory        from '../../tools/formFactory';
import {
    saveAdvancedOpts,
}           from '../../config/domMetadata';
import _get from 'lodash-es/get';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class SaveAdvancedOpts {
    constructor(parentId = 0) {
        this.form     = saveAdvancedOpts.call( this );
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
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length || reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
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
        let isPublic = this.folderVisibilityInput.property( 'checked' );

        let params = {
            parentId: this.parentId,
            folderName: name,
            isPublic: isPublic
        };

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
