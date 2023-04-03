/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/1/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';
import _map     from 'lodash-es/map';

import FormFactory from './formFactory';

import { checkForUnallowedChar } from './utilities';
import { d3combobox }            from '../ui/d3.combobox';

export default class ClipDataset {
    constructor( instance ) {
        this.instance  = instance;
        this.jobIdList = [];
    }

    render() {
        let titleText = this.instance.boundsSelectType === 'visualExtent'
            ? 'Clip Data to Visual Extent'
            : this.instance.boundsSelectType === 'boundingBox'
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

        this.form    = new FormFactory().generateForm( 'body', 'clipDataset', metadata );
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

        let loadedList = Object.values(loadedLayers);
        let clipLayers = loadedList.some(l => l.isMerged) ? loadedList.filter(l => l.isMerged) : loadedList;

        _forEach( clipLayers, layer => {

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
                            .attr( 'readonly', false );
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
                        var folderId = Hoot.layers.findBy( 'id', layer.id ).folderId;
                        d.combobox = [ d.combobox.find( function( l ) { return l.id === folderId; } ) ]
                            .concat( d.combobox.filter( function( l ) { return l.id !== folderId; } ).sort() );
                        that.createFolderListCombo( d3.select( this ), d );
                        d3.select( this ).property( 'value', Hoot.folders.findBy( 'id', folderId).name );
                        d3.select( this ).attr( '_value', Hoot.folders.findBy( 'id', folderId ).id );
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

        input.call( combobox );
    }

    handleSubmit() {
        let checkedRows = this.form.selectAll( '[type="checkbox"]' ),
            bounds      = this.instance.bounds;

        let self = this;

        checkedRows.select( function() {
            let checkbox = d3.select( this );

            if ( !checkbox.property( 'checked' ) ) return;

            let mapId  = checkbox.attr( 'data-map-id' ),
                params = {};

            let row         = d3.select( `#row-${ mapId }` ),
                datasetName = row.select( '.datasetName' ),
                outputName  = row.select( '.outputName' ),
                folderId    = row.select( '.outputPath').attr('_value');

            params.INPUT_NAME  = datasetName.property( 'value' ) || datasetName.attr( 'placeholder' );
            params.OUTPUT_NAME = Hoot.layers.checkLayerName(outputName.property( 'value' ) || outputName.attr( 'placeholder' ));
            params.FOLDER_ID   = folderId ? folderId : 0;
            params.bounds      = bounds;

            self.loadingState();

            self.processRequest = Hoot.api.clipDataset( params )
                .then( resp => {
                    const jobId = resp.data.jobid;
                    self.jobIdList.push(jobId);

                    return Hoot.api.statusInterval( jobId );
                } )
                .then( resp => {
                    // remove completed job from jobIdList
                    self.jobIdList.splice( self.jobIdList.indexOf( resp.data.jobId ), 1 );

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
                .then( async resp => {
                    if (resp.data && resp.data.status !== 'cancelled') {
                        await Hoot.folders.refreshAll();
                        Hoot.events.emit( 'render-dataset-table' );
                    }

                    return resp;
                } )
                .catch( err => {
                    console.error(err);
                    let message = 'Error running clip',
                        type = err.type,
                        keepOpen = true;

                    Hoot.message.alert( { message, type, keepOpen } );
                } )
                .finally( () => {
                    self.form.remove();
                    Hoot.events.emit( 'modal-closed' );
                } );
        } );

    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Cancel Clip' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            this.jobIdList.forEach( jobId => Hoot.api.cancelJob( jobId ) );
        } );

        this.submitButton
            .selectAll('div')
            .data([0])
            .enter()
            .append('div')
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.form.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }
}
