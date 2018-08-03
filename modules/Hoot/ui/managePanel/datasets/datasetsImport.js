/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _                      from 'lodash-es';
import API                    from '../../../managers/api';
import Event                  from '../../../managers/eventManager';
import ImportControl          from '../../../control/import';
import FolderManager          from '../../../managers/folderManager';
import LayerManager           from '../../../managers/layerManager';
import FormFactory            from '../../../tools/formFactory';
import { importDatasetForm }  from '../../../config/formMetadata';
import { importDatasetTypes } from '../../../config/domElements';
import { getBrowserInfo }     from '../../../tools/utilities';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class DatasetsImport {
    constructor( translations ) {
        this.folderList   = FolderManager._folders;
        this.importTypes  = importDatasetTypes;
        this.translations = translations;
        this.browserInfo  = getBrowserInfo();
        this.formFactory  = new FormFactory();

        // Add "NONE" option to beginning of array
        this.translations.unshift( {
            NAME: 'NONE',
            PATH: 'NONE',
            DESCRIPTION: 'No Translations',
            NONE: 'true'
        } );

        if ( this.browserInfo.name.substring( 0, 6 ) !== 'Chrome' ) {
            _.remove( this.importTypes, o => o.value === 'DIR' );
        }

        this.form = importDatasetForm.call( this );
    }

    /**
     * Set form parameters and create the form using the form factory
     */
    render() {
        let button = {
            text: 'Import',
            location: 'right',
            id: 'importDatasetBtn',
            onClick: () => this.handleSubmit()
        };

        let metadata = {
            title: 'Import Datasets',
            form: this.form,
            button
        };

        this.container = this.formFactory.generateForm( 'body', 'datasets-import-form', metadata );

        this.typeInput          = d3.select( '#importDatasetImportType' );
        this.fileInput          = d3.select( '#importDatasetFileImport' );
        this.layerNameInput     = d3.select( '#importDatasetLayerName' );
        this.folderPathInput    = d3.select( '#importDatasetPathName' );
        this.newFolderNameInput = d3.select( '#importDatasetNewFolderName' );
        this.schemaInput        = d3.select( '#importDatasetSchema' );
        this.fileIngest         = d3.select( '#ingestFileUploader' );
        this.submitButton       = d3.select( '#importDatasetBtn' );
    }

    /**
     * Update the form by enabling, disabling, or clearing certain
     * fields based on the value entered
     */
    handleTypeChange() {
        let selectedVal  = this.typeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal ),
            schemaCombo  = this.schemaInput.datum(),
            translationsList;

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

        schemaCombo.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.formFactory.populateCombobox( this.schemaInput );

        this.schemaInput.property( 'value', translationsList[ 0 ].DESCRIPTION );
    }

    /**
     * Update the file input's value with the name of the selected file
     */
    handleMultipartChange() {
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
    }

    /**
     * Submit form data
     */
    handleSubmit() {
        let transVal    = this.schemaInput.property( 'value' ),
            typeVal     = this.typeInput.property( 'value' ),
            transCombo  = this.schemaInput.datum(),
            typeCombo   = this.typeInput.datum(),
            translation = _.filter( transCombo.data, o => o.DESCRIPTION === transVal )[ 0 ],
            importType  = _.filter( typeCombo.data, o => o.title === typeVal )[ 0 ];

        let data = {
            NONE_TRANSLATION: translation.NONE === 'true',
            TRANSLATION: translation.PATH,
            INPUT_TYPE: importType.value,
            INPUT_NAME: this.layerNameInput.property( 'value' ),
            formData: this.getFormData( this.fileIngest.node().files )
        };

        this.loadingState();

        return API.uploadDataset( data )
            .then( () => FolderManager.refreshDatasets() )
            .then( () => {
                if ( this.newFolderNameInput.property( 'value' ) ) {
                    this.addFolder();
                } else {
                    this.updateFolderLink();
                }
            } );
    }

    addFolder() {
        let pathName   = this.folderPathInput.property( 'value' ) || this.folderPathInput.attr( 'placeholder' ),
            folderName = this.newFolderNameInput.property( 'value' ),
            folderData = _.find( this.folderList, folder => folder.name === pathName ),
            parentId   = folderData ? folderData.parentId : 0;

        let params = {
            folderName,
            parentId
        };

        API.addFolder( params )
            .then( resp => console.log( resp ) )
            .catch( err => console.log( err ) );
    }

    // TODO: update folder links
    updateFolderLink() {
        //let layerName  = this.layerNameInput.property( 'value' ),
        //    folderName = this.newFolderNameInput.property( 'value' ),
        //    pathName   = this.folderPathInput.property( 'value' ) || this.folderPathInput.attr( 'placeholder' ),
        //
        //    layerData  = _.find( LayerManager._layers, layer => layer.name === layerName ),
        //    folderData = _.find( this.folderList, folder => folder.name === pathName );
        //
        //let params = {
        //    folderName,
        //    mapId: layerData.id || 0,
        //    parentId: folderData.parentId,
        //    updateType: 'new'
        //};
        //
        //if ( !params.mapId ) return;
    }

    /**
     *
     * @param files
     * @returns {FormData}
     */
    getFormData( files ) {
        let formData = new FormData();

        _.forEach( files, ( file, i ) => {
            formData.append( `eltuploadfile${ i }`, file );
        } );

        return formData;
    }

    loadingState() {
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
    }

    /**
     * Validate user input to make sure it doesn't
     * contain un-allowed characters and isn't an empty string
     *
     * @param d - node data
     */
    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
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
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let importType = this.container.select( '#importDatasetImportType' ).node().value,
            self       = this;

        this.container.selectAll( '.text-input' )
            .each( function( d ) {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !importType.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    /**
     * Get the selected import-type's value
     *
     * @param title - title of selected import-type
     * @returns {boolean|string} - value of type if found. otherwise, false.
     */
    getTypeName( title ) {
        let comboData = this.container.select( '#importDatasetImportType' ).datum(),
            match     = _.find( comboData.data, o => o.title === title );

        return match ? match.value : false;
    }

    /**
     * Update properties of the multipart upload input based on the selected import-type
     *
     * @param typeVal - value of selected import-type
     */
    setMultipartForType( typeVal ) {
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
                .attr( 'accept', '.geonames, .txt' )
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
    }
}