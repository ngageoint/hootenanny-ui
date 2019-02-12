/** ****************************************************************************************************
 * File: ImportMultiDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong on 1/23/19
 *******************************************************************************************************/

import { importMultiForm } from '../../config/domMetadata';
import _reject             from 'lodash-es/reject';
import FormFactory         from '../../tools/formFactory';
import _filter             from 'lodash-es/filter';
import _find               from 'lodash-es/find';
import _get                from 'lodash-es/get';
import _map                from 'lodash-es/map';
import _forEach            from 'lodash-es/forEach';

export default class ImportMultiDatasets {
    constructor( translations, path = 'root' ) {
        this.folderList     = Hoot.folders._folders;
        this.translations   = translations;
        this.formFactory    = new FormFactory();
        this.processRequest = null;
        this.path = path;
        this.importTypes = [
            {
                title: 'Shapefile',
                value: 'FILE'
            },
            {
                title: 'OSM or PBF',
                value: 'OSM'
            }
        ];
    }

    /**
     * Set form parameters and create the form using the form factory
     */
    render() {
        this.form           = importMultiForm.call( this );
        this.form[ 0 ].data = this.importTypes;

        let metadata = {
            title: 'Import Multiple Datasets',
            form: this.form,
            button: {
                text: 'Import',
                location: 'right',
                id: 'importSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };


        this.container = this.formFactory.generateForm( 'body', 'datasets-import-form', metadata );

        if (this.path !== 'root') {
            this.container.select( '#importPathName' ).property('value', this.path);
        }
        
        this.typeInput          = this.container.select( '#importType' );
        this.fileInput          = this.container.select( '#importFile' );
        this.fileListInput      = this.container.select( '#importFileList' );
        this.pathNameInput      = this.container.select( '#importPathName' );
        this.newFolderNameInput = this.container.select( '#importNewFolderName' );
        this.schemaInput        = this.container.select( '#importSchema' );
        this.customSuffixInput  = this.container.select( '#importCustomSuffix' );
        this.fileIngest         = this.container.select( '#ingestFileUploader' );
        this.submitButton       = this.container.select( '#importSubmitBtn' );

        this.progressContainer = this.container
            .select( '.modal.hoot-menu' )
            .append( 'div' )
            .attr( 'id', 'importProgressBar' )
            .classed( 'progress-bar hidden', true );

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
        this.schemaInput.property( 'value', '' );

        // enable input if a type is selected
        if ( !selectedType ) {
            this.fileInput.node().disabled   = true;
            this.schemaInput.node().disabled = true;
        } else {
            this.fileInput.node().disabled   = false;
            this.schemaInput.node().disabled = false;
        }

        // filter out geoname translations
        translationsList = _reject( this.translations, o => o.NAME === 'GEONAMES' );

        schemaCombo.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.formFactory.populateCombobox( this.schemaInput );
    }

    /**
     * Update the file input's value with the name of the selected file
     */
    async handleMultipartChange() {
        this.fileListInput.selectAll( 'option' ).remove();

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

            this.setFileMetadata( fileName, typeCount, fileList );
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
            this.fileInput.property( 'value', fileNames.join( '; ' ) );

            _forEach( fileList, file => {
                this.fileListInput
                    .append( 'option' )
                    .classed( 'file-import-option', true )
                    .attr( 'value', file.name )
                    .text( file.name );
            } );
        }

        this.formValid = true;
        this.updateButtonState();
    }

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
                isZIP: false
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
        let pathName      = this.pathNameInput.property( 'value' ),
            newFolderName = this.newFolderNameInput.property( 'value' ),
            pathId        = _get( _find( Hoot.folders._folders, folder => folder.path === pathName ), 'id' ) || 0,

            transVal      = this.schemaInput.property( 'value' ),
            typeVal       = this.typeInput.property( 'value' ),

            transCombo    = this.schemaInput.datum(),
            typeCombo     = this.typeInput.datum(),

            translation   = _filter( transCombo.data, o => o.DESCRIPTION === transVal )[ 0 ],
            importType    = _filter( typeCombo.data, o => o.title === typeVal )[ 0 ],

            translationName,
            folderId;

        //if no translation, set NONE
        if ( !translation ) {
            translation = { NONE: 'true' };
            translationName = '';
        }
        if ( translation.DEFAULT ) {
            if ( translation.PATH && translation.PATH.length || translation.IMPORTPATH && translation.IMPORTPATH.length ) {
                translationName = translation.PATH;
            } else {
                translationName = translation.NAME + '.js';
            }
        } else {
            translationName = translation.NAME + '.js';
        }

        if ( newFolderName ) {
            folderId = await Hoot.folders.addFolder( pathName, newFolderName );
        } else {
            folderId = pathId;
        }

        let fileNames = [];

        this.fileListInput
            .selectAll( 'option' )
            .each( function() {
                fileNames.push( this.value );
            } );

        this.loadingState( fileNames.length );

        let proms = _map( fileNames, name => {
            return new Promise( resolve => {
                let importFiles = _filter( this.fileIngest.node().files, file => {
                    let fName = file.name.substring( 0, file.name.length - 4 );

                    if ( file.name.toLowerCase().indexOf( '.shp.xml' ) > -1 ) {
                        fName = file.name.substring( 0, file.name.length - 8 );
                    }

                    return fName === name;
                } );

                let params = {
                    NONE_TRANSLATION: translation.NONE === 'true',
                    TRANSLATION: translationName,
                    INPUT_TYPE: importType.value,
                    INPUT_NAME: name,
                    formData: this.getFormData( importFiles )
                };

                Hoot.api.uploadDataset( params )
                    .then( () => resolve( name ) );
            } );
        } );

        this.processRequest = this.allProgress( proms, ( n, fileName ) => {
                this.progressBar.property( 'value', n );
                this.fileListInput
                    .select( `option[value="${fileName}"]` )
                    .classed( 'import-success', true );
            } )
            .then( () => Hoot.message.alert( {
                message: 'All datasets successfully imported',
                type: 'success'
            } ) )
            .then( () => Hoot.layers.refreshLayers() )
            .then( () => Promise.all( _map( fileNames, name => this.updateLinks( name, folderId ) ) ) )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .catch( err => Hoot.message.alert( err ) )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }

    allProgress( proms, cb ) {
        let n = 0;

        cb( 0 );

        proms.forEach( p => {
            p.then( fileName => {
                n++;
                cb( n, fileName );
            } );
        } );

        return Promise.all( proms );
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

    loadingState( fileCount ) {
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

        this.progressContainer.classed( 'hidden', false );

        this.progressBar = this.progressContainer
            .append( 'span' )
            .append( 'progress' )
            .classed( 'form-field', true )
            .property( 'value', 0 )
            .attr( 'max', fileCount );
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

        if ( typeVal === 'OSM' ) {
            uploader
                .property( 'multiple', true )
                .attr( 'accept', '.osm, .osm.zip, .pbf' );
        } else if ( typeVal === 'FILE' ) {
            uploader
                .property( 'multiple', true )
                .attr( 'accept', '.shp, .shx, .dbf' );
        }
    }
}
