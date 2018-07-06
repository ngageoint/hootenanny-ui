/*******************************************************************************************************
 * File: transAssistSaveForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 6/28/18
 *******************************************************************************************************/

import API                     from '../../control/api';
import FormFactory             from '../../models/formFactory';
import { translationSaveForm } from '../../config/formMetadata';

export default class TransAssistSaveForm {
    constructor( instance, templateText ) {
        this.instance     = instance;
        this.formFactory  = new FormFactory();
        this.templateText = templateText;

        this.form = translationSaveForm.call( this );
    }

    render() {
        let button = {
            text: 'Save Edits',
            id: 'saveTranslationBtn',
            onClick: () => this.handleSubmit()
        };

        let metadata = {
            title: 'Create New Translation',
            form: this.form,
            button
        };

        this.container = this.formFactory.generateForm( 'body', 'translation-save-form', metadata );

        this.nameInput        = d3.select( '#translationSaveName' );
        this.descriptionInput = d3.select( '#translationSaveDescription' );
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#saveTranslationBtn' );
    }

    handleFileDrop() {

    }

    validateFields( d ) {
        let target         = d3.select( `#${ d.id }` );
        let nameVal        = this.nameInput.property( 'value' ),
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
        let data = {
            NAME: this.nameInput.property( 'value' ),
            DESCRIPTION: this.descriptionInput.property( 'value' ),
            data: this.templateInput.property( 'value' )
        };

        API.postTranslation( data )
            .then( () => {
                this.container.remove();
                this.instance.showTranslations();
            } );
    }

}