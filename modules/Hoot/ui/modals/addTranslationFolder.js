import FormFactory from '../../tools/formFactory';
import { addTranslationFolderForm } from '../../config/domMetadata';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';
import { select as d3_select } from 'd3-selection';

export default class AddTranslationFolder {
    constructor( instance ) {
        this.instance = instance;
        this.folderList = Hoot.folders.translationFolders.concat([
            {
                path : '/',
                id : 0,
                name: 'root',
                userId: Hoot.user().id,
                public: true
            }
        ]);
        this.defaultFolder = _find( this.folderList, folder => folder.path === '/' );

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

        const folderPath = this.pathNameInput.property( 'value' ),
            isPublic = _get( _find( this.folderList, folder => folder.path === folderPath ), 'public' );

        if ( !isPublic ) {
            this.folderVisibilityInput.property( 'checked', false );
        }
        this.folderVisibilityInput.property( 'disabled', !isPublic );

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
                let classes = d3_select( this ).attr( 'class' ).split( ' ' );

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

        if ( _find( Hoot.folders.translationFolders, folder =>  folder.parentId === pathId && folder.name === name ) ) {
            let message = 'A folder already exists with this name in the destination path. Please remove the old folder or select a new name for this folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        let paramData = {
            parentId: pathId,
            folderName: name,
            isPublic: isPublic
        };

        this.processRequest = Hoot.api.createTranslationFolder( paramData )
            .then( () => this.instance.loadTranslations() )
            .catch( err => {
                err.message = err.data;
                Hoot.message.alert( err );
            } )
            .finally( () => {
                this.container.remove();
            } );
    }
}
