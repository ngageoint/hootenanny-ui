import { translationViewForm } from '../../config/domMetadata';
import FormFactory             from '../../tools/formFactory';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';
import { select as d3_select } from 'd3-selection';

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
                text: 'Save',
                    id: 'editTranslationBtn',
                    onClick: () => this.handleSubmit()
            };
        }

        this.container = new FormFactory().generateForm( 'body', 'translations-add-form', metadata );

        this.translationName  = d3_select( '#translationName' );
        this.descriptionInput = d3_select( '#translationSaveDescription' );
        this.pathNameInput    = d3_select( '#importPathName' );
        this.templateInput    = d3_select( '#translationTemplate' );
        this.submitButton     = d3_select( '#editTranslationBtn' );

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
            this.submitButton.attr( 'disabled', 'true' );

        }
    }

    handleFileDrop() {

    }

    validateFields() {
        let name        = this.translationName.property( 'value' ),
            description = this.descriptionInput.property( 'value' ),
            template    = this.templateInput.property( 'value' );

        this.translationName.classed( 'invalid', !name.length );
        this.descriptionInput.classed( 'invalid', !description.length );
        this.templateInput.classed( 'invalid', !template.length );

        let formValid = name.length && description.length && template.length;

        this.submitButton.attr('disabled', formValid ? null : true);
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
