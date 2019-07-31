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
import _debounce from  'lodash-es/debounce';
import { modeSelect } from '../../../modes';
import Map  from './map';

export default class ConflictMetadata {
    constructor( instance ) {
        this.instance = instance;
        this.data     = instance.data;
        Hoot.context.history().on('change.reviewtagtable',
            _debounce( () => this.buildTagTable.bind(this)(), 300)
        );

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
        if ( this.data.currentFeatures !== null ) {

            let colData    = this.data.currentFeatures;
            let mergeCheck = Object.values(Hoot.context.graph().entities).length > 0,
            tags1      = this.filterTags( colData[ 0 ] ? Hoot.context.graph().entity( colData[ 0 ].id).tags : {} ),
            tags2      = this.filterTags( colData[ 1 ] ? Hoot.context.graph().entity( colData[ 1 ].id).tags : {} ),
            tagsMerged = this.mergeTags( [ tags1, tags2 ] );

            this.tableContainer = this.instance.rightContainer
                .selectAll( '.tag-table' )
                .data([ 0 ]);

            this.tableContainer.exit().remove();

            this.tableContainer = this.tableContainer
                .enter()
                .append( 'table' )
                .classed( 'tag-table', true )
                .merge( this.tableContainer );

            var rows = this.tableContainer
                .selectAll( 'tr' )
                .data( tagsMerged );

            rows.exit().remove();

            rows = rows
                .enter()
                .append( 'tr' )
                .merge( rows );

            var tableKeys = rows
                .selectAll( 'td' )
                .data( function(d) { return [d.key]; } );

            tableKeys.exit().remove();

            tableKeys = tableKeys
                .enter()
                .append( 'td' )
                .classed( 'fillD', true )
                .merge( tableKeys )
                .text( function(d) { return d; } );

            if ( this.instance.merge.mergeArrow.to !== null && this.instance.merge.mergeArrow.to.origid === Object.values( Hoot.context.graph().entities)[0].origid ) {

                var reverseData = rows
                    .selectAll( 'td.feature2' )
                    .data( function(d) { return [d.value[1]]; } );

                reverseData.exit().remove();

                reverseData = reverseData
                    .enter()
                    .append( 'td' )
                    .classed( 'value-col feature2', true )
                    .merge( reverseData )
                    .text( function(d) { return d; })
                    .on('click', () => {
                        this.panToEntity(this.data.currentFeatures[0]);
                        this.selectEntity(this.data.currentFeatures[0]);
                    });
            }
            else {

                var tableData1 = rows
                .selectAll( 'td.feature1' )
                .data( function(d) { return [d.value[0]]; } );

                tableData1.exit().remove();

                tableData1 = tableData1
                    .enter()
                    .append( 'td' )
                    .classed( 'value-col feature1', true )
                    .merge( tableData1 )
                    .text( function(d) { return d; })
                    .on('click', () => {
                        this.panToEntity(this.data.currentFeatures[0]);
                        this.selectEntity(this.data.currentFeatures[0]);
                    });

                if ( !mergeCheck ) {
                    var tableData2 = rows
                        .selectAll( 'td.feature2' )
                        .data( function(d) { return [d.value[1]]; } );

                    tableData2.exit().remove();

                    tableData2 = tableData2
                        .enter()
                        .append( 'td' )
                        .classed( 'value-col feature2', true )
                        .merge( tableData2 )
                        .text( function(d) { return d; } )
                        .on('click', () => {
                            this.panToEntity(this.data.currentFeatures[1]);
                            this.selectEntity(this.data.currentFeatures[1]);
                        });
                }
            }
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
