/** ****************************************************************************************************
 * File: viewTranslation.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 1/31/19
 *******************************************************************************************************/

import { translationViewForm } from '../../config/domMetadata';
import FormFactory             from '../../tools/formFactory';
import _get from 'lodash-es/get';
import _find from 'lodash-es/find';

export default class ViewTranslation {
    constructor( instance, translation, templateText ) {
        this.instance = instance;

        this.translation  = translation;
        this.templateText = templateText;
        this.folderList = Hoot.folders.translationFolders;
        this.form = translationViewForm.call( this );
    }

    render() {
        let metadata = {
            title: this.translation.NAME || this.translation.name,
            form: this.form
        };

        if ( !this.translation.DEFAULT ) {
            metadata.button = {
                text: 'Save Edits',
                    id: 'editTranslationBtn',
                    onClick: () => this.handleSubmit()
            };
        }

        this.container = new FormFactory().generateForm( 'body', 'translations-add-form', metadata );

        this.descriptionInput = d3.select( '#translationSaveDescription' );
        this.pathNameInput    = d3.select( '#importPathName' );
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#editTranslationBtn' );

        this.descriptionInput.property( 'value', this.translation.DESCRIPTION );
        const path = _get( _find( this.folderList, folder => folder.id === this.translation.folderId ), 'path' );
        this.pathNameInput.property( 'value', path );


        if ( this.translation.DEFAULT ) {
            this.descriptionInput.attr( 'readonly', 'readonly' );
            this.templateInput.attr( 'readonly', 'readonly' );
        }
    }

    handleFileDrop() {

    }

    validateFields( d ) {
        let target         = d3.select( `#${ d.id }` ),
            descriptionVal = this.descriptionInput.property( 'value' ),
            templateVal    = this.templateInput.property( 'value' );

        if ( !target.property( 'value' ).length ) {
            target.classed( 'invalid', true );
        } else {
            target.classed( 'invalid', false );
        }

        let formValid = descriptionVal.length && templateVal.length;

        this.submitButton.node().disabled = !formValid;
    }

    handleSubmit() {
        const data = this.templateInput.property( 'value' );
        const paramData = {
            SCRIPT_NAME: this.translation.NAME || this.translation.name,
            SCRIPT_DESCRIPTION: this.descriptionInput.property( 'value' ),
            folderId : this.translation.folderId
        };

        Hoot.api.postTranslation( data, paramData )
            .then( () => this.container.remove() )
            .finally( () => this.instance.loadTranslations() );
    }

}
