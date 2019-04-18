/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _filter  from 'lodash-es/filter';
import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _reject  from 'lodash-es/reject';
import _remove  from 'lodash-es/remove';

import FormFactory        from '../../tools/formFactory';
import { getBrowserInfo } from '../../tools/utilities';

import {
    importSingleForm,
}           from '../../config/domMetadata';
import _get from 'lodash-es/get';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class ImportDataset {
    constructor( translations ) {
        this.folderList     = Hoot.folders._folders;
        this.translations   = translations;
        this.browserInfo    = getBrowserInfo();
        this.formFactory    = new FormFactory();
        this.processRequest = null;

        // Add "NONE" option to beginning of array
        this.translations.unshift( {
            NAME: 'NONE',
            PATH: 'NONE',
            DESCRIPTION: 'No Translations',
            NONE: 'true'
        } );

        this.importTypes = [
            {
                title: 'File (shp, zip, gdb.zip)',
                value: 'FILE'
            },
            {
                title: 'File (osm, osm.zip, pbf)',
                value: 'OSM'
            },
            {
                title: 'File (geojson)',
                value: 'GEOJSON'
            },
            {
                title: 'File (geonames, txt)',
                value: 'GEONAMES'
            },
            {
                title: 'Directory (FGDB)',
                value: 'DIR'
            }
        ];
    }

    /**
     * Set form parameters and create the form using the form factory
     */
    render() {
        if ( this.browserInfo.name.substring( 0, 6 ) !== 'Chrome' ) {
            _remove( this.importTypes, o => o.value === 'DIR' );
        }

        this.form           = importSingleForm.call( this );
        this.form[ 0 ].data = this.importTypes;

        let metadata = {
            title: 'Import Dataset',
            form: this.form,
            button: {
                text: 'Import',
                location: 'right',
                id: 'importSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = this.formFactory.generateForm( 'body', 'datasets-import-form', metadata );

        this.typeInput          = this.container.select( '#importType' );
        this.fileInput          = this.container.select( '#importFile' );
        this.layerNameInput     = this.container.select( '#importLayerName' );
        this.pathNameInput      = this.container.select( '#importPathName' );
        this.newFolderNameInput = this.container.select( '#importNewFolderName' );
        this.schemaInput        = this.container.select( '#importSchema' );
        this.fileIngest         = this.container.select( '#ingestFileUploader' );
        this.submitButton       = this.container.select( '#importSubmitBtn' );

        return this;
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
            translationsList = _filter( this.translations, o => o.NAME === 'GEONAMES' );
        } else {
            translationsList = _reject( this.translations, o => o.NAME === 'GEONAMES' );
        }

        schemaCombo.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.formFactory.populateCombobox( this.schemaInput );

        this.schemaInput.property( 'value', translationsList[ 0 ].NAME );
    }

    /**
     * Update the file input's value with the name of the selected file
     */
    async handleMultipartChange() {
        let selectedVal  = this.typeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal ),
            files        = this.fileIngest.node().files,
            fileNames    = [];

        // for validation
        let fileList      = [],
            totalFileSize = 0,
            typeCount     = {
                osm: 0,
                shp: 0,
                zip: 0
            };

        if ( !files.length ) return;

        for ( let i = 0; i < files.length; i++ ) {
            let currentFile = files[ i ],
                fileName    = currentFile.name;

            totalFileSize += currentFile.size;
            fileNames.push( fileName );

            if ( selectedType === 'FILE' ) {
                this.setFileMetadata( fileName, typeCount, fileList );
            }
        }

        let valid = await this.validateLoaded( selectedType, fileList, totalFileSize );

        if ( !valid ) {
            this.formValid = false;
            this.updateButtonState();

            return;
        }

        if ( selectedType === 'DIR' ) {
            //TODO: get back to this
        } else {
            let firstFile = fileNames[ 0 ],
                saveName  = firstFile.indexOf( '.' ) ? firstFile.substring( 0, firstFile.indexOf( '.' ) ) : firstFile;

            this.fileInput.property( 'value', fileNames.join( '; ' ) );

            this.layerNameInput.property( 'value', saveName );
        }

        this.formValid = true;
        this.updateButtonState();
    }

    //TODO: get translation description and show checkbox for appending fcode description

    setFileMetadata( fileName, typeCount, fileList ) {
        let fName = fileName.substring( 0, fileName.length - 4 );

        if ( fileName.indexOf( '.shp.xml' ) > -1 ) {
            fName = fileName.toLowerCase().substring( 0, fileName.length - 8 );
        }

        let fObj = _find( fileList, file => file.name === fName );

        if ( !fObj ) {
            fObj = {
                name: fName,
                isSHP: false,
                isSHX: false,
                isDBF: false,
                isPRJ: false,
                isOSM: false,
                isZIP: false,
                isGEOJSON: false
            };

            fileList.push( fObj );
        }

        fileName = fileName.toLowerCase();

        if ( fileName.lastIndexOf( '.shp' ) > -1 ) {
            typeCount.shp++;
            fObj.isSHP = true;
        } else if ( fileName.lastIndexOf( '.shx' ) > -1 ) {
            fObj.isSHX = true;
        } else if ( fileName.lastIndexOf( '.dbf' ) > -1 ) {
            fObj.isDBF = true;
        } else if ( fileName.lastIndexOf( '.prj' ) > -1 ) {
            fObj.isPRJ = true;
        } else if ( fileName.lastIndexOf( '.osm' ) > -1 ) {
            typeCount.osm++;
            fObj.isOSM = true;
        } else if ( fileName.lastIndexOf( '.zip' ) > -1 ) {
            typeCount.zip++;
            fObj.isZIP = true;
        } else if ( fileName.lastIndexOf( '.geojson' ) > -1 ) {
            typeCount.geojson++;
            fObj.isGEOJSON = true;
        }
    }

    validateLoaded( selectedType, fileList, totalFileSize ) {
        let ingestThreshold = Hoot.config.ingestSizeThreshold,
            valid           = true;

        if ( selectedType === 'FILE' ) {
            _forEach( fileList, file => {
                if ( file.isSHP && (!file.isSHX || !file.isDBF)
                    || file.isSHX && (!file.isSHP || !file.isDBF)
                    || file.isDBF && (!file.isSHX || !file.isSHP) ) {
                    valid = false;
                }
            } );

            if ( !valid ) {
                let alert = {
                    message: 'Missing shapefile dependency. Import requires shp, shx and dbf.',
                    type: 'warn'
                };

                Hoot.message.alert( alert );
                return false;
            }
        }

        if ( totalFileSize > ingestThreshold ) {
            let thresholdInMb = Math.floor( ingestThreshold / 1000000 );

            let message = `The total size of ingested files are greater than ingest threshold size of ${ thresholdInMb } MB and it may have problem. Do you wish to continue?`;

            return Hoot.message.confirm( message );
        } else {
            return true;
        }
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

        if ( node.id === 'importLayerName' && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * Submit form data
     */
    async handleSubmit() {
        let layerName     = this.layerNameInput.property( 'value' ),
            pathName      = this.pathNameInput.property( 'value' ),
            newFolderName = this.newFolderNameInput.property( 'value' ),
            pathId        = _get( _find( Hoot.folders._folders, folder => folder.path === pathName ), 'id' ) || 0,

            transVal      = this.schemaInput.property( 'value' ),
            typeVal       = this.typeInput.property( 'value' ),

            transCombo    = this.schemaInput.datum(),
            typeCombo     = this.typeInput.datum(),

            translation   = _filter( transCombo.data, o => o.NAME === transVal )[ 0 ],
            importType    = _filter( typeCombo.data, o => o.title === typeVal )[ 0 ],

            translationName,
            folderId;

        if ( translation.DEFAULT && ( translation.IMPORTPATH && translation.IMPORTPATH.length ) ) {
            translationName = translation.IMPORTPATH;
        } else {
            translationName = translation.NAME + '.js';
        }

        if ( newFolderName ) {
            folderId = await Hoot.folders.addFolder( pathName, newFolderName );
        } else {
            folderId = pathId;
        }


        let data = {
            NONE_TRANSLATION: translation.NONE === 'true',
            TRANSLATION: translationName,
            INPUT_TYPE: importType.value,
            INPUT_NAME: this.checkLayerName(layerName),
            formData: this.getFormData( this.fileIngest.node().files )
        };

        this.loadingState();

        this.processRequest = Hoot.api.uploadDataset( data )
            .then( resp => Hoot.message.alert( resp ) )
            .then( () => Hoot.layers.refreshLayers() )
            .then( () => this.updateLinks( layerName, folderId ) )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .catch( err => Hoot.message.alert( err ) )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }
    checkLayerName(layerName) {
        var matches = [];
        for (let i = 0; i < Hoot.layers.allLayers.length; i++) {
            var checkedLayer = Hoot.layers.allLayers[i].name;
            if (checkedLayer === layerName || new RegExp(layerName + '_\\d+').test(checkedLayer) ) {
                matches.push(checkedLayer);
            }
        }
        return matches.length ? `${layerName}_${matches.length}` : layerName;
    }

    updateLinks( layerName, folderId ) {
        return Hoot.folders.updateFolderLink( layerName, folderId )
            .then( () => Hoot.folders.refreshAll() );
    }

    /**
     *
     * @param files
     * @returns {FormData}
     */
    getFormData( files ) {
        let formData = new FormData();

        _forEach( files, ( file, i ) => {
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
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let importType = this.typeInput.node().value,
            self       = this;

        this.container.selectAll( '.text-input' )
            .each( function() {
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
        let comboData = this.container.select( '#importType' ).datum(),
            match     = _find( comboData.data, o => o.title === title );

        return match ? match.value : false;
    }

    /**
     * Update properties of the multipart upload input based on the selected import-type
     *
     * @param typeVal - value of selected import-type
     */
    setMultipartForType( typeVal ) {
        let uploader = d3.select( '#ingestFileUploader' );

        uploader
            .property( 'multiple', true )
            .attr( 'accept', null )
            .attr( 'webkitdirectory', null )
            .attr( 'directory', null );

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
                    .attr( 'accept', '.zip' );
            }
        } else if ( typeVal === 'GEONAMES' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.geonames, .txt' );
        } else if ( typeVal === 'OSM' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.osm, .osm.zip, .pbf' );
        } else if ( typeVal === 'FILE' ) {
            uploader
                .property( 'multiple', true )
                .attr( 'accept', '.shp, .shx, .dbf' );
        } else if ( typeVal === 'GEOJSON' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.geojson');
        }
    }
}
