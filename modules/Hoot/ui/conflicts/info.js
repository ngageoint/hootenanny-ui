/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _debounce  from  'lodash-es/debounce';
import _every     from 'lodash-es/every';
import _filter    from 'lodash-es/filter';
import _flatten   from 'lodash-es/flatten';
import _forEach   from 'lodash-es/forEach';
import _map       from 'lodash-es/map';
import { modeSelect } from '../../../modes';
import Map  from './map';

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

        Hoot.context.history().on('change.reviewtagtable',
            _debounce( () => this.buildTagTable.bind(this), 300)
        );
    }

    /**
     * Create tag table for revieawble items
     */
    buildTagTable() {
        let currentRelation;
        try {
            currentRelation = this.instance.graphSync.getCurrentRelation();
        } catch (e) {
            //current relation not found which is ok
        }
        //if triggered by history change and not in review mode return
        if (!currentRelation) return;

        let features = this.data.currentFeatures,
            feature = features[0] ? Hoot.context.hasEntity( features[0].id ) : null,
            againstFeature = features[1] ? Hoot.context.hasEntity( features[1].id ) : null;

        let colData = [feature, againstFeature];

        let tags1      = this.filterTags( colData[ 0 ] ? colData[ 0 ].tags : {} ),
            tags2      = this.filterTags( colData[ 1 ] ? colData[ 1 ].tags : {} ),
            tagsMerged = this.mergeTags( [ tags1, tags2 ] );

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

        _forEach( tagsMerged, ([key, value]) => {
            let row = this.poiTable.append( 'tr' );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( key );

            row.selectAll( 'td.feature1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .attr('title', value[0])
                .classed( 'value-col feature1', true )
                .text( value[0] );

            row.selectAll( 'td.value-col.feature1' )
                .on('click', () => {
                    this.panToEntity(this.data.currentFeatures[0]);
                    this.selectEntity(this.data.currentFeatures[0]);
                });

            row.selectAll( 'td.feature2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .attr('title', value[1])
                .classed( 'value-col feature2', true )
                .text( value[1] );

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
        return _filter( Object.entries( tags ), ([key, value]) => {
            return _every( this.tagBlacklist, t => !key.match( t ) );
        } );
    }

    /**
     * Create a map of unique tags between features
     *
     * @param tags - feature tags
     * @returns {IterableIterator} - map of unique tags
     */
    mergeTags( tags ) {
        let tagKeys   = new Set( _map( _flatten( tags ), 'key' ) ),
            mergedMap = new Map();

        _forEach( tagKeys.values().sort(), key => {
            mergedMap.set( key, [] );

            _forEach( tags, tag => {
                let tagMap = new Map();

                _forEach( tag, t => {
                    tagMap.set( t.key, t.value );
                } );

                mergedMap.get( key ).push( tagMap.has( key ) ? tagMap.get( key ) : null );
            } );
        } );

        return Object.entries(mergedMap);
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
