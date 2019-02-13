/*******************************************************************************************************
 * File: exportFolder.js
 * Project: hootenanny-ui
 * @author Max Grossman - max.grossman@radiantsolutions.com on 2/12/19
 *******************************************************************************************************/

import FormFactory       from '../../tools/formFactory';
import { exportDataForm } from '../../config/domMetadata';

export default class ExportData {
    constructor( translations, input ) {
        this.translations = translations;
        this.input = input;
        this.form = exportDataForm.call(this);
    }

    render() {
        let metadata = {
            title: `Export Dataset: ${this.input}`,
            form: this.form,
            button: {
                text: 'Export',
                location: 'right',
                id: 'exportDatasetBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'export-data-form', metadata );
        this.translationSchemaCombo = this.container.select( '#exportTranslationCombo' );
        this.exportFormatCombo = this.container.select( '#exportFormatCombo' );
        this.dataExportNameTextInput = this.container.select( '#dataExportNameTextInput' );
        this.submitButton = this.container.select( '#exportDatasetBtn' );
        return this;
    }

    validate ( name ) {
        this.formValid = this.validateFields( this.translationSchemaCombo.node(), name ) &&
            this.validateFields( this.exportFormatCombo.node(), name ) &&
            this.validateTextInput( this.dataExportNameTextInput.node(), name );
            
        this.updateButtonState();
    }

    validateFields( d, name ) {
        let id              = d.id,    
            target          = d3.select( `#${id}` ),
            invalid         = !target.property( 'value' ).length;

        if ( id === name ) {
            target.classed( 'invalid', invalid );
        }

        return !invalid;
    }

    validateTextInput ( d, name ) {
        let id               = d.id,
            target           = d3.select( `#${id}` ),
            node             = target.node(),
            str              = node.value,

            // reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ], // implement once I know of reserved words...
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length || unallowedPattern.test( str )) {
            valid = false;
        }
        if ( id === name ) {
            target.classed( 'invalid', !valid );
        }
        
        return valid;
    }

    updateButtonState() {
        this.submitButton.node().disabled = !this.formValid;
    }

    getTranslationPath() {
        const selectedTranslation = this.translationSchemaCombo.node().value;
        return this.translations.find( t => t.NAME === selectedTranslation ).PATH;
    }

    handleSubmit() {
        let self = this,
            data =  {
                input: this.input,
                inputtype: 'db',
                append: false,
                includehoottags: false,
                outputname: self.dataExportNameTextInput.node().value,
                outputtype: self.exportFormatCombo.node().value,
                tagoverrides: {},
                textstatus: false,
                translation: self.getTranslationPath()
            };

        this.processRequest = Hoot.api.exportDataset( data )
            .catch( err => {

            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            });
    }

}