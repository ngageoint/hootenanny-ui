/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _     from 'lodash-es';
import Event from '../../managers/eventManager';

export default class ConflictMetadata {
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;

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

    /**
     * Create tag table for revieawble items
     */
    buildTagTable() {
        let colData    = this.data.currentFeatures,
            tags1      = this.filterTags( colData[ 0 ] ? colData[ 0 ].tags : {} ),
            tags2      = this.filterTags( colData[ 1 ] ? colData[ 1 ].tags : {} ),
            tagsMerged = this.mergeTags( [ tags1, tags2 ] );

        let currentRelation = this.instance.graphSync.getCurrentRelation();

        if ( this.poiTable ) {
            this.tableContainer.remove();
        }

        this.tableContainer = this.instance.rightContainer
            .insert( 'div', ':first-child' )
            .classed( 'tag-table', true );

        this.poiTable = this.tableContainer.append( 'table' );

        if ( currentRelation.members.length > 2 ) {
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

    /**
     * Show/hide tag table
     */
    toggleTable() {
        let tableState = this.tableContainer.classed( 'hidden' );

        this.tableContainer.classed( 'hidden', !tableState );
        this.instance.container.select( 'button.toggle_table' )
            .text( tableState ? 'Hide Table' : 'Show Table' )
            .call( this.instance.tooltip );
    }

    /**
     * Filter tags to show in table
     *
     * @param tags - feature tags
     * @returns {object} - filtered tags
     */
    filterTags( tags ) {
        return _.filter( d3.entries( tags ), tag => {
            return _.every( this.tagBlacklist, t => !tag.key.match( t ) );
        } );
    }

    /**
     * Create a map of unique tags between features
     *
     * @param tags - feature tags
     * @returns {IterableIterator} - map of unique tags
     */
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

    /**
     * Update metadata used to show status of review process. Display total items
     * remaining for review and how many have already been resolved.
     *
     * @param note - Note about review
     */
    updateMeta( note ) {
        let noteText    = '',
            currentMeta = this.data.reviewStats,
            currentRelation = this.instance.graphSync.getCurrentRelation();

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
        } else if ( currentRelation ) {
            let relationNote = currentRelation.tags[ 'hoot:review:note' ];

            if ( relationNote ) {
                noteText = relationNote;
            }
        }

        this.instance.metaDialog.html(
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