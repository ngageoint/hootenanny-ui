/** ****************************************************************************************************
 * File: viewTranslation.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 1/31/19
 *******************************************************************************************************/

import { translationViewForm } from '../../config/domMetadata';
import FormFactory             from '../../tools/formFactory';

export default class ViewTranslation {
    constructor( instance, translation, templateText ) {
        this.instance = instance;

        this.translation  = translation;
        this.templateText = templateText;

        this.form = translationViewForm.call( this );
    }

    render() {
        let metadata = {
            title: this.translation.NAME,
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
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#editTranslationBtn' );

        this.descriptionInput.property( 'value', this.translation.DESCRIPTION );

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
        let data = {
            NAME: this.translation.NAME,
            DESCRIPTION: this.descriptionInput.property( 'value' ),
            data: this.templateInput.property( 'value' )
        };

        Hoot.api.postTranslation( data )
            .then( () => this.container.remove() )
            .finally( () => this.instance.loadTranslations() );
    }

}
