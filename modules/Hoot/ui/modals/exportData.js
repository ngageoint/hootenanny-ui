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

    getInputs( id ) {
        let self                 = this,
            children             = Hoot.folders.getFolderChildren( id ),
          { folders, datasets }  = children,
            inputs               = datasets;

        if ( folders.length ) {
            inputs = inputs.concat( folders.map( f => self.getInputs( f.id ) ) );
        }
        
        return _flattenDeep( inputs );
    }

    addInputs() {
        return this.type === 'Dataset' 
            ? { inputtype: 'db' }
            : { inputtype: 'folder', inputs: this.getInputs( this.id ) }; 
    }

    handleSubmit() {
        let self = this,
            req  = Hoot.api[`export${this.type}`], // either folder or dataset...
            data = {
                input: self.input,
                append: self.appendToFgdbCheckbox.property('checked'),
                includehoottags: false,
                outputname: self.dataExportNameTextInput,
                outputtype: self.getOutputType(),
                tagoverrides: {},
                textstatus: false,
                translation: self.getTranslationPath(),
                userId: Hoot.user().id
            }; 
       
        data = Object.assign(data, this.addInputs());

        this.formFactory.createProcessSpinner( this.container.select( '.modal-footer' ) );
        this.processRequest = req(data).catch( err => {
                Hoot.message.alert( err );
            } )
            .finally( () => {
                this.formFactory.removeProcessSpinner( this.container.select( '.modal-footer' ) );
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            });
    }

}