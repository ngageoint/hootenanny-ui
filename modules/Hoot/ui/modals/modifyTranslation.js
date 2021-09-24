import { translationViewForm } from '../../config/domMetadata';
import FormFactory             from '../../tools/formFactory';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';

export default class ModifyTranslation {
    constructor( instance, translation, templateText ) {
        this.instance = instance;

        this.translation  = translation;
        this.templateText = templateText;
        this.folderList = Hoot.folders.translationFolders;
        this.form = translationViewForm.call( this );
    }

    render() {
        let metadata = {
            title: this.translation.name,
            form: this.form
        };

        if ( !this.translation.default ) {
            metadata.button = {
                text: 'Save Edits',
                    id: 'editTranslationBtn',
                    onClick: () => this.handleSubmit()
            };
        }

        this.container = new FormFactory().generateForm( 'body', 'translations-add-form', metadata );

        this.translationName  = d3.select( '#translationName' );
        this.descriptionInput = d3.select( '#translationSaveDescription' );
        this.pathNameInput    = d3.select( '#importPathName' );
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#editTranslationBtn' );

        this.translationName.property( 'value', this.translation.name );
        this.descriptionInput.property( 'value', this.translation.description );
        const path = _get( _find( this.folderList, folder => folder.id === this.translation.folderId ), 'path' );
        this.pathNameInput.property( 'value', path );


        if ( this.translation.default ) {
            this.translationName.attr( 'disabled', 'true' );
            this.descriptionInput.attr( 'disabled', 'true' );
            this.pathNameInput.attr( 'disabled', 'true' );
            this.templateInput.attr( 'disabled', 'true' );
        } else {
            this.pathNameInput.attr( 'readonly', 'true' );
            this.submitButton.node().disabled = false;
        }
    }

    handleFileDrop() {

    }

    validateFields() {
        let name        = this.translationName.property( 'value' ),
            description = this.descriptionInput.property( 'value' ),
            pathName    = this.pathNameInput.property( 'value' ),
            template    = this.templateInput.property( 'value' );

        if ( !this.translationName.property( 'value' ).length ) {
            this.translationName.classed( 'invalid', true );
        } else {
            this.translationName.classed( 'invalid', false );
        }

        if ( !this.descriptionInput.property( 'value' ).length ) {
            this.descriptionInput.classed( 'invalid', true );
        } else {
            this.descriptionInput.classed( 'invalid', false );
        }

        if ( !this.pathNameInput.property( 'value' ).length ) {
            this.pathNameInput.classed( 'invalid', true );
        } else {
            this.pathNameInput.classed( 'invalid', false );
        }

        if ( !this.templateInput.property( 'value' ).length ) {
            this.templateInput.classed( 'invalid', true );
        } else {
            this.templateInput.classed( 'invalid', false );
        }

        let formValid = name.length && description.length && pathName.length && template.length;

        this.submitButton.node().disabled = !formValid;
    }

    handleSubmit() {
        let name            = this.translationName.property( 'value' ),
            pathName        = this.pathNameInput.property( 'value' ),
            targetFolder    = _get( _find( this.folderList, folder => folder.path === pathName ), 'id' ) || 0;

        const translationExists = _find( Hoot.folders.translations, translation =>  translation.folderId === targetFolder && translation.name === name ),
            description     = this.descriptionInput.property( 'value' ),
            templateInput   = this.templateInput.property( 'value' ),
            currentTranslationName = this.translation.name,
            currentTranslationPath =_get( _find( this.folderList, folder => folder.id === this.translation.folderId ), 'path' );

        if ( currentTranslationName === name && this.translation.description === description &&
            currentTranslationPath === pathName && this.templateText === templateInput ) {
            let message = 'No modifications made to the translation.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        } else if ( translationExists && this.translation.description === description && this.templateText === templateInput ) {
            let message = 'A translation already exists with this name in the destination folder. Please remove the old translation and try again.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        const paramData = {
            name: this.translationName.property( 'value' ),
            description: this.descriptionInput.property( 'value' ),
            translationId: this.translation.id,
            folderId : targetFolder
        };

        Hoot.api.modifyTranslation( templateInput, paramData )
            .then( () => this.instance.loadTranslations() )
            .finally( () => {
                this.container.remove();
            } );
    }

}
