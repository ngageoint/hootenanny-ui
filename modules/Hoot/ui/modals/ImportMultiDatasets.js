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
import _forEach            from 'lodash-es/forEach';
import ImportDataset       from './importDataset';
import { rateLimit }       from '../../config/apiConfig';
export default class ImportMultiDatasets {
    constructor( translations, path ) {
        this.folderList     = Hoot.folders.folderPaths;
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
            },
            {
                title: 'GeoJSON',
                value: 'GEOJSON'
            },
            {
                title: 'GeoPackage',
                value: 'GPKG'
            }
        ];
        this.jobIdList = [];
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

        if ( this.path ) {
            this.container.select( '#importPathName' ).property('value', this.path);
        }

        this.typeInput          = this.container.select( '#importType' );
        this.fileInput          = this.container.select( '#importFile' );
        this.fileListInput      = this.container.select( '#importFileList' );
        this.pathNameInput      = this.container.select( '#importPathName' );
        this.asSingleLayer      = this.container.select( '#importMultiAsSingle' );
        this.asSingleLayerName  = this.container.select( '#importMultiAsSingleName' );
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
        translationsList = _reject( this.translations, o => o.name === 'GeoNames' );

        schemaCombo.data = translationsList;

        // set parameters for uploader and repopulate translations list
        this.setMultipartForType( selectedType );
        this.formFactory.populateCombobox( this.schemaInput );
    }

    /**
     * Update the Single Layer component states
     */
    handleSingleLayerChange() {
        let toSingle = this.asSingleLayer.property('checked');
        this.asSingleLayerName.property('disabled', !toSingle);
        d3.select('#importMultiAsSingleName').classed('invalid', function() {
            return toSingle && d3.select(this).property('value').length === 0;
        });
        this.updateButtonState();
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
                zip: 0,
                geojson: 0,
                gpkg: 0
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
                    .text( Hoot.layers.checkLayerName( file.name ) );
            } );
        }

        this.formValid = true;
        this.updateButtonState();
    }

    setFileMetadata( fileName, typeCount, fileList ) {

        let fName = fileName.split('.')[0];

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
     * Validate user input to make sure it doesn't
     * contain un-allowed characters and isn't an empty string
     *
     * @param d - node data
     */
    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
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
     * De-duplicate input layer name
     * append a (#) if not unique
     *
     * @param d - node data
     */
    deduplicateName( d ) {
        let target = d3.select( `#${ d.id }` );
        target.property('value', Hoot.layers.checkLayerName( target.property('value') ));
    }

    /**
     * Submit form data
     */
    async handleSubmit() {
        let files         = this.fileIngest.node().files,
            pathName      = this.pathNameInput.property( 'value' ),
            newFolderName = this.newFolderNameInput.property( 'value' ),
            pathId        = _get( _find( Hoot.folders.folderPaths, folder => folder.path === pathName ), 'id' ),

            transVal      = this.schemaInput.property( 'value' ),
            typeVal       = this.typeInput.property( 'value' ),
            customSuffix  = this.customSuffixInput.property( 'value' ),

            transCombo    = this.schemaInput.datum(),
            typeCombo     = this.typeInput.datum(),

            translation   = _filter( transCombo.data, o => o.name === transVal || o.displayPath === transVal )[ 0 ],
            importType    = _filter( typeCombo.data, o => o.title === typeVal )[ 0 ],
            asSingle      = this.asSingleLayer.property('checked'),
            asSingleName  = this.asSingleLayerName.property('value'),

            translationIdentifier,
            folderId,
            fileCount = 0;

        //if no translation, set NONE
        if ( !translation ) {
            translation = { NONE: 'true' };
            translationIdentifier = '';
        }

        if ( translation.default ) {
            if ( translation.path && translation.path.length ) {
                translationIdentifier = translation.path;
            }
            else if ( translation.importPath && translation.importPath.length ) {
                translationIdentifier = translation.importPath;
            }
            else {
                translationIdentifier = translation.name + '.js';
            }
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

        if ( customSuffix ) {
            typeVal = '_' + customSuffix;
        }

        let fileNames = [];

        //if import as single layer, use new layer name
        if (asSingle) {
            fileNames.push(Hoot.layers.checkLayerName( asSingleName ));
        } else {
            this.fileListInput
                .selectAll( 'option' )
                .each( function() {
                    fileNames.push( this.value );
                } );
        }

        this.loadingState( fileNames.length );

        //If "as single layer" is checked the browser makes a single upload request with multiple files
        //otherwise it's an upload request per file
        //Use rate limit so as not to overwhelm the db connections


        const upload = (name) => {

            return new Promise( resolve => {

                let importFiles = files;

                if ( !asSingle ) {
                    //filter files by name if not merging to single layer
                    importFiles = _filter( files, file => {

                        let fName = file.name.split('.')[0];

                        return fName === name;
                    } );

                    if ( customSuffix ) {
                        name = name + '_' + customSuffix;
                    }

                    name =  Hoot.layers.checkLayerName( name );
                }

                let params = {
                    NONE_TRANSLATION: translation.NONE === 'true',
                    TRANSLATION: translationIdentifier,
                    INPUT_TYPE: importType.value,
                    INPUT_NAME: name,
                    formData: this.getFormData(importFiles),
                    folderId
                };

                Hoot.api.uploadDataset( params )
                    .then( resp => {
                        const jobId = resp.data[ 0 ].jobid;
                        this.jobIdList.push(jobId);
                        return Hoot.api.statusInterval( jobId );
                    })
                    .then( resp => {
                        // remove completed job from jobIdList
                        this.jobIdList.splice( this.jobIdList.indexOf( resp.data.jobId ), 1 );
                        fileCount++;
                        this.progressBar.property( 'value', fileCount );
                        this.fileListInput
                            .selectAll( asSingle ? 'option' : `option[value="${name}"]` )
                            .classed( 'import-success', resp.data.status !== 'cancelled' )
                            .classed( 'import-cancel', resp.data.status === 'cancelled' );
                        resolve();
                    })
                    .catch( err => {
                        console.error(err);

                        let message = `Error running import on ${name}\n`,
                            type = err.type,
                            keepOpen = true;

                        if (typeof err.data === 'string') {
                            message = err.data;
                        }

                        if (err.data instanceof Object && err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                            message = err.data.commandDetail[0].stderr;
                        }

                        Hoot.message.alert( { message, type, keepOpen } );
                    });
            });
        };
        //approach described here https://stackoverflow.com/a/51020535
        async function doWork(iterator) {
            for (let [index, item] of iterator) {
                await upload(item);
            }
        }
        const iterator = Object.entries(fileNames);
        const workers = new Array(rateLimit).fill(iterator).map(doWork);

        this.processRequest = Promise.allSettled(workers)
            .then( resp => {
                let statuses = resp.reduce((map, obj) => {
                    if (map[obj.status]) {
                        map[obj.status]++;
                    } else {
                        map[obj.status] = 1;
                    }
                    map.total++;

                    return map;
                }, {total: 0});
                Hoot.message.alert( {
                    message: (statuses.cancelled) ? `${statuses.cancelled} of ${statuses.total} dataset imports cancelled` :'All datasets successfully imported',
                    type: (statuses.cancelled) ? 'warn' : 'success'
                } );
            })
            .then( () => Hoot.folders.refreshAll() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            });
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

    loadingState( fileCount ) {
        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.submitButton
            .select( 'span' )
            .classed( 'label', true )
            .text( 'Cancel Import' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            this.jobIdList.forEach( jobId => Hoot.api.cancelJob( jobId ) );
            this.submitButton
                .select( 'span' )
                .text( 'Cancelling...' );

        } );

        this.submitButton.insert('i', 'span')
            .classed('material-icons', true)
            .text('cancel');

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );

        this.progressContainer.classed( 'hidden', false );

        this.progressBar = this.progressContainer
            .append( 'span' )
            .append( 'progress' )
            .classed( 'hoot-form-field', true )
            .property( 'value', 0 )
            .attr( 'max', fileCount );
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let importType = this.typeInput.property('value'),
            importList = this.fileListInput.node().length,
            self       = this;

        this.formValid = importType.length > 0 && importList > 0;

        this.container.selectAll( '.text-input' )
            .each( function() {
                if ( d3.select( this ).classed('invalid')) {
                    self.formValid = false;
                }
            } );

        this.submitButton.property('disabled', !this.formValid);
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

        const importMap = ImportDataset.importTypeMap();

        uploader
            .property( 'multiple', true )
            .attr( 'accept', importMap[ typeVal ] );
    }
}
