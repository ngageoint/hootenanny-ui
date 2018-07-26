/*******************************************************************************************************
 * File: clipDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/25/18
 *******************************************************************************************************/

import EventEmitter from 'events';
import FormFactory  from './formFactory';

export default class ClipDataset extends EventEmitter {
    constructor( context ) {
        super();

        this.context     = context;
        this.formFactory = new FormFactory();

        this.minlon = null;
        this.minlat = null;
        this.maxlon = null;
        this.maxlat = null;
    }

    render() {
        let metadata = {
            title: 'Enter Coordinates for Clip Bounding Box',
            button: {
                text: 'Next',
                id: 'clipNextBtn'
            }
        };

        this.container  = this.formFactory.generateForm( 'body', 'clipDataset', metadata );
        this.form       = d3.select( '#clipDataset' );
        this.nextButton = d3.select( '#clipNextBtn' );

        this.nextButton.property( 'disabled', false );

        let mapExtent = this.context.map().extent();

        this.getCoords( mapExtent );
        this.createCoordsField();
        this.createClipOptions();
    }

    getCoords( extent ) {
        this.minlon = extent[ 0 ][ 0 ].toFixed( 6 );
        this.minlat = extent[ 0 ][ 1 ].toFixed( 6 );
        this.maxlon = extent[ 1 ][ 0 ].toFixed( 6 );
        this.maxlat = extent[ 1 ][ 1 ].toFixed( 6 );
    }

    createCoordsField() {
        let coordsField = this.form
            .insert( 'div', '.modal-footer' )
            .classed( 'extent-box keyline-all round', true );

        let topRow = coordsField
            .append( 'div' )
            .classed( 'row', true );

        let midRow = coordsField
            .append( 'div' )
            .classed( 'row', true );

        let bottomRow = coordsField
            .append( 'div' )
            .classed( 'row', true );

        topRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'maxlat' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.maxlat );

        midRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'minlon' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.minlon );

        midRow
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', 'maxlon' )
            .attr( 'size', 10 )
            .classed( 'extent-bound', true )
            .property( 'value', this.maxlon );

        bottomRow
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
            } );
    }
}