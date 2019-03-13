/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/1/18
 *******************************************************************************************************/

import _isEmpty    from 'lodash-es/isEmpty';
import _forEach    from 'lodash-es/forEach';
import _map        from 'lodash-es/map';

import FormFactory from './formFactory';

import { checkForUnallowedChar } from './utilities';
import { d3combobox }            from '../../lib/hoot/d3.combobox';

export default class ClipDataset {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Clip Data to Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
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
                        that.createFolderListCombo( d3.select( this ), d );
                    }
                } );
        } );
    }

    createLayerNameField( input, layer ) {
        let that       = this,
            uniquename = false,
            layerName  = layer.name,
            i          = 1;

        while ( uniquename === false ) {
            if ( !_isEmpty( Hoot.layers.findBy( 'name', layerName ) ) ) {
                layerName = layer.name + i.toString();
                i++;
            } else {
                uniquename = true;
            }
        }

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
                    title: n.path
                };
            } ) );

        let data = combobox.data();

        data.sort( ( a, b ) => {
            let textA = a.value.toLowerCase(),
                textB = b.value.toLowerCase();

            return textA < textB ? -1 : textA > textB ? 1 : 0;
        } ).unshift( { value: 'root', title: 0 } );

        input.call( combobox );
    }

    handleSubmit() {
        let checkedRows = this.form.selectAll( '[type="checkbox"]' ),
            bbox        = this.instance.bbox;

        checkedRows.select( function() {
            let checkbox = d3.select( this );

            if ( !checkbox.property( 'checked' ) ) return;

            let mapId  = checkbox.attr( 'data-map-id' ),
                params = {};

            let row         = d3.select( `#row-${ mapId }` ),
                datasetName = row.select( '.datasetName' ),
                outputName  = row.select( '.outputName' ),
                pathName    = row.select( '.outputPath' );

            params.INPUT_NAME  = datasetName.property( 'value' ) || datasetName.attr( 'placeholder' );
            params.OUTPUT_NAME = outputName.property( 'value' ) || outputName.attr( 'placeholder' );
            params.PATH_NAME   = pathName.property( 'value' ) || pathName.attr( 'placeholder' ) || 'root';
            params.BBOX        = bbox;

            Hoot.api.clipDataset( params )
                .then( () => Hoot.folders.refreshDatasets() )
                .then( () => Hoot.events.emit( 'render-dataset-table' ) );
        } );

        this.form.remove();
    }
}
