/*******************************************************************************************************
 * File: exportData.js
 * Project: hootenanny-ui
 * @author Max Grossman - max.grossman@radiantsolutions.com on 2/12/19
 *******************************************************************************************************/

import FormFactory       from '../../tools/formFactory';
import { exportDataForm } from '../../config/domMetadata';

import _flattenDeep from 'lodash-es/flattenDeep';

export default class ExportData {
    constructor( translations, d, type ) {
        this.translations = translations;
        this.input = d.data.name;
        this.id = d.data.id;
        this.type = type;
        this.form = exportDataForm.call(this);
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

    getOutputType() {
        return {
            'Shapefile': 'shp',
            'File Geodatabase': 'gdb',
            'OpenStreetMap (OSM)': 'osm',
            'OpenStreetMap (PBF)': 'osm.pbf'
        }[this.exportFormatCombo.node().value];
    }

    getInputs(input) {

        switch (this.type.toLowerCase()) {
            case 'files': {
                input = this.type.trim()
                    .split(',')
                    .map(name => Hoot.layers.findBy('name', name ).id )
                    .join(',');

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
        return this.type === 'Dataset' ? 'db' : this.type.toLowerCase();
    }

    getOutputName() {
        return this.getInputType() === 'folder'
            ? this.input
            : this.dataExportNameTextInput.property( 'value' );
    }

    handleSubmit() {
        let self = this,
            data = {
                hoot2: true,
                input: self.getInputs(self.input),
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
            .catch( err => {
                Hoot.message.alert( err );
            } )
            .finally( () => {
                Hoot.events.emit( 'modal-closed' );
            } );
    }

}