/*******************************************************************************************************
 * File: addTranslation.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 6/28/18
 *******************************************************************************************************/

import FormFactory            from '../../tools/formFactory';
import { translationAddForm } from '../../config/domMetadata';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';
import { select as d3_select } from 'd3-selection';

export default class AddTranslation {
    constructor( instance, templateText ) {
        this.instance = instance;
        this.templateText = templateText;
        this.folderList = Hoot.folders.translationFolders;
        this.form = translationAddForm.call( this );
    }

    render() {
        let metadata = {
            title: 'Add Translation',
            form: this.form,
            button: {
                text: 'Save',
                id: 'addTranslationBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'translations-add-form', metadata );

        this.nameInput        = d3_select( '#translationSaveName' );
        this.descriptionInput = d3_select( '#translationSaveDescription' );
        this.pathNameInput    = d3_select( '#importPathName' );
        this.templateInput    = d3_select( '#translationTemplate' );
        this.submitButton     = d3_select( '#addTranslationBtn' );
        this.mappingForm      = d3_select( '.ta-attribute-mapping' );

        this.pathNameInput.attr( 'readonly', 'true' );
    }

    handleFileDrop() {

    }

    validateFields( d ) {
        let name        = this.nameInput.property( 'value' ),
            description = this.descriptionInput.property( 'value' ),
            template    = this.templateInput.property( 'value' );

        this.nameInput.classed( 'invalid', !name.length );
        this.descriptionInput.classed( 'invalid', !description.length );
        this.templateInput.classed( 'invalid', !template.length );

        let formValid = name.length && description.length && template.length;

        this.submitButton.attr('disabled', formValid ? null : true);
    }

    handleSubmit() {
        let translationName = this.nameInput.property( 'value' ),
            pathName        = this.pathNameInput.property( 'value' ),
            targetFolder    = _get( _find( Hoot.folders.translationFolders, folder => folder.path === pathName ), 'id' ) || 0,
            data            = this.templateInput.property( 'value' );

        if ( _find( Hoot.folders.translations, translation => translation.folderId === targetFolder && translation.name === translationName ) ) {
            let message = 'A translation already exists with this name in the destination folder. Please remove the old translation and try again.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        const paramData = {
            scriptName: translationName,
            scriptDescription: this.descriptionInput.property( 'value' ),
            folderId : targetFolder,
        };

        Hoot.api.postTranslation( data, paramData )
            .then( () => this.instance.loadTranslations() )
            .finally( () => {
                this.container.remove();
            } );

        this.mappingForm.remove();
    }

}
