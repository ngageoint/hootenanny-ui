/*******************************************************************************************************
 * File: selectBbox.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import FormFactory  from './formFactory';

import { modeDrawBoundingBox }    from '../../modes';
import ClipDataset                from './clipDataset';
import GrailPull                  from './grailPull';
import DifferentialUpload         from './differentialUpload';
import { d3combobox }             from '../../lib/hoot/d3.combobox';
import _map                       from 'lodash-es/map';
import { geoExtent as GeoExtent } from '../../geo';

export default class SelectBbox extends EventEmitter {
    constructor( context ) {
        super();

        this.context = context;

        this.minlon         = null;
        this.minlat         = null;
        this.maxlon         = null;
        this.maxlat         = null;
        this.bboxSelectType = 'visualExtent';
        this.operationName  = '';
    }

    render( operationName ) {
        this.operationName = operationName;

        const metadata = {
            title: 'Enter Coordinates for Bounding Box',
            button: {
                text: 'Next',
                id: 'bboxNextBtn',
                onClick: () => this.handleNext()
            }
        };

        const formId = 'drawBboxForm';

        this.container  = new FormFactory().generateForm( 'body', formId, metadata );
        this.form       = d3.select( `#${formId}` );
        this.nextButton = d3.select( `#${metadata.button.id}` );

        this.nextButton.property( 'disabled', false );

        let mapExtent = this.context.map().extent();

        this.updateCoords( mapExtent );
        this.createCoordsField();
        this.createBboxOptions();
    }

    updateCoords( extent ) {
        this.minlon = extent[ 0 ][ 0 ].toFixed( 6 );
        this.minlat = extent[ 0 ][ 1 ].toFixed( 6 );
        this.maxlon = extent[ 1 ][ 0 ].toFixed( 6 );
        this.maxlat = extent[ 1 ][ 1 ].toFixed( 6 );
    }

    createCoordsField() {
        this.extentBox = this.form
            .select( '.wrapper div' )
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

    createBboxOptions() {
        let that = this;

        let bboxOptions = this.form
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'bbox-options button-wrap flex justify-center', true );

        bboxOptions
            .append( 'button' )
            .text( 'Draw Bounding Box' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );
                that.container.classed( 'hidden', true );
                that.bboxSelectType = 'boundingBox';

                that.context.enter( modeDrawBoundingBox( that, that.context ) );
            } );

        bboxOptions
            .append( 'button' )
            .classed( 'selected', true )
            .text( 'Visual Extent' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );
                that.bboxSelectType = 'visualExtent';

                that.handleBbox( that.context.map().extent() );
            } );

        let customDataLayer = this.context.layers().layer('data');
        if (customDataLayer.hasData() && customDataLayer.enabled()) {
            bboxOptions
                .append( 'button' )
                .text( 'Custom Data Extent' )
                .on( 'click', function() {
                    d3.select( this.parentNode )
                        .selectAll( 'button' )
                        .classed( 'selected', false );

                    d3.select( this ).classed( 'selected', true );
                    that.bboxSelectType = 'customDataExtent';

                    that.handleBbox( customDataLayer.extent() );
                } );
        }

        if ( this.operationName === 'grailPull' || this.operationName === 'createDifferentialChangeset' ) {
            const self = this;

            this.dropdownContainer = this.form
                .select( '.wrapper div' )
                .insert( 'div', '.modal-footer' )
                .classed( 'button-wrap flex justify-left history-options', true )
                .append( 'input' )
                .attr('placeholder', 'Previously used bounds');

            let { bboxHistory } = JSON.parse( Hoot.context.storage('history') );

            let combobox = d3combobox()
                .data( _map( bboxHistory, n => {
                    return {
                        value: n
                    };
                } ) );

            this.dropdownContainer.call( combobox )
                .on('change', function() {
                    const bbox = this.value;
                    self.dropdownContainer.attr('title', bbox);
                    self.bboxSelectType = 'boundsHistory';

                    const coords = bbox.split(',').map( data => +data );
                    self.handleBbox( new GeoExtent( [ coords[0], coords[1] ], [ coords[2], coords[3] ] ) );

                    bboxOptions.selectAll( 'button' )
                        .classed( 'selected', false );
                });

            // construct input section for user custom overpass queries
            this.userInputContainer = this.form
                .select( '.wrapper div' )
                .insert( 'div', '.modal-footer' )
                .classed( 'button-wrap user-input', true );

            this.userInputContainer.append( 'input' )
                .attr( 'type', 'checkbox' )
                .on('click', function() {
                    const isChecked = d3.select( this ).property( 'checked' );
                    customQueryInput.classed( 'hidden', !isChecked );
                });

            this.userInputContainer.append('div').text('Use custom query for public overpass data');

            const placeholder = 'Example Query:\n' +
                '[out:json][bbox:{{bbox}}];\n' +
                '(\n' +
                '   node;<;>;\n' +
                ')->.all;\n' +
                '.all;\n' +
                'out meta;\n' +
                '>;\n';

            const customQueryInput = this.userInputContainer.append( 'textarea' )
                .classed( 'hidden', true )
                .attr( 'placeholder', placeholder );
        }
    }

    handleBbox( extent ) {
        this.updateCoords( extent );
        this.container.classed( 'hidden', false );

        this.maxLatInput.property( 'value', this.maxlat );
        this.minLonInput.property( 'value', this.minlon );
        this.maxLonInput.property( 'value', this.maxlon );
        this.minLatInput.property( 'value', this.minlat );

        if ( this.dropdownContainer && this.bboxSelectType !== 'boundsHistory' ){
            this.dropdownContainer.property( 'value', '' );
        }

        let inputs = this.extentBox.selectAll( 'input' );

        setTimeout( () => {
            inputs.classed( 'updated', true );

            setTimeout( () => {
                inputs.classed( 'updated', false );
            }, 800 );
        }, 100 );
    }

    handleNext() {
        this.bbox = this.minLonInput.property( 'value' ) + ',' +
            this.minLatInput.property( 'value' ) + ',' +
            this.maxLonInput.property( 'value' ) + ',' +
            this.maxLatInput.property( 'value' );

        this.container.remove();
        this.nextButton = null;

        if ( this.operationName === 'clipData' ) {
            new ClipDataset( this ).render();
        } else if ( this.operationName === 'grailPull' ) {
            new GrailPull( this ).render();
        } else if ( this.operationName === 'createDifferentialChangeset' ) {
            new DifferentialUpload( this ).render();
        }

    }
}
