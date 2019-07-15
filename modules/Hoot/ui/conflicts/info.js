/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _every     from 'lodash-es/every';
import _filter    from 'lodash-es/filter';
import _flatten   from 'lodash-es/flatten';
import _forEach   from 'lodash-es/forEach';
import _map       from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import { modeSelect } from '../../../modes';
import Map  from './map';

export default class ConflictMetadata {
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;
        Hoot.context.history().on('change', function() {
            if ( Hoot.ui.conflicts.resolve.noBuild === null ) {
                Hoot.ui.conflicts.info.buildTagTable();
            }
        });

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
        if (this.data.currentFeatures !== null) {
            // turn currentFeatures into list of entity ids for entities only in graph
            // map that filtered list into list of tags, so pass each through filterTags I guess
            // take that list and put it through mergedTags.
            let colData    = this.data.currentFeatures,
            tags1      = this.filterTags( colData[ 0 ] ? Hoot.context.graph().entity(colData[ 0 ].id).tags : {} ),
            tags2 = this.filterTags(colData[0] ? Hoot.context.graph().entity(colData[1].id).tags : {}),
            // map this to an array of lists, rather than the list of objects it is now.
            // right now it is { key: 'tagKey', values: [..list of values] }
            // our lives would be easier if it was a single list with the tagKey as the first element.
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

        // here is where we can do some enter/update/exit.
        // no longer should we do the for each.
        // Instead you'll want to do 2 levels of data binding.
        // first for the table rows, binding the mergedTags list of lists.
        // then inside each table row, bind each inner list to td elements.

        // for a reference to doing enter/update/exit, see the advanced options class.

        _forEach(tagsMerged, tag => {
            let row = this.poiTable.append( 'tr' );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( _startCase( tag.key ) );

            row.selectAll( 'td.feature1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature1', true )
                .text( tag.value[ 0 ] );

            row.selectAll( 'td.value-col.feature1' )
                .on('click', () => {
                    this.panToEntity(this.data.currentFeatures[0]);
                    this.selectEntity(this.data.currentFeatures[0]);
                });

            row.selectAll( 'td.feature2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col feature2', true )
                .text( tag.value[ 1 ] );

            row.selectAll( 'td.value-col.feature2' )
                .on('click', () => {
                    this.panToEntity(this.data.currentFeatures[1]);
                    this.selectEntity(this.data.currentFeatures[1]);
                });
        } );

        this.poiTable.selectAll( '.value-col' )
            .on( 'mouseenter', d => d3.selectAll( `.review-feature${ d.k }` ).classed( 'extra-highlight', true ) )
            .on( 'mouseleave', d => d3.selectAll( `.review-feature${ d.k }` ).classed( 'extra-highlight', false ) );
        }

    }

    /**
     * Remove stale column of tags once user merges feature tags
     */

    removeColumn() {
        if ( this.data.currentFeatures !== null ) {

            this.tableContainer.remove();

            this.tableContainer = this.instance.rightContainer
                .insert( 'div', ':first-child' )
                .classed( 'tag-table', true );

            let colData = this.data.currentFeatures,
            tags1       = this.filterTags( colData[ 0 ] ? Hoot.context.graph().entity(colData[ 0 ].id).tags : {} ),
            orderTags   = this.mergeTags( [tags1] );

            this.poiTable = this.tableContainer.append( 'table' );

            _forEach( orderTags, tag => {
                let row = this.poiTable.append( 'tr' )
                .classed( 'table-head', true );

                row.append( 'td' )
                    .classed( 'fillD', true )
                    .text( _startCase( tag.key ) );

                row.selectAll( 'td.feature1' )
                    .data( [ { k: 1 } ] ).enter()
                    .append( 'td' )
                    .classed( 'value-col feature1', true )
                    .text( tag.value );
            } );
        }
    }

    selectEntity(entity) {
        Hoot.context.enter(modeSelect(Hoot.context, [entity.id]));
    }

    /**
     * Pan to feature with conflict
     */

    panToEntity(feature) {
        let extent = feature.extent(Hoot.context.graph());
        Hoot.context.map().centerZoom(extent.center(), Map.getZoomFromExtent(extent));
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
        return _filter( d3.entries( tags ), tag => {
            return _every( this.tagBlacklist, t => !tag.key.match( t ) );
        } );
    }

    /**
     * Create a map of unique tags between features
     *
     * @param tags - feature tags
     * @returns {IterableIterator} - map of unique tags
     */
    mergeTags( tags ) {
        let tagKeys   = d3.set( _map( _flatten( tags ), 'key' ) ),
            mergedMap = d3.map();

        _forEach( tagKeys.values().sort(), key => {
            mergedMap.set( key, [] );

            _forEach( tags, tag => {
                let tagMap = d3.map();

                _forEach( tag, t => {
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
        let noteText        = '',
            currentMeta     = this.data.reviewStats,
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

        Hoot.events.emit( 'meta-updated', `There are ${ nUnreviewed } reviews` );
    }
}
