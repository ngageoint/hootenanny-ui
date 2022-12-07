/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _filter  from 'lodash-es/filter';
import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _reject  from 'lodash-es/reject';

import FormFactory from '../../tools/formFactory';
import { getBrowserInfo, unallowableWordsExist } from '../../tools/utilities';
import { importSingleForm } from '../../config/domMetadata';
import _get from 'lodash-es/get';
import axios from 'axios/dist/axios';


/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class ImportDataset {
    constructor( translations, path ) {
        this.folderList     = Hoot.folders.folderPaths;
        this.translations   = translations;
        this.browserInfo    = getBrowserInfo();
        this.formFactory    = new FormFactory();
        this.processRequest = null;
        this.path           = path;
        this.cancelToken    = axios.CancelToken.source();

        // Add "NONE" option to beginning of array
        this.translations.unshift( {
            name: 'NONE',
            path: 'NONE',
            displayPath: 'NONE',
            description: 'No Translations',
            none: 'true'
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
                title: 'File (geojson, geojson.zip)',
                value: 'GEOJSON'
            },
            {
                title: 'File (geonames, txt)',
                value: 'GEONAMES'
            },
            {
                title: 'File (GeoPackage, gpkg)',
                value: 'GPKG'
            },
            {
                title: 'Directory (FGDB)',
                value: 'DIR'
            },
            {
                title: 'Remote URL (zip)',
                value: 'URL'
            }
        ];
    }

    static importTypeMap() {
        return {
            'DIR': null,
            'GEONAMES': '.geonames, .txt',
            'OSM': '.osm, .osm.zip, .pbf',
            'FILE': '.shp, .shx, .dbf, .prj, .zip',
            'GEOJSON': '.geojson, .geojson.zip',
            'GPKG': '.gpkg',
        };
    }

    /**
     * Set form parameters and create the form using the form factory
     */
    async render() {
        this.form           = importSingleForm.call( this );
        this.form[ 0 ].data = this.importTypes;

        //Add advanced options to form
        this.advOpts = await Hoot.api.getAdvancedImportOptions();
        this.advOpts.forEach(opt => {
            opt.hidden = true;
        });

        this.form = this.form.concat(this.advOpts.map(this.formFactory.advOpt2DomMeta));

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

        if ( this.path ) {
            this.container.select( '#importPathName' ).property('value', this.path);
        }

        this.typeInput          = this.container.select( '#importType' );
        this.fileInput          = this.container.select( '#importFile' );
        this.urlInput           = this.container.select( '#importUrl' );
        this.urlUsername        = this.container.select( '#importRemoteUsername' );
        this.urlPassword        = this.container.select( '#importRemotePassword' );
        this.layerNameInput     = this.container.select( '#importLayerName' );
        this.pathNameInput      = this.container.select( '#importPathName' );
        this.newFolderNameInput = this.container.select( '#importNewFolderName' );
        this.schemaInput        = this.container.select( '#importSchema' );
        this.fileIngest         = this.container.select( '#ingestFileUploader' );
        this.submitButton       = this.container.select( '#importSubmitBtn' );
        this.advOptsInputs      = this.container.selectAll( '.advOpt' );

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
        this.urlInput.property( 'value', '' );
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
            translationsList = _filter( this.translations, o => o.name === 'GeoNames' );
        } else {
            translationsList = _reject( this.translations, o => o.name === 'GeoNames' );
        }

        // Show input data files except for remote url
        let isRemote = selectedType === 'URL';
        ['#importUrl', '#importRemoteUsername', '#importRemotePassword']
            .forEach(d => this.container.select(d + '_container').classed('hidden', !isRemote));
        this.container.select('#importFile_container').classed('hidden', isRemote);


        schemaCombo.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.formFactory.populateCombobox( this.schemaInput );

        this.schemaInput.property( 'value', translationsList[ 0 ].name );

        // wish this could be expressed in the import opts from the server
        // but we need this hack right now to make the advanced import options
        // only available for ogr types

        function isOgr(type) {
            return ['FILE', 'GPKG', 'DIR', 'GEOJSON'].indexOf(type) > -1;
        }

        this.advOptsInputs.classed('hidden', !isOgr(selectedType));
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

        let saveName;
        if ( selectedType === 'DIR' ) {
            // Get the first file just to get the directory name since it should be same as rest of the files
            const relativePath = files[0].webkitRelativePath;
            saveName = relativePath.split('/')[0];
        } else {
            saveName = fileNames[ 0 ];
        }

        saveName = saveName.indexOf( '.' ) ? saveName.substring( 0, saveName.indexOf( '.' ) ) : saveName;
        this.fileInput.property( 'value', fileNames.join( '; ' ) );
        this.urlInput.property( 'value', '' );
        this.layerNameInput.property( 'value', Hoot.layers.checkLayerName(saveName) );

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
                isGEOJSON: false,
                isGPKG: false
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
        } else if ( fileName.lastIndexOf( '.gpkg' ) > -1 ) {
            typeCount.gpkg++;
            fObj.isGPKG = true;
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

        // Disable warning about import file size
        // if ( totalFileSize > ingestThreshold ) {
        //     let thresholdInMb = Math.floor( ingestThreshold / 1000000 );

        //     let message = `The total size of ingested files are greater than ingest threshold size of ${ thresholdInMb } MB and it may have problem. Do you wish to continue?`;

        //     return Hoot.message.confirm( message );
        // } else {
            return true;
        // }
    }

    /**
     * Validate URL remote data input
     *
     * @param d - node data
     */
    handleUrlChange( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            allowedPattern = new RegExp( /^(https?:\/\/|s?ftps?:\/\/|s3:\/\/)/ ),
            valid            = true;

        if ( !allowedPattern.test( str ) ) {
            valid = false;
        }

        if ( d.required && !str.length ) {
            valid = false;
        }

        if (valid) {
            //clear out and file upload
            this.fileInput.property( 'value', '' );
            this.fileIngest.property('value', '');
            let saveName = str.substring( str.lastIndexOf('/')+1, str.lastIndexOf('.') );
            this.layerNameInput.property( 'value', Hoot.layers.checkLayerName(saveName) );
            this.schemaInput.node().disabled = false;
            this.schemaInput.property( 'value', this.translations[ 0 ].name );
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
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

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( unallowableWordsExist( str ) || unallowedPattern.test( str ) ) {
            valid = false;
        }

        if ( d.required && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * If adv opt inputs not hidden, compares state of
     * advanced options to defaults and
     * adds to import params if different
     */
    getAdvOpts() {
        let that = this;
        let advParams = [];

        this.advOpts.forEach(function(d) {
            let inputIsHidden = that.container.select('#' + d.id + '_container').classed('hidden');
            let propName;
            switch (d.input) {
                case 'checkbox':
                    propName = 'checked';
                    break;
                case 'text':
                default:
                    propName = 'value';
                    break;
            }
            let inputValue = that.container.select('#' + d.id).property(propName).toString();

            // Need .length check because empty text box should be considered equal to default
            if ( !inputIsHidden && (inputValue.length && inputValue !== d.default) ) {
                advParams.push(d.id + '=' + inputValue);
            }
        });

        return advParams;
    }

    /**
     * Submit form data
     */
    async handleSubmit() {
        let layerName     = this.layerNameInput.property( 'value' ),
            url           = this.urlInput.property( 'value' ),
            remoteUser    = this.urlUsername.property( 'value' ),
            remotePw      = this.urlPassword.property( 'value' ),
            pathName      = this.pathNameInput.property( 'value' ),
            newFolderName = this.newFolderNameInput.property( 'value' ),
            pathId        = _get( _find( Hoot.folders.folderPaths, folder => folder.path === pathName ), 'id' ),

            transVal      = this.schemaInput.property( 'value' ),
            typeVal       = this.typeInput.property( 'value' ),

            transCombo    = this.schemaInput.datum(),
            typeCombo     = this.typeInput.datum(),

            translation   = _filter( transCombo.data, o => o.name === transVal || o.displayPath === transVal )[ 0 ],
            importType    = _filter( typeCombo.data, o => o.title === typeVal )[ 0 ],

            translationIdentifier,
            folderId;

        if ( translation.default ) {
            translationIdentifier = translation.path || translation.importPath;
        } else if ( translation.id ) {
            translationIdentifier = translation.id;
        } else {
            translationIdentifier = translation.name + '.js';
        }

        if ( newFolderName ) {
            folderId = (await Hoot.folders.addFolder( pathName, newFolderName )).folderId;
        } else if ( pathId ) {
            folderId = pathId;
        } else {
            Hoot.message.alert( { message: 'Need to specify a path or enter name for new folder!', type: 'error' } );
            return;
        }

        let data = {
            NONE_TRANSLATION: translation.none === 'true',
            TRANSLATION: translationIdentifier,
            INPUT_NAME: Hoot.layers.checkLayerName( layerName ),
            ADV_UPLOAD_OPTS: this.getAdvOpts(),
            folderId
        };

        this.loadingState();

        //remote url or file upload
        if (url) {
            data.URL = url;
            data.USERNAME = remoteUser;
            data.PASSWORD = remotePw;
        } else {
            data.INPUT_TYPE = importType.value;
            data.formData = this.getFormData( this.fileIngest.node().files );
        }

        this.processRequest = Hoot.api.import( data, this.cancelToken.token )
        .then( resp => {
            this.jobId = resp.data[ 0 ].jobid;
            return Hoot.api.statusInterval( this.jobId );
        } )
        .then( async resp => {
            let message;

            if (resp.data && resp.data.status === 'cancelled') {
                message = 'Import job cancelled';

                // Delete the newly created folder
                if ( newFolderName ) {
                    await Hoot.api.deleteFolder( folderId );
                    await Hoot.folders.removeFolder( folderId );
                }

                this.submitButton
                    .select( 'span' )
                    .text( 'Import' );
            } else {
                message = 'Import job complete';
            }

            Hoot.message.alert( {
                data: resp.data,
                message: message,
                status: 200,
                type: resp.type
            } );

            return resp;
        } )
        .then( () => Hoot.folders.refreshAll() )
        .then( () => Hoot.events.emit( 'render-dataset-table' ) )
        .catch( err => {
            console.error(err);

            if ( err.message === 'Request cancelled.' ) {
                Hoot.message.alert( {
                    message: err.message,
                    type: 'warn'
                } );

            } else {

                let message = 'Error running import',
                type = err.type,
                keepOpen = true;

                if ( err.data ) {
                    if (typeof err.data === 'string') {
                        message = err.data;
                    }

                    if (err.data instanceof Object && err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                        message = err.data.commandDetail[0].stderr;
                    }
                }

                Hoot.message.alert( { message, type, keepOpen } );
            }
        } )
        .finally( () => {
            this.container.remove();
            Hoot.events.emit( 'modal-closed' );
        } );


    }

    /**
     *
     * @param files
     * @returns {FormData}
     */
    getFormData( files ) {
        let formData = new FormData();

        _forEach( files, ( file, i ) => {
            formData.append( `etluploadfile${ i }`, file );
        } );

        return formData;
    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .classed( 'label', true )
            .text( 'Cancel Import' );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            if ( this.jobId ) {
                Hoot.api.cancelJob(this.jobId);
            }
            else {
                this.cancelToken.cancel('Request cancelled.');
            }
        } );

        this.submitButton.insert('i', 'span')
            .classed('material-icons', true)
            .text('cancel');

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
        const importMap = ImportDataset.importTypeMap();
        const allowMultiple = [ 'FILE', 'GPKG' ];

        uploader
            .property( 'multiple', allowMultiple.includes( typeVal ) )
            .attr( 'accept', importMap[ typeVal ] )
            .attr( 'webkitdirectory', typeVal === 'DIR' ? '' : null )
            .attr( 'directory', typeVal === 'DIR' ? '' : null );
    }
}
