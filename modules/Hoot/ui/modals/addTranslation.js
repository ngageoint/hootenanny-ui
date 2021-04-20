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
        this.folderList = Hoot.folders.translationFolderPaths;
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
        let pathName = this.pathNameInput.property( 'value' );

        const data = this.templateInput.property( 'value' );
        const paramData = {
            SCRIPT_NAME: this.nameInput.property( 'value' ),
            SCRIPT_DESCRIPTION: this.descriptionInput.property( 'value' ),
            folderId : _get( _find( Hoot.folders.translationFolderPaths, folder => folder.path === pathName ), 'id' ) || 0,
        };

        Hoot.api.postTranslation( data, paramData )
            .then( () => this.instance.loadTranslations() )
            .finally( () => {
                this.container.remove();
            } );

        this.mappingForm.remove();
    }

}
