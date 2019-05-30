/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/1/18
 *******************************************************************************************************/

import _isEmpty from 'lodash-es/isEmpty';
import _forEach from 'lodash-es/forEach';
import _map     from 'lodash-es/map';

import FormFactory from './formFactory';

import { checkForUnallowedChar } from './utilities';
import { d3combobox }            from '../../lib/hoot/d3.combobox';
import _get                      from 'lodash-es/get';
import _find                     from 'lodash-es/find';

export default class ClipDataset {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = this.instance.clipType === 'visualExtent'
            ? 'Clip Data to Visual Extent'
            : this.instance.clipType === 'boundingBox'
                ? 'Clip Data to Bounding Box'
                : 'Clip Data';

        let metadata = {
            title: titleText,
            button: {
                text: 'Clip',
                id: 'clipSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container    = new FormFactory().generateForm( 'body', 'clipDataset', metadata );
        this.form         = d3.select( '#clipDataset' );
        this.submitButton = d3.select( '#clipSubmitBtn' );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        let loadedLayers = Hoot.layers.loadedLayers,
            folderList   = Hoot.folders.folderPaths,
            that         = this;

        let columns = [
            {
                label: 'Dataset',
                name: 'datasetName'
            },
            {
                label: 'Clip?',
                name: 'doClip'
            },
            {
                label: 'Output Name',
                placeholder: 'Save As',
                name: 'outputName'
            },
            {
                label: 'Path',
                placeholder: 'root',
                combobox: folderList,
                name: 'outputPath'
            }
        ];

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'clipTable' );

        let colgroup = table
            .append( 'colgroup' );

        colgroup.append( 'col' )
            .attr( 'span', '1' );

        colgroup.append( 'col' )
            .style( 'width', '100px' );

        table
            .append( 'thead' )
            .append( 'tr' )
            .selectAll( 'th' )
            .data( columns )
            .enter()
            .append( 'th' )
            .text( d => d.label );

        let tableBody = table.append( 'tbody' );

        _forEach( loadedLayers, layer => {
            let mapId = layer.id;

            tableBody
                .append( 'tr' )
                .attr( 'id', `row-${ mapId }` )
                .selectAll( 'td' )
                .data( columns )
                .enter()
                .append( 'td' )
                .append( 'input' )
                .attr( 'type', 'text' )
                .attr( 'data-map-id', mapId )
                .attr( 'class', d => d.name )
                .attr( 'placeholder', d => d.placeholder )
                .select( function( d ) {
                    if ( d.name === 'datasetName' ) {
                        d3.select( this )
                            .attr( 'placeholder', layer.name )
                            .attr( 'readonly', true );
                    } else if ( d.name === 'doClip' ) {
                        let parent = d3.select( this.parentElement );

                        parent
                            .selectAll( 'input' )
                            .remove();

                        parent
                            .append( 'input' )
                            .attr( 'type', 'checkbox' )
                            .property( 'checked', true )
                            .attr( 'data-map-id', mapId );
                    } else if ( d.name === 'outputName' ) {
                        that.createLayerNameField( d3.select( this ), layer );
                    } else {
                        that.createFolderListCombo( d3.select( this ), d );
                    }
                } );
        } );
    }

    createLayerNameField( input, layer ) {
        let that       = this,
            layerName  = Hoot.layers.checkLayerName( layer.name );

        input
            .property( 'value', layerName )
            .on( 'input', function() {
                let resp = checkForUnallowedChar( this.value );

                if ( resp !== true || !this.value.length ) {
                    d3.select( this ).classed( 'invalid', true ).attr( 'title', resp );
                    that.submitButton.property( 'disabled', true );
                } else {
                    d3.select( this ).classed( 'invalid', false ).attr( 'title', null );
                    that.submitButton.property( 'disabled', false );
                }
            } );
    }

    /**
     * Create folder list selection dropdown
     *
     * @param input - selected field
     * @param d     - field metadata
     **/
    createFolderListCombo( input, d ) {
        let combobox = d3combobox()
            .data( _map( d.combobox, n => {
                return {
                    value: n.path,
                    _value: n.id
                };
            } ) );

        let data = combobox.data();

        data.sort( ( a, b ) => {
            let textA = a.value.toLowerCase(),
                textB = b.value.toLowerCase();

            return textA < textB ? -1 : textA > textB ? 1 : 0;
        } ).unshift( { value: 'root', _value: 0 } );

        input.call( combobox );
    }

    handleSubmit() {
        let checkedRows = this.form.selectAll( '[type="checkbox"]' ),
            bbox        = this.instance.bbox;

        let self = this;

        checkedRows.select( function() {
            let checkbox = d3.select( this );

            if ( !checkbox.property( 'checked' ) ) return;

            let mapId  = checkbox.attr( 'data-map-id' ),
                params = {};

            let row         = d3.select( `#row-${ mapId }` ),
                datasetName = row.select( '.datasetName' ),
                outputName  = row.select( '.outputName' ),
                folderId    = parseInt(row.select( '.outputPath' ).attr('_value'), 10);

            params.INPUT_NAME  = datasetName.property( 'value' ) || datasetName.attr( 'placeholder' );
            params.OUTPUT_NAME = Hoot.layers.checkLayerName(outputName.property( 'value' ) || outputName.attr( 'placeholder' ));
            params.FOLDER_ID   = folderId ? folderId : 0;
            params.BBOX        = bbox;

            self.loadingState();

            self.processRequest = Hoot.api.clipDataset( params )
                .then( resp => {
                    self.jobId = resp.data.jobid;

                    return Hoot.api.statusInterval( self.jobId );
                } )
                .then( resp => {
                    let message;
                    if (resp.data && resp.data.status === 'cancelled') {
                        message = 'Clip job cancelled';
                    } else {
                        message = 'Clip job complete';
                    }

                    Hoot.message.alert( {
                        data: resp.data,
                        message: message,
                        status: 200,
                        type: resp.type
                    } );

                    return resp;
                } )
                .then( resp => {
                    if (resp.data && resp.data.status !== 'cancelled') {
                        Hoot.folders.refreshDatasets();
                    }

                    return resp;
                } )
                .then( resp => {
                    if (resp.data && resp.data.status !== 'cancelled') {
                        Hoot.folders.refreshLinks();
                    }

                    return resp;
                } )
                .then( () => {
                    Hoot.events.emit( 'render-dataset-table' );
                } )
                .catch( err => {
                    console.error(err);
                    let message = 'Error running clip',
                        type = err.type,
                        keepOpen = true;

                    Hoot.message.alert( { message, type, keepOpen } );
                } )
                .finally( () => {
                    self.container.remove();
                    Hoot.events.emit( 'modal-closed' );
                });
        } );

    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Cancel Clip' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            Hoot.api.cancelJob(this.jobId);
        } );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }
}
