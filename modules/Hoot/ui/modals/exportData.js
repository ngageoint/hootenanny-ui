/*******************************************************************************************************
 * File: exportData.js
 * Project: hootenanny-ui
 * @author Max Grossman - max.grossman@radiantsolutions.com on 2/12/19
 *******************************************************************************************************/

import FormFactory       from '../../tools/formFactory';
import { exportDataForm } from '../../config/domMetadata';

import _flattenDeep from 'lodash-es/flattenDeep';
import _isEmpty from 'lodash-es/isEmpty';

export default class ExportData {
    constructor( translations, d, type ) {
        const isDatasets = type === 'Datasets';
        this.translations = translations;
        this.input = isDatasets ? d.map(n => n.name).join(',') : d.data.name;
        this.id = isDatasets ? d.map(n => n.id).join(',') : d.data.id;
        this.type = type;
        this.form = exportDataForm.call(this, isDatasets );
    }

    render() {
        let metadata = {
            title: `Export ${this.type}: ${this.input}`,
            form: this.form,
            button: {
                text: 'Export',
                location: 'right',
                id: 'exportDatasetBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.formFactory = new FormFactory();
        this.container = this.formFactory.generateForm( 'body', 'export-data-form', metadata );
        this.translationSchemaCombo = this.container.select( '#exportTranslationCombo' );
        this.exportFormatCombo = this.container.select( '#exportFormatCombo' );
        this.appendToFgdbCheckbox = this.container.select( '#exportAppendFgdb' );
        this.dataExportNameTextInput = this.container.select( '#dataExportNameTextInput' );
        this.submitButton = this.container.select( '#exportDatasetBtn' );
        this.submitButton.attr('disabled', null);

        if ( this.type === 'Datasets' ) {
            this.dataExportNameTextInput.attr( 'placeholder', this.input.split(',').join('_') );
        }

        let container = this.container;
        Hoot.events.once( 'modal-closed', () => {
            container.remove();
        });

        return this;
    }

    validate ( name ) {
        this.formValid = this.validateFields( this.translationSchemaCombo.node(), name ) &&
            this.validateFields( this.exportFormatCombo.node(), name );

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

    getOutputType() {
        return {
            'Shapefile': 'shp',
            'File Geodatabase': 'gdb',
            'OpenStreetMap (XML)': 'osm',
            'OpenStreetMap (PBF)': 'osm.pbf'
        }[this.exportFormatCombo.node().value];
    }

    getInputs(input) {
        switch (this.type.toLowerCase()) {
            case 'datasets': {
                input = this.input;
                break;
            }
            case 'folder': {
                input = Hoot.folders.findBy('name', input).id;
                break;
            }
            default: {
                input = Hoot.layers.findBy('name', this.input ).name;
                break;
            }
        }
        return input;
    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Exporting...' );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }

    getInputType() {
        let type;
        switch ( this.type ) {
            case 'Dataset': {
                type = 'db';
                break;
            }
            case 'Datasets': {
                type = 'dbs';
                break;
            }
            case 'Folder' : {
                type = 'folder';
                break;
            }
            default: break;
        }
        return type;
    }

    getOutputName() {
        let output;
        switch (this.type) {
            case 'Datasets': {
                let input = this.dataExportNameTextInput.property( 'value' );
                output = _isEmpty( input ) ? this.dataExportNameTextInput.attr( 'placeholder' ) : input;
                break;
            }
            default: {
                output = this.input;
                break;
            }
        }
        return output;
    }

    handleSubmit() {
        let self = this,
            data = {
                hoot2: true,
                input: self.id,
                inputtype: self.getInputType(),
                append: self.appendToFgdbCheckbox.property( 'checked' ),
                includehoottags: false,
                outputname: self.getOutputName(),
                outputtype: self.getOutputType(),
                tagoverrides: {},
                textstatus: false,
                translation: self.getTranslationPath(),
                userId: Hoot.user().id
            };

        this.loadingState();

        this.processRequest = Hoot.api.exportDataset(data)
            .then( (message) => {
                Hoot.events.emit( 'modal-closed' );
                Hoot.message.alert( message );
            })
            .catch( err => {
                Hoot.message.alert( err );
            } );
        }

}
