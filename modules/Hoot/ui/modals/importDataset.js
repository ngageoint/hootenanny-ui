/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _filter  from 'lodash-es/filter';
import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _reject  from 'lodash-es/reject';
import _remove  from 'lodash-es/remove';

import FormFactory        from '../../tools/formFactory';
import { getBrowserInfo } from '../../tools/utilities';
import { d3combobox } from '../../../lib/hoot/d3.combobox';

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
        this.advancedOptions = [];

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
                title: 'File (GeoPackage, gpkg)',
                value: 'GPKG'
            },
            {
                title: 'Directory (FGDB)',
                value: 'DIR'
            }
        ];
    }

    async init() {

        let that = this;
        if ( !this.advancedOptions.length ) {
            this.advancedOptions = await Hoot.api.getAdvancedOptions('hoot2');
            // return Promise.resolve( this.advancedOptions );
            // this.render( _cloneDeep(this.advancedOptions) );
            return this.advancedOptions;
        }
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
        this.simplifyBuildings  = this.container.select( '#simplifyBuildings' );
        this.submitButton       = this.container.select( '#importSubmitBtn' );

        this.createAdvancedUploadContainer();
        this.createHeader();
        this.createContentDiv();
        this.advancedUploadOptions( this.advancedOptions );

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
                this.advancedUploadOptions();
            }
        }

        let valid = await this.validateLoaded( selectedType, fileList, totalFileSize );

        if ( !valid ) {
            this.formValid = false;
            this.updateButtonState( selectedType );

            return;
        }

        if ( selectedType === 'DIR' ) {
            //TODO: get back to this
        } else {
            let firstFile = fileNames[ 0 ],
                saveName  = firstFile.indexOf( '.' ) ? firstFile.substring( 0, firstFile.indexOf( '.' ) ) : firstFile;

            this.fileInput.property( 'value', fileNames.join( '; ' ) );

            this.layerNameInput.property( 'value', Hoot.layers.checkLayerName(saveName) );
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

        if ( d.required && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    createAdvancedUploadContainer() {
        this.form = this.container.append( 'div' )
            .attr( 'id', 'advanced-opts-panel' )
            .classed( 'fill-white', true )
            .style( 'margin-left', () => this.container.node().getBoundingClientRect().width = 'px'  );

        this.overlay = d3.select( '#content' ).append( 'div' )
            .classed( 'map-overlay overlay', true );
    }

    createHeader() {

        let header = this.form
            .append( 'div' )
            .classed( 'advanced-opts-header big keyline-bottom flex justify-between align-center', true );

        header
            .append( 'div' )
            .classed( 'title', true )
            .text( 'Advanced Upload Options' );

        // reset button
        header
            .append( 'div' )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong', true )
            .text( 'Reset' )
            .on( 'click', () => this.advancedUploadOptions() );
    }

    createContentDiv() {
        this.contentDiv = this.form
            .append( 'div' )
            .classed( 'advanced-opts-content', true )
            .style( 'opacity', 0 );

        this.contentDiv
            .transition()
            .duration( 400 )
            .style( 'opacity', 1 );
    }

    toggleOption(d, shouldHide) {
        let label = d3.select( `${d.name}_label` ),
            parent = d3.select( `${d.name}_group`);

        parent
            .select( '.group-toggle-caret-wrap' )
            .classed('toggle-disabled', shouldHide );

        label
            .classed( 'adv-opt-title-disabled', !label.classed( 'adv-opt-title-disabled' ));

        if (shouldHide) {
            parent.select( '.gorup-body')
                .classed( 'hidden', true );
        }

    }

    innerWrap(toggleInput, toggleOption) {
        let d = toggleInput.datum(),
            innerWrap = toggleInput.selectAll( '.adv-opts-inner-wrap' )
                .data( [0] );

        innerWrap.exit().remove();

        let innerWrapEnter = innerWrap.enter()
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap adv-opts-input', true );

        innerWrap = innerWrap.merge(innerWrapEnter);

        let innerWrapLeft = innerWrap.selectAll( '.adv-opts-inner-wrap-left' )
            .data( [0] );

        innerWrapLeft.exit().remove();

        let innerWrapLeftEnter = innerWrapLeft.enter()
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap-left', true );

        if ( d.name === 'Buildings' ) {
            let innerInput = innerWrapLeft.selectAll( '.conflate-type-toggle' )
                .data( [d] );

            innerInput.exit().remove();

            let innerInputEnter = innerInput.enter()
                .append( 'input' )
                .attr( 'type', 'checkbox' )
                .attr( 'id', d => `${d.name}-toggle` )
                .classed( 'conflate-type-toggle', true );

            innerInput.merge(innerInputEnter)
                .property( 'checked', true )
                .on( 'click', toggleOption );
        }

        let innerLabelWrap = innerWrap.selectAll( '.adv-opt-title-wrap' )
            .data( [ d ] );

        innerLabelWrap.exit().remove();

        let innerLabelWrapEnter = innerLabelWrap.enter()
            .append( 'div' )
            .classed( 'adv-opt-title-wrap', true );

        innerLabelWrap = innerLabelWrap.merge(innerLabelWrapEnter);

        innerLabelWrap
            .on( 'click', d => {
                let toggle = d3.select( `${d.name}-toggle` ),
                    checked = toggle.property( 'checked' );

                toggle.property( 'checked', !checked );

                toggleOption( d, checked );

            } );

        let innerLabel = innerLabelWrap.selectAll( '.adv-opt-title' )
            .data( [d] );

        innerLabel.exit().remove();

        let innerLabelEnter = innerLabel.enter()
            .append( 'span' )
            .classed( 'adv-opt-title', true );

        innerLabelEnter.merge(innerLabelEnter)
            .attr( 'id', d => `${d.name}_label` )
            .classed( 'adv-opt-title-diabled', false )
            .text( d => `${d.label} Options` );
    }

    caretWrap(toggleInput) {

        let d = toggleInput.datum(),
            caretWrap = toggleInput
                .selectAll( '.group-toggle-caret-wrap' )
                .data( [d] );

        caretWrap.exit().remove();

        let caretWrapEnter = caretWrap.enter()
            .append( 'div' )
            .classed( 'group-toggle-caret-wrap', true )
            .append( 'div' )
            .attr( 'class', 'adv-opt-toggle' )
            .classed( 'combobox-caret', d => d.members.length )
            .on( 'click', function(d) {
                if (d.members.length) {
                    let body = d3.select( `${d.name}_group` ).select('.group-body'),
                        bodyState = body.classed( 'hidden' );

                        body.classed( 'hidden', !bodyState );
                        body.classed( 'keyline-bottom', bodyState );
                }
            } );
            caretWrap.merge(caretWrapEnter);

    }

    fieldLabel(fieldContainer) {
        let d = fieldContainer.datum(),
            fieldLabelWrap = fieldContainer
                .selectAll( '.hoot-field-label-wrap' )
                .data( [ d ] );

            fieldLabelWrap.exit().remove();

            let fieldLabelWrapEnter = fieldLabelWrap.enter()
                .append( 'div' )
                .classed( 'hoot-field-label-wrap', true );

            fieldLabelWrap = fieldLabelWrap.merge(fieldLabelWrapEnter);

            fieldLabelWrap
                .attr( 'id', d => `${d.id}-label-wrap` )
                .classed( 'adv-opts-header fill-light keyline-bottom round-top', true )
                .classed( 'keyline-bottom', d => d.input !== 'checkbox' )
                .classed( 'round-left hoot-field-title-checkbox-wrap keyline-right', d => d.input === 'checkbox' );

            let fieldLabel = fieldLabelWrap.selectAll( '.hoot-field-label' )
                .data( [d] );

            fieldLabel.exit().remove();

            let fieldLabelEnter = fieldLabel.enter()
                .append( 'label' )
                .classed( 'hoot-field-label', true )
                .text( d => d.label );

            fieldLabel.merge(fieldLabelEnter);
    }

    fieldInput(fieldContainer, isCleaning) {
        let d = fieldContainer.datum(),
            fieldInputWrap = fieldContainer
                .selectAll( '.hoot-field-input-wrap' )
                .data([ d ]);

        fieldInputWrap.exit().remove();

        let fieldInputWrapEnter = fieldInputWrap.enter()
            .append('div')
            .classed( 'hoot-field-input-wrap', true);

        fieldInputWrap = fieldInputWrap.merge(fieldInputWrapEnter);

        fieldInputWrap
            .classed( 'hoot-field-input-checkbox-wrap', d => d.input === 'checkbox' );

        let fieldInput = fieldInputWrap.selectAll( '.hoot-field-input' )
            .data( [ d ] );

        fieldInput.exit().remove();

        let fieldInputEnter = fieldInput.enter()
            .append( 'input' )
            .attr( 'class', 'hoot-field-input' )
            .attr( 'type', d => d.input === 'checkbox' ?  'checkbox' : 'text' ); // combobox & text get text input...

        fieldInput = fieldInput.merge(fieldInputEnter);

        fieldInput
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'disabled', d => d.disabled )
            .attr( 'readonly', d => d.readonly )
            .property( 'checked', isCleaning );

        const type = fieldInput.datum().input;
        if ( type === 'checkbox' ) {
            fieldInput
                .property( 'checked', d => d.default === 'true' )
                .on( 'click', function(d) {
                    d.send = JSON.parse( d.default ) !== d3.select( this ).property( 'checked' );
                });
        } else {
            fieldInput
                .property( 'value', d => d.default );

            if ( type === 'combobox' ) {
                let d = fieldInput.datum(),
                    comboData = _map(d.data, n => {
                    const t = d.itemKey ? n[ d.itemKey ] : n,
                        v = d.valueKey ? n[ d.valueKey ] : t;
                        return { value: v, title: t };
                } );

                if ( d.sort ) {
                    comboData = comboData.sort((a, b) => {
                        let textA = a.value.toLowerCase(),
                            textB = b.value.toLowerCase();

                        return textA < textB ? -1 : textA > textB ? 1 : 0;
                    } );
                }

                if ( d.class === 'path-name' ) {
                    comboData = [ { value: 'root', title: 0 } ].concat(comboData);
                }

                fieldInput
                    .classed( 'form-field-combo-input', true )
                    .attr( 'autocomplete', 'off' )
                    .call(d3combobox().data( comboData ))
                    .on( 'change', function(d) {
                        d.send =  d3.select( this ).property( 'value' ) !== d.default;
                    })
                    .on( 'keyup', function(d) {
                        d.send =  d3.select( this ).property( 'value' ) !== d.default;
                    });

            } else { // text input...
                fieldInput
                    .classed( 'text-input', true)
                    .on( 'keyup', function(d) {
                        let value = d3.select( this ).property( 'value' );
                        d.send = value !== d.default;
                        if ([ 'double', 'int', 'long' ].indexOf ( d.type ) !== -1 ) {
                            d3.select( `#${d.id}-label-wrao` )
                                .call(self.notNumber, value);
                        }
                    });
            }

        }

    }

    notNumber(selection, value) {
        let isNumber = !isNaN( value ),
            notNumber = selection
                .selectAll( '.not-number-warning' )
                .data([ 0 ]);

        let notNumberEnter = notNumber.enter()
            .append( 'span' )
            .classed( 'not-number-warning', true );

        notNumber = notNumber.merge(notNumberEnter);
        notNumber.classed( 'hidden', isNumber );

        if ( notNumber.selectAll( '.tooltip' ).empty() ) {
            notNumber
                .call(svgIcon('#iD-icon-alert', 'deleted'))
                .call(tooltip().title('this option must be a number!'));

            notNumber.selectAll( '.tooltip-arrow' )
                .classed( 'hidden', true );

            notNumber.selectAll( '.tooltip-inner' )
                .style( 'background-color', 'rgba(0,0,0,0)')
                .style( 'border', 'none');

        }

        notNumber.dispatch( isNumber ? 'mouseleave' : 'mouseenter' );
    }

    /**
     * Update the Single Layer component states
     */
    advancedUploadOptions(advOpts) {

        let that = this,
            group = this.contentDiv
                .selectAll( '.form-group' )
                .data( advOpts );

        group.exit().remove();

        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true )
            .attr( 'id', d => `${d.name}_group`);

        group = group.merge(groupEnter);

        group.each(function(d) {
            let group = d3.select( this ),
                groupToggle = group.selectAll( '.group-toggle' )
                    .data( [0] );

            groupToggle.exit().remove();

            let groupToggleEnter = groupToggle.enter()
                .append( 'div' )
                .classed( 'group-toggle', true );

            groupToggle = groupToggle.merge(groupToggleEnter);

            let toggleWrap = groupToggle.selectAll( '.inner-wrap' )
                .data( [d] );

            toggleWrap.exit().remove();

            let toggleWrapEnter = toggleWrap.enter()
                .append( 'div' )
                .attr( 'class', 'inner-wrapper strong fill-light keyline-bottom adv-opts-toggle-wrap' )
                .attr( 'id', d => `${d.name}-wrap` );

            toggleWrap = toggleWrap.merge(toggleWrapEnter);

            toggleWrap
                .call(that.innerWrap, that.toggleOption)
                .call(that.caretWrap);

            if ( d.name === 'Buildings' ) {
                let simplifyBuildings = d3.select( '#simplifyBuildings' ).property( 'value' ) === 'Buildings';
                group.select( '.adv-opt-title' )
                    .classed( 'adv-opt-title-disabled', !simplifyBuildings );

                group.select( '.adv-opt-toggle' )
                    .classed( 'toggle-disabled', !simplifyBuildings );
            }

            let groupBody = group.selectAll( '.group-body' )
                .data( [d] );

            groupBody.exit().remove();

            let groupBodyEnter = groupBody.enter()
                .append( 'div' )
                .classed( 'group-body fill-white', true );

            groupBody = groupBody.merge(groupBodyEnter);

            groupBody
                .classed( 'hidden', true );

            let fieldContainer = groupBody.selectAll( '.hoot-form-field' )
                .data( d => d.members );

            fieldContainer.exit().remove();

            let fieldContainerEnter = fieldContainer.enter()
                .append( 'div' )
                .attr( 'id', d => d.id )
                .classed( 'hoot-form-field small contain keyline-all round', true );

            fieldContainer = fieldContainer.merge(fieldContainerEnter);

            fieldContainer
                .classed( 'hoot-form-field-wrap', true )
                .classed( 'hoot-form-field-checkbox', d => d.input === 'checkbox' )
                .classed( 'hoot-form-field-input', d => d.input !== 'checkbox' );


            fieldContainer.each(function(d) {
                let fieldContainer = d3.select( this );

                fieldContainer
                    .call(that.fieldLabel);
            });


        });


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
            simplifyBuildings = this.handleBuildings.property('checked'),
            importType    = _filter( typeCombo.data, o => o.title === typeVal )[ 0 ],

            translationName,
            folderId;

        if ( translation.DEFAULT && ( translation.PATH && translation.PATH.length ) ) {
            translationName = translation.PATH;
        } else {
            translationName = translation.NAME + '.js';
        }

        if ( newFolderName ) {
            folderId = (await Hoot.folders.addFolder( pathName, newFolderName )).folderId;
        } else {
            folderId = pathId;
        }

        if ( simplifyBuildings ) {
            console.log('simplify buildings');

        }

        let data = {
            NONE_TRANSLATION: translation.NONE === 'true',
            TRANSLATION: translationName,
            INPUT_TYPE: importType.value,
            INPUT_NAME: Hoot.layers.checkLayerName( layerName ),
            formData: this.getFormData( this.fileIngest.node().files ),
            folderId
        };

        this.processRequest = Hoot.api.uploadDataset( data )
            .then( resp => {
                this.loadingState();

                this.jobId = resp.data[ 0 ].jobid;

                return Hoot.api.statusInterval( this.jobId );
            } )
            .then( resp => {
                let message;
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Import job cancelled';

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

                let message = 'Error running import',
                    type = err.type,
                    keepOpen = true;

                if (err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                    message = err.data.commandDetail[0].stderr;
                }

                Hoot.message.alert( { message, type, keepOpen } );

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

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            Hoot.api.cancelJob(this.jobId);
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

        if ( match.value === 'FILE' ) {
            this.init();
            this.advancedUploadOptions( this.advancedOptions );
        }

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
                .attr( 'accept', '.shp, .shx, .dbf, .prj' );
        } else if ( typeVal === 'GEOJSON' ) {
            uploader
                .property( 'multiple', false )
                .attr( 'accept', '.geojson');
        } else if ( typeVal === 'GPKG' ) {
            uploader
                .property( 'multiple', true)
                .attr( 'accept', '.gpkg');
        }
    }
}
