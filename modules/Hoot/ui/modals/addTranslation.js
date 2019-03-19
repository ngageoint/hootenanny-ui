/*******************************************************************************************************
 * File: addTranslation.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 6/28/18
 *******************************************************************************************************/

import FormFactory            from '../../tools/formFactory';
import { translationAddForm } from '../../config/domMetadata';

export default class AddTranslation {
    constructor( instance, templateText ) {
        this.instance = instance;
        this.templateText = templateText;

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
        this.templateInput    = d3.select( '#translationTemplate' );
        this.submitButton     = d3.select( '#addTranslationBtn' );
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
        let data = {
            NAME: this.nameInput.property( 'value' ),
            DESCRIPTION: this.descriptionInput.property( 'value' ),
            data: this.templateInput.property( 'value' )
        };

        Hoot.api.postTranslation( data )
            .then( () => this.instance.loadTranslations() )
            .finally( () => {
                this.container.remove();

                if ( this.instance.id === 'manage-translations-assistant' ) {
                    this.instance.showTranslations();
                }
            } );
    }

}
