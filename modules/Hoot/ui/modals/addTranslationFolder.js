import FormFactory from '../../tools/formFactory';
import { addTranslationFolderForm } from '../../config/domMetadata';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';

export default class AddFolder {
    constructor() {
        this.folderList = Hoot.folders.translationFolderPaths;
        this.form = addTranslationFolderForm.call( this );
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

        this.folderNameInput = this.container.select( '#addTranslationFolderName' );
        this.pathNameInput = this.container.select( '#importPathName' );
        this.folderVisibilityInput = this.container.select( '#addTranslationFolderVisibility' );
        this.submitButton = this.container.select( '#addSubmitBtn' );

        return this;
    }

    validateTextInput() {
        let folderName = this.folderNameInput.node().value,
            reservedWords = [ 'root', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid = true;

        if ( !folderName.length || reservedWords.indexOf( folderName.toLowerCase() ) > -1 || unallowedPattern.test( folderName )) {
            valid = false;
        }

        this.folderNameInput.classed( 'invalid', !valid );
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
        let name = this.folderNameInput.property( 'value' ),
            isPublic = this.folderVisibilityInput.property( 'checked' ),
            folderPath = this.pathNameInput.property( 'value' ),
            pathId = _get( _find( this.folderList, folder => folder.path === folderPath ), 'id' ) || 0;

        let paramData = {
            parentId: pathId,
            folderName: name,
            isPublic: isPublic
        };

        this.processRequest = Hoot.api.createTranslationFolder( paramData )
            .catch( err => {
                console.log( 'unable to create folder' );
            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }
}
