/*******************************************************************************************************
 * File: clipSelectBbox.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import ClipDataset  from './clipDataset';
import FormFactory  from './formFactory';

import { modeClipBoundingBox } from '../../modes';

export default class ClipSelectBbox extends EventEmitter {
    constructor( context ) {
        super();

        this.context = context;

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
                onClick: () => this.handleNext()
            }
        };

        this.container  = new FormFactory().generateForm( 'body', 'selectClipBbox', metadata );
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

    handleNext() {
        this.bbox = this.minLonInput.property( 'value' ) + ',' +
            this.minLatInput.property( 'value' ) + ',' +
            this.maxLonInput.property( 'value' ) + ',' +
            this.maxLatInput.property( 'value' );

        this.container.remove();
        this.nextButton = null;

        new ClipDataset( this ).render();
    }
}