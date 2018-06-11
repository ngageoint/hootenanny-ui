/*******************************************************************************************************
 * File: sidebarLayerReview.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/29/18
 *******************************************************************************************************/

import SidebarForm from './sidebarForm';
import Conflicts   from '../control/conflicts';
import Event       from '../managers/eventManager';

export default class SidebarLayerReview extends SidebarForm {
    constructor( sidebar, container, layer ) {
        super( sidebar, container );

        this.layer = layer;
    }

    render() {
        super.render();

        this.createFieldset();
        this.createReviewCount();
        this.createAcceptAllButton();

        this.listen();

        this.conflicts = new Conflicts( this.context, d3.select( '#content' ), this.layer );
        this.conflicts.init();
    }

    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    createReviewCount() {
        this.reviewInfo = this.fieldset.append( 'div' )
            .classed( 'hoot-form-field', true )
            .append( 'span' )
            .classed( '_icon info review-count', true )
            .text( 'There are 0 reviews' );
    }

    createAcceptAllButton() {
        this.acceptAll = this.fieldset.append( 'div' )
            .classed( 'hoot-form-field', true )
            .append( 'a' )
            .attr( 'href', '!#' )
            .text( 'Resolve all remaining reviews' )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.conflicts.resolve.acceptAll( this.layer );
            } );
    }

    updateReviewCount( text ) {
        this.reviewInfo.text( text );
    }

    reviewComplete() {
        this.reviewInfo.text( 'All reviews resolved!' );
        this.acceptAll.remove();

        let btnContainer = this.fieldset.append( 'div' )
            .classed( 'hoot-form-field action-container', true );

        btnContainer.append( 'button' )
            .classed( 'button secondary small strong round', true )
            .text( 'Export Data' );

        btnContainer.append( 'button' )
            .classed( 'button dark text-light small strong round', true )
            .text( 'Add Another Dataset' );
    }

    listen() {
        Event.listen( 'meta-updated', this.updateReviewCount, this );
        Event.listen( 'review-complete', this.reviewComplete, this );
    }
}