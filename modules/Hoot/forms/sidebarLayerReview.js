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

        this.conflicts = new Conflicts( sidebar.context, d3.select( '#content' ), layer );
    }

    render() {
        super.render();

        this.createFieldset();
        this.createReviewCount();
        this.createAcceptAllButton();

        this.conflicts.init();
    }

    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    createReviewCount() {
        this.reviewCount = this.fieldset.append( 'div' )
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
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
            } );
    }

    updateReviewCount( text ) {
        this.reviewCount.text( text );
    }

    listen() {
        Event.listen( 'meta-updated', this.updateReviewCount, this );
    }
}