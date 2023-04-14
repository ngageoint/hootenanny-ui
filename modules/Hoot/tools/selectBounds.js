/*******************************************************************************************************
 * File: selectBounds.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import FormFactory  from './formFactory';

import { modeBrowse, modeDrawBoundingBox } from '../../modes';
import ClipDataset                         from './clipDataset';
import OverpassQueryPanel                  from './overpassQueryPanel';
import { d3combobox }                      from '../ui/d3.combobox';
import { geoExtent as GeoExtent }          from '../../geo';
import { prefs } from '../../core';
import { select as d3_select }             from 'd3-selection';

export default class SelectBounds extends EventEmitter {
    constructor( context, predefinedData ) {
        super();

        this.context          = predefinedData && predefinedData.context ? predefinedData.context : context;
        this.minlon           = predefinedData && predefinedData.minlon ? parseFloat(predefinedData.minlon) : null;
        this.minlat           = predefinedData && predefinedData.minlat ? parseFloat(predefinedData.minlat) : null;
        this.maxlon           = predefinedData && predefinedData.maxlon ? parseFloat(predefinedData.maxlon) : null;
        this.maxlat           = predefinedData && predefinedData.maxlat ? parseFloat(predefinedData.maxlat) : null;
        this.boundsSelectType = predefinedData && predefinedData.boundsSelectType ? predefinedData.boundsSelectType : 'visualExtent';
        this.operationName    = '';
        this.selectedBoundOption = predefinedData && predefinedData.selectedBoundOption ? predefinedData.selectedBoundOption : 'Visual Extent';
    }

    render( operationName ) {
        // if user does something like starts drawing and then midway selects a bounds operation the context will
        // remain as the old one so good to double check
        this.context.enter( modeBrowse( this.context ) );

        this.operationName = operationName;

        const metadata = {
            title: 'Enter Coordinates for Bounding Box',
            button: {
                text: 'Next',
                id: 'boundsNextBtn',
                onClick: () => this.handleNext()
            }
        };

        const formId = 'drawBoundsForm';

        this.form       = new FormFactory().generateForm( 'body', formId, metadata );
        this.nextButton = d3_select( `#${metadata.button.id}` );

        this.nextButton.property( 'disabled', false );

        let mapExtent;
        if (this.minlon && this.minlat && this.maxlon && this.maxlat) {
            mapExtent = new GeoExtent( [ this.minlon, this.minlat ], [ this.maxlon,this.maxlat ] );
        }
        else {
            mapExtent = this.context.map().extent();
        }

        this.updateCoords( mapExtent );
        this.createCoordsField();
        this.createBoundsOptions();
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

    createBoundsOptions() {
        const self = this;
        const primaryLayer = Hoot.layers.findLoadedBy( 'refType', 'primary' ),
              secondaryLayer = Hoot.layers.findLoadedBy( 'refType', 'secondary' );
        const boundOptionsList = [ 'Draw Bounding Box', 'Visual Extent' ];

        let customDataLayer = this.context.layers().layer('data');
        if (customDataLayer.hasData() && customDataLayer.enabled()) {
            boundOptionsList.push( 'Custom Data Extent' );
            this.selectedBoundOption = 'Custom Data Extent';
            this.boundsSelectType = 'customDataExtent';
            this.handleBounds( customDataLayer.extent() );
        }

        if ( this.operationName === 'grailPull' || this.operationName.startsWith('createDifferential')) {
            if (primaryLayer) {
                boundOptionsList.push( 'Reference Layer Extent' );
            }
            if (secondaryLayer) {
                boundOptionsList.push( 'Secondary Layer Extent' );
            }
        }

        // Build dropdown for historical bounds
        this.dropdownContainer = this.form
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'button-wrap flex justify-left history-options', true )
            .append( 'input' )
            .attr('placeholder', 'Select a bounds from...');

        let { boundsHistory } = JSON.parse( prefs('bounds_history') );

        const dropdownOptions = boundOptionsList.concat( boundsHistory );
        const historyOptions = dropdownOptions.map( option => { return { value: option }; } );

        let combobox = d3combobox()
            .data( historyOptions );

        this.dropdownContainer.call( combobox )
            .attr( 'readonly', true )
            .property( 'value', self.selectedBoundOption)
            .on('change', function() {
                const selectedValue = this.value;

                if ( selectedValue === 'Draw Bounding Box' ) {
                    self.form.classed( 'hidden', true );
                    self.boundsSelectType = 'boundingBox';
                    self.context.enter( modeDrawBoundingBox( self, self.context ) );
                } else if ( selectedValue === 'Visual Extent' ) {
                    self.boundsSelectType = 'visualExtent';
                    self.handleBounds( self.context.map().extent() );
                } else if ( selectedValue === 'Custom Data Extent' ) {
                    self.boundsSelectType = 'customDataExtent';
                    self.handleBounds( customDataLayer.extent() );
                } else if ( selectedValue === 'Reference Layer Extent' ) {
                    self.boundsSelectType = 'primaryLayerExtent';
                    self.handleBounds( primaryLayer.extent );
                } else if ( selectedValue === 'Secondary Layer Extent' ) {
                    self.boundsSelectType = 'secondaryLayerExtent';
                    self.handleBounds( secondaryLayer.extent );
                } else {
                    self.boundsSelectType = 'boundsHistory';
                    const coords = selectedValue.split(',').map( data => +data );
                    self.handleBounds( new GeoExtent( [ coords[0], coords[1] ], [ coords[2], coords[3] ] ) );
                }

                self.selectedBoundOption = selectedValue;
                self.dropdownContainer.property( 'value', self.selectedBoundOption );
            });

    }

    handleBounds( extent ) {
        this.updateCoords( extent );
        this.form.classed( 'hidden', false );

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

    handleNext() {
        if (this.boundsSelectType === 'customDataExtent') {
            let customDataLayer = this.context.layers().layer('data');
            this.bounds = customDataLayer.getCoordsString();
        } else {
            this.bounds = this.minLonInput.property( 'value' ) + ',' +
                this.minLatInput.property( 'value' ) + ',' +
                this.maxLonInput.property( 'value' ) + ',' +
                this.maxLatInput.property( 'value' );
        }

        this.form.remove();
        this.nextButton = null;

        if ( this.operationName === 'clipData' ) {
            new ClipDataset( this ).render();
        } else if ( this.operationName === 'grailPull' || this.operationName.startsWith('createDifferential')) {
            new OverpassQueryPanel( this ).render();
        }

    }
}
