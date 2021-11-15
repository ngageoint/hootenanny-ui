/*******************************************************************************************************
 * File: addTranslation.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 6/28/18
 *******************************************************************************************************/

import FormFactory            from '../../tools/formFactory';
import { translationAddForm } from '../../config/domMetadata';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';

export default class AddTranslation {
    constructor( instance, templateText ) {
        this.instance = instance;
        this.templateText = templateText;
        this.folderList = Hoot.folders.translationFolders;
        this.form = translationAddForm.call( this );
    }

    render() {
        let metadata = {
            title: 'Create New Translations',
            form: this.form,
            button: {
                text: 'Save Edits',
                id: 'addTranslationBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'translations-add-form', metadata );

        this.nameInput        = d3.select( '#translationSaveName' );
        this.descriptionInput = d3.select( '#translationSaveDescription' );
        this.pathNameInput    = d3.select( '#importPathName' );
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#addTranslationBtn' );
        this.mappingForm      = d3.select( '.ta-attribute-mapping' );

        this.pathNameInput.attr( 'readonly', 'true' );
    }

    handleFileDrop() {

    }

    validateFields( d ) {
        let target         = d3.select( `#${ d.id }` ),
            nameVal        = this.nameInput.property( 'value' ),
            descriptionVal = this.descriptionInput.property( 'value' ),
            templateVal    = this.templateInput.property( 'value' );

        if ( !target.property( 'value' ).length ) {
            target.classed( 'invalid', true );
        } else {
            target.classed( 'invalid', false );
        }

        let formValid = nameVal.length && descriptionVal.length && templateVal.length;

        this.submitButton.node().disabled = !formValid;
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
