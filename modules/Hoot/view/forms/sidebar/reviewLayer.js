/*******************************************************************************************************
 * File: reviewLayer.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/29/18
 *******************************************************************************************************/

import SidebarForm from '../sidebarForm';

export default class ReviewLayer extends SidebarForm {
    constructor( sidebar, container ) {
        super( sidebar, container );
    }

    render( layer ) {
        super.render();

        this.layerData = layer;

        this.createFieldset();
        this.createReviewCount();
        this.createAcceptAllButton();
    }

    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    createReviewCount() {
        this.reviewCount = this.fieldset.append( 'div' )
            .classed( 'form-field', true )
            .append( 'span' )
            .classed( '_icon info review-count', true )
            .text( 'There are 0 reviews:' );
    }

    createAcceptAllButton() {
        this.acceptAll = this.fieldset.append( 'div' )
            .classed( 'form-field', true )
            .append( 'a' )
            .attr( 'href', '!#' )
            .text( 'Resolve all remaining reviews' )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
            } );

        //this.acceptAll = this.fieldset.append( 'div' )
        //    .classed( 'small keyline-all round', true )
        //    .append( 'label' )
        //    .classed( 'pad1x pad1y', true )
        //    .append( 'a' )
        //    .attr( 'href', '!#' )
        //    .text( 'Resolve all remaining reviews' )
        //    .on( 'click', function() {
        //        d3.event.stopPropagation();
        //        d3.event.preventDefault();
        //    } );
    }
}