/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import FolderManager from '../../models/folderManager';
import FormFactory from './formFactory';
import { importDatasetTypes } from '../../config/domElements';
import { d3combobox as d3_combobox } from '../../../lib/hoot/d3.combobox';
import { getBrowserInfo } from '../../util/utilities';

export default function ImportDataset( translations ) {
    this.folderList   = FolderManager.availableFolders;
    this.importTypes  = importDatasetTypes;
    this.translations = translations;
    this.browserInfo  = getBrowserInfo();

    this.translations.unshift( {
        NAME: 'NONE',
        PATH: 'NONE',
        DESCRIPTION: 'No Translation',
        NONE: 'true'
    } );

    if ( this.browserInfo.name.substring( 0, 6 ) !== 'Chrome' ) {
        _.remove( this.importTypes, o => o.value === 'DIR' );
    }

    this.render = () => {
        let form = [
            {
                label: 'Import Type',
                id: 'importDatasetImportType',
                placeholder: 'Select Import Type',
                inputType: 'combobox',
                combobox: {
                    data: this.importTypes,
                    command: this.populateImportTypes
                },
                onChange: this.handleTypeChange
            },
            {
                label: 'Import Data',
                id: 'importDatasetFileImport',
                placeholder: 'Select File',
                icon: 'folder',
                readOnly: true,
                disabled: true,
                inputType: 'multipart',
                multipartId: 'ingestFileUploader',
                onChange: this.handleMultipartChange
            },
            {
                label: 'Layer Name',
                id: 'importDatasetLayerName',
                placeholder: 'Enter name',
                inputType: 'text'
            },
            {
                label: 'Path',
                placeholder: 'root',
                id: 'importDatasetPathName',
                inputType: 'combobox',
                combobox: {
                    data: this.folderList,
                    command: this.populateFolderList
                }
            },
            {
                label: 'Enter Name for New Folder (Leave blank otherwise)',
                id: 'importDatasetNewFolderName',
                inputType: 'text'
            },
            {
                label: 'Translation Schema of Import File',
                placeholder: 'Select Data Translation Schema',
                id: 'importDatasetSchema',
                inputType: 'combobox',
                disabled: true,
                combobox: {
                    data: this.translations,
                    command: this.populateTranslations
                }
            }
        ];

        let button = {
            text: 'Import',
            location: 'right',
            id: 'importDatasetBtn'
        };

        let metadata = {
            title: 'Import Dataset',
            form: form,
            button
        };

        this.container = new FormFactory().generateForm( 'body', metadata );

        this.importTypeInput = d3.select( '#importDatasetImportType' );
        this.fileInput       = d3.select( '#importDatasetFileImport' );
        this.layerNameInput  = d3.select( '#importDatasetLayerName' );
        this.schemaInput     = d3.select( '#importDatasetSchema' );
        this.fileIngest      = d3.select( '#ingestFileUploader' );
        this.submitButton    = d3.select( '#importDatasetBtn' );
    };

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

    this.handleTypeChange = () => {
        let selectedVal  = this.importTypeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal ),
            schemaData   = this.schemaInput.datum(),
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

        schemaData.combobox.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.populateTranslations( this.schemaInput.node(), schemaData );

        this.schemaInput.property( 'value', translationsList[ 0 ].DESCRIPTION );
    };

    this.handleMultipartChange = () => {
        let selectedVal   = this.importTypeInput.property( 'value' ),
            selectedType  = this.getTypeName( selectedVal ),
            files         = this.fileIngest.node().files,
            fileNames     = [];

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

        this.submitButton.node().disabled = false;
    };

    this.getTypeName = val => {
        let comboData = this.container.select( '#importDatasetImportType' ).datum(),
            match     = _.find( comboData.combobox.data, o => o.title === val );

        return match ? match.value : false;
    };

    this.setMultipartForType = typeName => {
        let uploader = d3.select( '#ingestFileUploader' );

        if ( typeName === 'DIR' ) {
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
        } else if ( typeName === 'GEONAMES' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.geonames,.txt' )
                .attr( 'webkitdirectory', null )
                .attr( 'directory', null );
        } else if ( typeName === 'OSM' ) {
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