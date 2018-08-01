/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/1/18
 *******************************************************************************************************/

import _                         from 'lodash-es';
import FormFactory               from './formFactory';
import API                       from '../managers/api';
import FolderManager             from '../managers/folderManager';
import LayerManager              from '../managers/layerManager';

import { checkForUnallowedChar } from './utilities';
import { d3combobox }            from '../../lib/hoot/d3.combobox';

export default class ClipDataset {
    constructor( instance ) {
        this.instance = instance;
    }

    render( clipType ) {
        let titleText = clipType === 'visualExtent'
            ? 'Clip Data to Visual Extent'
            : clipType === 'boundingBox'
                ? 'Clip Data to Bounding Box'
                : 'Clip Data';

        let metadata = {
            title: titleText,
            button: {
                text: 'Clip',
                id: 'clipSubmitBtn',
                onClick: this.handleSubmit()
            }
        };

        this.container    = new FormFactory().generateForm( 'body', 'clipDataset', metadata );
        this.form         = d3.select( '#clipDataset' );
        this.submitButton = d3.select( '#clipSubmitBtn' );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        let loadedLayers = LayerManager.loadedLayers,
            folderList   = FolderManager.folderPaths,
            that         = this;

        let columns = [
            {
                label: 'Dataset',
                type: 'datasetName'
            },
            {
                label: 'Clip?',
                checkbox: true
            },
            {
                label: 'Output Name',
                placeholder: 'Save As',
                type: 'layerName'
            },
            {
                label: 'Path',
                placeholder: 'root',
                combobox: folderList
            }
        ];

        let table = this.form
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

        _.forEach( loadedLayers, layer => {
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
                .attr( 'placeholder', d => d.placeholder )
                .select( function( d ) {
                    if ( d.checkbox ) {
                        let parent = d3.select( this.parentElement );

                        parent
                            .selectAll( 'input' )
                            .remove();

                        parent
                            .append( 'input' )
                            .attr( 'type', 'checkbox' )
                            .property( 'checked', true )
                            .attr( 'id', `clip-${ mapId }` );
                    }

                    if ( d.combobox ) {
                        that.createFolderListCombo( d3.select( this ), d, layer );
                    }

                    if ( d.type === 'datasetName' ) {
                        d3.select( this )
                            .attr( 'placeholder', layer.name )
                            .attr( 'readonly', true );
                    }

                    if ( d.type === 'layerName' ) {
                        that.createLayerNameField( d3.select( this ), layer );
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
            if ( !_.isEmpty( LayerManager.findBy( 'name', layerName ) ) ) {
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

                if ( resp !== true ) {
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
     * @param d     - selected field meta-data
     * @param layer - selected layer meta-data
     **/
    createFolderListCombo( input, d, layer ) {
        let combobox = d3combobox()
            .data( _.map( d.combobox, n => {
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

    }
}