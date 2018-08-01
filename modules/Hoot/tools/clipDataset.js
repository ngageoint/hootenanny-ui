/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import EventEmitter  from 'events';
import FormFactory   from './formFactory';
import LayerManager  from '../managers/layerManager';
import FolderManager from '../managers/folderManager';

import { checkForUnallowedChar } from './utilities';
import { modeClipBoundingBox }   from '../../modes';

export default class ClipDataset extends EventEmitter {
    constructor( context ) {
        super();

        this.context     = context;
        this.formFactory = new FormFactory();

        this.minlon   = null;
        this.minlat   = null;
        this.maxlon   = null;
        this.maxlat   = null;
        this.clipType = 'visualExtent';
    }

    render() {
        let metadata = {
            title: 'Enter Coordinates for Clip Bounding Box',
            button: {
                text: 'Next',
                id: 'clipNextBtn',
                onClick: () => this.renderClipDataset( this.clipType )
            }
        };

        this.container  = this.formFactory.generateForm( 'body', 'selectClipBbox', metadata );
        this.form       = d3.select( '#selectClipBbox' );
        this.nextButton = d3.select( '#clipNextBtn' );

        this.nextButton.property( 'disabled', false );

        let mapExtent = this.context.map().extent();

        this.updateCoords( mapExtent );
        this.createCoordsField();
        this.createClipOptions();
    }

    updateCoords( extent ) {
        this.minlon = extent[ 0 ][ 0 ].toFixed( 6 );
        this.minlat = extent[ 0 ][ 1 ].toFixed( 6 );
        this.maxlon = extent[ 1 ][ 0 ].toFixed( 6 );
        this.maxlat = extent[ 1 ][ 1 ].toFixed( 6 );
    }

    createCoordsField() {
        this.extentBox = this.form
            .insert( 'div', '.modal-footer' )
            .classed( 'extent-box keyline-all round', true );

        let topRow = this.extentBox
            .append( 'div' )
            .classed( 'row', true );

        let midRow = this.extentBox
            .append( 'div' )
            .classed( 'row', true );

        let bottomRow = this.extentBox
            .append( 'div' )
            .classed( 'row', true );

        this.maxLatInput = topRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'maxlat' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.maxlat );

        this.minLonInput = midRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'minlon' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.minlon );

        this.maxLonInput = midRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'maxlon' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.maxlon );

        this.minLatInput = bottomRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'minlat' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.minlat );
    }

    createClipOptions() {
        let that = this;

        let clipOptions = this.form
            .insert( 'div', '.modal-footer' )
            .classed( 'clip-options button-wrap flex justify-center', true );

        clipOptions
            .append( 'button' )
            .classed( 'keyline-all', true )
            .text( 'Clip to Bounding Box' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );
                that.container.classed( 'hidden', true );

                that.context.enter( modeClipBoundingBox( that, that.context ) );
                that.clipType = 'boundingBox';
            } );

        clipOptions
            .append( 'button' )
            .classed( 'keyline-all selected', true )
            .text( 'Use Visual Extent' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );

                that.handleBbox( that.context.map().extent() );
                that.clipType = 'visualExtent';
            } );
    }

    handleBbox( extent ) {
        this.updateCoords( extent );
        this.container.classed( 'hidden', false );

        this.maxLatInput.property( 'value', this.maxlat );
        this.minLonInput.property( 'value', this.minlon );
        this.maxLonInput.property( 'value', this.maxlon );
        this.minLatInput.property( 'value', this.minlat );

        let inputs = this.extentBox.selectAll( 'input' );

        setTimeout( () => {
            inputs.classed( 'updated', true );

            setTimeout( () => {
                inputs.classed( 'updated', false );
            }, 800 );
        }, 100 );
    }

    renderClipDataset() {
        let titleText = this.clipType === 'visualExtent'
            ? 'Clip Data to Visual Extent'
            : this.clipType === 'boundingBox'
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

        this.container.remove();
        this.nextButton = null;

        this.container    = this.formFactory.generateForm( 'body', 'clipDataset', metadata );
        this.form         = d3.select( '#clipDataset' );
        this.submitButton = d3.select( '#clipSubmitBtn' );

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
                placeholder: 'root'
            }
        ];

        let table = this.form
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'clipTable' );

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
        let uniquename = false,
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
                } else {
                    d3.select( this ).classed( 'invalid', false ).attr( 'title', null );
                }
            } );
    }

    handleSubmit() {

    }
}