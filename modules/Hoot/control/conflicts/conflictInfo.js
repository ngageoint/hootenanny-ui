/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import Event from '../../managers/eventManager';
import _     from 'lodash-es';

export default class ConflictMetadata {
    constructor( instance ) {
        this.conflicts = instance;
        this.data      = instance.data;

        this.tagBlacklist = [
            /hoot*/,
            /REF1/,
            /REF2/,
            /error:circular/,
            /source:datetime/,
            /source:ingest:datetime/,
            /uuid/
        ];
    }

    buildPoiTable( colData ) {
        let tags1      = this.filterTags( colData[ 0 ] ? colData[ 0 ].tags : {} ),
            tags2      = this.filterTags( colData[ 1 ] ? colData[ 1 ].tags : {} ),
            tagsMerged = this.mergeTags( [ tags1, tags2 ] );

        if ( this.poiTable ) {
            this.tableContainer.remove();
        }

        this.tableContainer =  this.conflicts.leftContainer
            .insert( 'div', ':first-child' )
            .classed( 'tag-table', true );

        this.poiTable = this.tableContainer.append( 'table' );

        if ( this.data.currentRelation.members.length > 2 ) {
            let navHtml = '<div class="navigation-wrapper"><div class="prev">&lt;&lt;</div><div class="next">&gt;&gt;</div></div>';

            let row = this.poiTable.append( 'tr' )
                .classed( 'table-head', true );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( 'Review Item' );

            row.selectAll( 'td.feature1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature1', true )
                .html( navHtml );

            row.selectAll( 'td.feature2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature2', true )
                .html( navHtml );
        }

        _.forEach( tagsMerged, tag => {
            let row = this.poiTable.append( 'tr' );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( _.startCase( tag.key ) );

            row.selectAll( 'td.feature1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature1', true )
                .text( tag.value[ 0 ] );

            row.selectAll( 'td.feature2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature2', true )
                .text( tag.value[ 1 ] );
        } );

        this.poiTable.selectAll( '.value-col' )
            .on( 'mouseenter', d => d3.selectAll( `.review-feature${ d.k }` ).classed( 'extra-highlight', true ) )
            .on( 'mouseleave', d => d3.selectAll( `.review-feature${ d.k }` ).classed( 'extra-highlight', false ) );
    }

    toggleTable() {
        let tableState = this.tableContainer.classed( 'hidden' );

        this.tableContainer.classed( 'hidden', !tableState );
        this.conflicts.container.select( 'button.toggle_table' )
            .text( tableState ? 'Hide Table' : 'Show Table' )
            .call( this.conflicts.tooltip );
    }

    filterTags( tags ) {
        return _.filter( d3.entries( tags ), tag => {
            return _.every( this.tagBlacklist, t => !tag.key.match( t ) );
        } );
    }

    mergeTags( tags ) {
        let tagKeys   = d3.set( _.map( _.flatten( tags ), 'key' ) ),
            mergedMap = d3.map();

        _.forEach( tagKeys.values().sort(), key => {
            mergedMap.set( key, [] );

            _.forEach( tags, tag => {
                let tagMap = d3.map();

                _.forEach( tag, t => {
                    tagMap.set( t.key, t.value );
                } );

                mergedMap.get( key ).push( tagMap.has( key ) ? tagMap.get( key ) : null );
            } );
        } );

        return mergedMap.entries();
    }

    updateMeta( note ) {
        let noteText          = '',
            currentMeta       = this.data.reviewStats;

        let nTotal      = 0,
            nUnreviewed = 0,
            nReviewed   = 0;

        if ( currentMeta ) {
            nTotal      = currentMeta.totalCount;
            nUnreviewed = currentMeta.unreviewedCount;
            nReviewed   = nTotal - nUnreviewed;
        }

        if ( note ) {
            noteText = note;
        } else if ( this.data.currentRelation ) {
            let relationNote = this.data.currentRelation.tags[ 'hoot:review:now' ];

            if ( relationNote ) {
                noteText = relationNote;
            }
        }

        this.conflicts.metaDialog.html(
            `<strong class="review-note">
                Review note: ${ noteText }
            </strong>
            <br>
            <strong class="reviews-remaining">
                Reviews remaining: ${ nUnreviewed } (Resolved: ${ nReviewed })
            </strong>`
        );

        Event.send( 'meta-updated', `There are ${ nUnreviewed } reviews` );
    }
}