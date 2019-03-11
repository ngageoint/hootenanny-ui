/*******************************************************************************************************
 * File: selectBbox.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import FormFactory  from './formFactory';

import { modeDrawBoundingBox } from '../../modes';
import { titleCase }           from './utilities';

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

    render( formInfo ) {
        let formId = 'select' + titleCase( this.operationName ) + 'Bbox';

        this.container  = new FormFactory().generateForm( 'body', formId, formInfo.metadata );
        this.form       = d3.select( `#${formId}` );
        this.nextButton = d3.select( `#${formInfo.metadata.button.id}` );

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
            .classed( 'keyline-all', true )
            .text( 'Draw Bounding Box' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );
                that.container.classed( 'hidden', true );

                that.context.enter( modeDrawBoundingBox( that, that.context ) );
                that.bboxSelectType = 'boundingBox';
            } );

        bboxOptions
            .append( 'button' )
            .classed( 'keyline-all selected', true )
            .text( 'Use Visual Extent' )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'button' )
                    .classed( 'selected', false );

                d3.select( this ).classed( 'selected', true );

                that.handleBbox( that.context.map().extent() );
                that.bboxSelectType = 'visualExtent';
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

}
