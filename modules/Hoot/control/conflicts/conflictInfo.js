/*******************************************************************************************************
 * File: conflictMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

//import Event from '../../managers/eventManager';
import _ from 'lodash-es';

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

    updateMeta( note ) {

        //Event.send( 'meta-updated' );
    }

    buildPoiTable() {
        let f1      = this.filterTags( this.data.poiTableCols[ 0 ].tags ),
            f2      = this.filterTags( this.data.poiTableCols[ 1 ].tags ),
            fMerged = this.mergeTags( [ f1, f2 ] );

        let navHtml = '<div class="navigation-wrapper"><div class="prev">&lt;&lt;</div><div class="next">&gt;&gt;</div></div>';

        let poiTable = this.conflicts.container
            .insert( 'div', ':first-child' )
            .classed( 'tag-table block', true )
            .append( 'table' )
            .classed( 'round keyline-all', true );

        if ( this.data.currentEntity.members.length > 2 ) {
            let row = poiTable.append( 'tr' )
                .classed( 'table-head', true );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( 'Review Item' );

            row.selectAll( 'td.f1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col f1', true )
                .html( navHtml );

            row.selectAll( 'td.f2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col f2', true )
                .html( navHtml );
        }

        _.forEach( fMerged, tag => {
            let row = poiTable.append( 'tr' );

            row.append( 'td' )
                .classed( 'fillD', true )
                .text( _.startCase( tag.key ) );

            row.selectAll( 'td.f1' )
                .data( [ { k: 1 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col f1', true )
                .text( tag.value[ 0 ] );

            row.selectAll( 'td.f2' )
                .data( [ { k: 2 } ] ).enter()
                .append( 'td' )
                .classed( 'value-col f2', true )
                .text( tag.value[ 1 ] );
        } );

        poiTable.selectAll( '.value-col' )
            .on( 'mouseenter', d => d3.selectAll( `.actionReviewFeature${ d.k }` ).classed( 'extra-highlight', true ) )
            .on( 'mouseleave', d => d3.selectAll( `.actionReviewFeature${ d.k }` ).classed( 'extra-highlight', false ) );
    }

    filterTags( tags ) {
        return _.filter( d3.entries( tags ), tag => {
            return _.every( this.tagBlacklist, t => !tag.key.match( t ) );
        } );
    }

    mergeTags( tags ) {
        let tagKeys   = d3.set( _.map( _.flatten( tags ), 'key' ) ),
            mergedMap = d3.map();

        _.forEach( tagKeys, key => {
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
}