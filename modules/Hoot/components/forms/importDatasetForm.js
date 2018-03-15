/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import FolderManager from '../../models/folderManager';
import ImportManager from '../../models/importManager';
import FormFactory from './formFactory';
import { importDatasetForm } from '../../config/formConfigs';
import { importDatasetTypes } from '../../config/domElements';
import { d3combobox as d3_combobox } from '../../../lib/hoot/d3.combobox';
import { getBrowserInfo } from '../../util/utilities';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default function ImportDatasetForm( translations ) {
    const self = this;

    this.folderList   = FolderManager.folderPaths;
    this.importTypes  = importDatasetTypes;
    this.translations = translations;
    this.browserInfo  = getBrowserInfo();

    // Add "NONE" option to beginning of array
    this.translations.unshift( {
        NAME: 'NONE',
        PATH: 'NONE',
        DESCRIPTION: 'No Translation',
        NONE: 'true'
    } );

    if ( this.browserInfo.name.substring( 0, 6 ) !== 'Chrome' ) {
        _.remove( this.importTypes, o => o.value === 'DIR' );
    }

    /**
     * Set form parameters and create the form using the form factory
     */
    this.render = () => {
        let form = importDatasetForm.call( this );

        let button = {
            text: 'Import',
            location: 'right',
            id: 'importDatasetBtn',
            onClick: this.handleSubmit
        };

        let metadata = {
            title: 'Import Dataset',
            form: form,
            button
        };

        this.container = new FormFactory().generateForm( 'body', metadata );

        this.typeInput      = d3.select( '#importDatasetImportType' );
        this.fileInput      = d3.select( '#importDatasetFileImport' );
        this.layerNameInput = d3.select( '#importDatasetLayerName' );
        this.schemaInput    = d3.select( '#importDatasetSchema' );
        this.newFolderInput = d3.select( '#importDatasetNewFolderName' );
        this.fileIngest     = d3.select( '#ingestFileUploader' );
        this.submitButton   = d3.select( '#importDatasetBtn' );
    };

    /**
     * Populate the import-type list dropdown
     *
     * @param node - input node
     * @param d - node data
     */
    this.populateImportTypes = ( node, d ) => {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.title,
                    title: n.title
                };
            } ) );

        d3.select( node )
            .call( combobox );
    };

    /**
     * Populate the available folders list dropdown
     *
     * @param node - input node
     * @param d - node data
     */
    this.populateFolderList = ( node, d ) => {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.path,
                    title: n.path
                };
            } ) );

        let data = combobox.data();

        data.sort( ( a, b ) => {
            let textA = a.value.toLowerCase(),
                textB = b.value.toLowerCase();

            return textA < textB ? -1 : textA > textB ? 1 : 0;
        } ).unshift( { value: 'root', title: 0 } );

        d3.select( node )
            .call( combobox );
    };

    /**
     * Populate the translations list dropdown
     *
     * @param node - input node
     * @param d - node data
     */
    this.populateTranslations = ( node, d ) => {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                };
            } ) );

        d3.select( node )
            .call( combobox );
    };

    /**
     * Update the form by enabling, disabling, or clearing certain
     * fields based on the value entered
     */
    this.handleTypeChange = () => {
        let selectedVal  = this.typeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal ),
            schemaData   = this.schemaInput.datum(),
            translationsList;

        this.formData.importType = selectedVal;

        // clear values
        this.fileInput.property( 'value', '' );
        this.layerNameInput.property( 'value', '' );
        this.schemaInput.property( 'value', '' );

        // enable input
        if ( !selectedType ) {
            this.fileInput.node().disabled   = true;
            this.schemaInput.node().disabled = true;
        } else {
            this.fileInput.node().disabled   = false;
            this.schemaInput.node().disabled = false;
        }

        // filter translations for selected type
        if ( selectedType === 'GEONAMES' ) {
            translationsList = _.filter( this.translations, o => o.NAME === 'GEONAMES' );
        } else {
            translationsList = _.reject( this.translations, o => o.NAME === 'GEONAMES' );
        }

        schemaData.combobox.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.populateTranslations( this.schemaInput.node(), schemaData );

        this.schemaInput.property( 'value', translationsList[ 0 ].DESCRIPTION );
    };

    /**
     * Update the file input's value with the name of the selected file
     */
    this.handleMultipartChange = () => {
        let selectedVal  = this.typeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal ),
            files        = this.fileIngest.node().files,
            fileNames    = [];

        for ( let i = 0; i < files.length; i++ ) {
            let currentFile = files[ i ],
                fileName    = currentFile.name;

            fileNames.push( fileName );
        }

        if ( selectedType === 'DIR' ) {

        } else {
            let firstFile = fileNames[ 0 ],
                saveName  = firstFile.indexOf( '.' ) ? firstFile.substring( 0, firstFile.indexOf( '.' ) ) : firstFile;

            this.fileInput.property( 'value', fileNames.join( '; ' ) );
            this.layerNameInput.property( 'value', saveName );
        }

        this.formValid = true;
        this.updateButtonState();
    };

    /**
     * Submit form data
     */
    this.handleSubmit = () => {
        let transVal    = this.schemaInput.property( 'value' ),
            typeVal     = this.typeInput.property( 'value' ),
            transCombo  = this.schemaInput.datum(),
            typeCombo   = this.typeInput.datum(),
            translation = _.filter( transCombo.combobox.data, o => o.DESCRIPTION === transVal )[ 0 ],
            importType  = _.filter( typeCombo.combobox.data, o => o.title === typeVal )[ 0 ];

        let data = {
            NONE_TRANSLATION: translation.NONE === 'true',
            TRANSLATION: translation.PATH,
            INPUT_TYPE: importType.value,
            INPUT_NAME: this.layerNameInput.property( 'value' ),
            formData: this.getFormData( this.fileIngest.node().files )
        };

        this.loadingState();

        ImportManager.importData( data );
    };

    /**
     *
     * @param files
     * @returns {FormData}
     */
    this.getFormData = files => {
        let formData = new FormData();

        _.forEach( files, ( file, i ) => {
            formData.append( `eltuploadfile${ i }`, file );
        } );

        return formData;
    };

    this.loadingState = () => {
        this.submitButton
            .select( 'span' )
            .text( 'Uploading...' );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    };

    /**
     * Validate user input to make sure it doesn't
     * contain un-allowed characters and isn't an empty string
     *
     * @param d - node data
     */
    this.validateTextInput = d => {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'datasets', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
            valid = false;
        }

        if ( node.id === 'importDatasetLayerName' && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    };

    /**
     * Enable/disable button based on form validity
     */
    this.updateButtonState = () => {
        this.container.selectAll( '.text-input' )
            .each( function( d ) {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    };

    /**
     * Get the selected import-type's value
     *
     * @param title - title of selected import-type
     * @returns {boolean|string} - value of type if found. otherwise, false.
     */
    this.getTypeName = title => {
        let comboData = this.container.select( '#importDatasetImportType' ).datum(),
            match     = _.find( comboData.combobox.data, o => o.title === title );

        return match ? match.value : false;
    };

    /**
     * Update properties of the multipart upload input based on the selected import-type
     *
     * @param typeVal - value of selected import-type
     */
    this.setMultipartForType = typeVal => {
        let uploader = d3.select( '#ingestFileUploader' );

        if ( typeVal === 'DIR' ) {
            if ( this.browserInfo.name.substring( 0, 6 ) === 'Chrome' ) {
                uploader
                    .property( 'multiple', false )
                    .attr( 'accept', null )
                    .attr( 'webkitdirectory', '' )
                    .attr( 'directory', '' );
            } else {
                uploader
                    .property( 'multiple', false )
                    .attr( 'accept', '.zip' )
                    .attr( 'webkitdirectory', null )
                    .attr( 'directory', null );
            }
        } else if ( typeVal === 'GEONAMES' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.geonames,.txt' )
                .attr( 'webkitdirectory', null )
                .attr( 'directory', null );
        } else if ( typeVal === 'OSM' ) {
            uploader
                .property( 'multiple', true )
                .attr( 'accept', '.osm, .osm.zip, .pbf' )
                .attr( 'webkitdirectory', null )
                .attr( 'directory', null );
        } else {
            uploader
                .property( 'multiple', true )
                .attr( 'accept', null )
                .attr( 'webkitdirectory', null )
                .attr( 'directory', null );
        }
    };
}