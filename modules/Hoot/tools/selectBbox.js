/*******************************************************************************************************
 * File: selectBbox.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import FormFactory  from './formFactory';

import { modeDrawBoundingBox }    from '../../modes';
import ClipDataset                from './clipDataset';
import OverpassQueryPanel         from './overpassQueryPanel';
import DifferentialUpload         from './differentialUpload';
import { d3combobox }             from '../../lib/hoot/d3.combobox';
import { geoExtent as GeoExtent } from '../../geo';

export default class SelectBbox extends EventEmitter {
    constructor( context, predefinedData ) {
        super();

        this.context        = predefinedData && predefinedData.context ? predefinedData.context : context;
        this.minlon         = predefinedData && predefinedData.minlon ? parseFloat(predefinedData.minlon) : null;
        this.minlat         = predefinedData && predefinedData.minlat ? parseFloat(predefinedData.minlat) : null;
        this.maxlon         = predefinedData && predefinedData.maxlon ? parseFloat(predefinedData.maxlon) : null;
        this.maxlat         = predefinedData && predefinedData.maxlat ? parseFloat(predefinedData.maxlat) : null;
        this.bboxSelectType = predefinedData && predefinedData.bboxSelectType ? predefinedData.bboxSelectType : 'visualExtent';
        this.operationName  = '';
        this.selectedBoundOption = predefinedData && predefinedData.selectedBoundOption ? predefinedData.selectedBoundOption : 'Visual Extent';
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

        let mapExtent;
        if (this.minlon && this.minlat && this.maxlon && this.maxlat) {
            mapExtent = new GeoExtent( [ this.minlon, this.minlat ], [ this.maxlon,this.maxlat ] );
        }
        else {
            mapExtent = this.context.map().extent();
        }

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
        const self = this;
        const primaryLayer = Hoot.layers.findLoadedBy( 'refType', 'primary' ),
              secondaryLayer = Hoot.layers.findLoadedBy( 'refType', 'secondary' );
        const boundOptionsList = [ 'Draw Bounding Box', 'Visual Extent' ];

        let customDataLayer = this.context.layers().layer('data');
        if (customDataLayer.hasData() && customDataLayer.enabled()) {
            boundOptionsList.push( 'Custom Data Extent' );
        }

        if ( this.operationName === 'grailPull' || this.operationName === 'createDifferentialChangeset' ) {
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

        let { bboxHistory } = JSON.parse( Hoot.context.storage('history') );

        const dropdownOptions = boundOptionsList.concat( bboxHistory );
        const historyOptions = dropdownOptions.map( option => { return { value: option }; } );

        let combobox = d3combobox()
            .data( historyOptions );

        this.dropdownContainer.call( combobox )
            .attr( 'readonly', true )
            .property( 'value', self.selectedBoundOption)
            .on('change', function() {
                const selectedValue = this.value;

                if ( selectedValue === 'Draw Bounding Box' ) {
                    self.container.classed( 'hidden', true );
                    self.bboxSelectType = 'boundingBox';
                    self.context.enter( modeDrawBoundingBox( self, self.context ) );
                } else if ( selectedValue === 'Visual Extent' ) {
                    self.bboxSelectType = 'visualExtent';
                    self.handleBbox( self.context.map().extent() );
                } else if ( selectedValue === 'Custom Data Extent' ) {
                    self.bboxSelectType = 'customDataExtent';
                    self.handleBbox( customDataLayer.extent() );
                } else if ( selectedValue === 'Reference Layer Extent' ) {
                    self.bboxSelectType = 'primaryLayerExtent';
                    self.handleBbox( primaryLayer.extent );
                } else if ( selectedValue === 'Secondary Layer Extent' ) {
                    self.bboxSelectType = 'secondaryLayerExtent';
                    self.handleBbox( secondaryLayer.extent );
                } else {
                    self.bboxSelectType = 'boundsHistory';
                    const coords = selectedValue.split(',').map( data => +data );
                    self.handleBbox( new GeoExtent( [ coords[0], coords[1] ], [ coords[2], coords[3] ] ) );
                }

                self.selectedBoundOption = selectedValue;
                self.dropdownContainer.property( 'value', self.selectedBoundOption );
            });

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
            new OverpassQueryPanel( this ).render();
        } else if ( this.operationName === 'createDifferentialChangeset' ) {
            new DifferentialUpload( this ).render();
        }

    }
}
