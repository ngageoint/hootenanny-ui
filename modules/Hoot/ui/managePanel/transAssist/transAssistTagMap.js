/*******************************************************************************************************
 * File: transAssistTagMap.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

import { tagInfo }    from '../../../../../data/index';
import { d3combobox } from '../../../../lib/hoot/d3.combobox';

export default class TransAssistTagMap {
    constructor( instance ) {
        this.instance = instance;
    }

    createTagLookup() {
        this.schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

        this.tagLookup = this.instance.tagMapContainer
            .insert( 'div', '.add-mapping-button' )
            .classed( 'tag-lookup round fill-white keyline-all', true );

        this.inputWrapper = this.tagLookup
            .append( 'div' )
            .classed( 'input-wrapper', true );

        this.inputWrapper
            .append( 'div' )
            .classed( 'pad1 thumbnail searchtag _icon big blank search-icon keyline-right', true );

        this.searchTag = this.inputWrapper.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Search Tag' )
            .classed( 'strong bigger pad1x pad2y reset', true )
            .on( 'input', () => this.change.call( this ) );

        this.resultsList = this.tagLookup
            .append( 'div' )
            .classed( 'results-list', true );

        this.searchTag.node().focus();
    }

    keydown() {
        switch ( d3.event.keyCode ) {
            // tab
            case 9:
                this.accept();
                break;
            // return
            case 13:
                d3.event.preventDefault();
                break;
            // up arrow
            case 38:
                scroll( 'up', this );
                d3.event.preventDefault();
                break;
            // down arrow
            case 40:
                scroll( 'down', this );
                d3.event.preventDefault();
                break;
        }
        d3.event.stopPropagation();
    }

    keyup() {
        switch ( d3.event.keyCode ) {
            // escape
            case 27:
                this.remove();
                break;
            // return
            case 13:
                this.accept();
                break;
        }
    }

    change() {
        let value = this.searchTag.property( 'value' ),
            results;

        if ( value.length ) {
            results = tagInfo[ this.schemaOption ]
                .filter( val => val.key && val.key.toLowerCase().indexOf( value.toLowerCase() ) > -1 )
                .sort( ( a, b ) => {
                    if ( a.key > b.key ) {
                        return 1;
                    }
                    if ( a.key < b.key ) {
                        return -1;
                    }
                    // a is equal to b
                    return 0;
                } );
        } else {
            results = [];
        }

        this.updateTagResults( results, value );
    }

    updateTagResults( results, value ) {
        let searchResult = this.resultsList.selectAll( '.search-result' )
            .data( results );

        searchResult
            .enter()
            .append( 'div' )
            .classed( 'search-result pad1x pad1y keyline-left keyline-top', true )
            .merge( searchResult )
            .html( d => {
                return !d || d.key.replace( value, '<span class="match">' + value + '</span>' );
            } )
            .on( 'click', d => {
                this.selectTag( this.tagLookup, d );
            } );

        searchResult.exit().remove();
    }

    accept() {
        let value = this.searchTag.property( 'value' );

        if ( value.length ) {
            let el     = this.resultsList.select( '.search-result:first-child' );
            //If selection is empty, use the user specified value as the tag key
            var d      = (!el.empty() && el.text() === value) ? el.datum() : { key: value, value: [] };
            var lookup = d3.select( this.searchTag.node().parentNode );
            //selectTag( lookup, d );
        }
    }

    remove() {
        this.inputWrapper.remove();
    }

    selectTag( tagLookup, d ) {
        let tagKey = d.key,
            values = d.value;

        this.instance.toggleNextButton( false );

        tagLookup.html( null );

        tagLookup
            .append( 'div' )
            .classed( 'translate-icon remove-tag inline thumbnail big _icon blank keyline-left', true )
            .on( 'click', () => {
                tagLookup.remove();
            } );

        tagLookup
            .append( 'div' )
            .classed( 'translate-icon map-type-icon remove-map-tag inline thumbnail big _icon blank keyline-left', true )
            .on( 'click', function() {
                let icon = d3.select( this );

                if ( icon.classed( 'remove-map-tag' ) ) {
                    icon.classed( 'remove-map-tag', false );
                    icon.classed( 'link-tag', true );

                    tagLookup.select( '.mapping-single' ).classed( 'hidden', false );
                    tagLookup.select( '.mapping-list' ).classed( 'hidden', true );
                } else if ( icon.classed( 'link-tag' ) ) {
                    icon.classed( 'link-tag', false );
                    icon.classed( 'map-tag', true );

                    tagLookup.select( '.mapping-single' ).classed( 'hidden', true );
                    tagLookup.select( '.mapping-list' ).classed( 'hidden', false );
                } else {
                    icon.classed( 'map-tag', false );
                    icon.classed( 'remove-map-tag', true );

                    tagLookup.select( '.mapping-single' ).classed( 'hidden', true );
                    tagLookup.select( '.mapping-list' ).classed( 'hidden', true );
                }
            } );

        tagLookup
            .append( 'label' )
            .classed( 'tag-key pad1 space-bottom0 center bigger', true )
            .text( tagKey );

        // single
        tagLookup
            .append( 'div' )
            .classed( 'mapping-wrapper mapping-single keyline-top hidden', true )
            .append( 'input' )
            .attr( 'id', d => 'preset-input-' + this.hashCode( tagKey ) )
            .attr( 'type', 'text' )
            .select( function() {
                let combobox = d3combobox()
                    .data( values.map( obj => {
                        return { title: obj.replace( '_', ' ' ), value: obj };
                    } ) );

                d3.select( this ).call( combobox );
            } );

        // list
        let attrMapList = tagLookup
            .append( 'div' )
            .classed( 'mapping-wrapper mapping-list keyline-top hidden', true )
            .append( 'ul' );

        let attrMapListRows = attrMapList
            .selectAll( 'li' )
            .data( this.instance.currentAttribute.value.values() )
            .enter()
            .append( 'li' )
            .classed( 'preset-row', true );

        attrMapListRows
            .append( 'div' )
            .classed( 'preset-key-wrap keyline-right', true )
            .append( 'span' )
            .text( d => d );

        attrMapListRows
            .append( 'div' )
            .append( 'input' )
            .attr( 'id', d => 'preset-input-' + this.hashCode( tagKey + d ) )
            .attr( 'type', 'text' )
            .select( function() {
                let combobox = d3combobox()
                    .data( values.map( obj => {
                        return { title: obj.replace( '_', ' ' ), value: obj };
                    } ) );

                d3.select( this ).call( combobox );
            } );

        let tagJson = this.instance.jsonMapping[ this.instance.layer ][ this.instance.currentAttribute.key ];

        if ( tagJson ) {
            let mapping = d3.map( tagJson );

            let isCustomized = mapping
                .entries()
                .filter( entry => d.key === entry.key && entry.value !== this.instance.currentAttribute.key );

            isCustomized.forEach( entry => {
                if ( typeof entry.value === 'string' ) { //entry is a single tag value
                    tagLookup.select( '.mapping-single' ).classed( 'hidden', false );

                    tagLookup.select( '.map-type-icon' )
                        .classed( 'remove-map-tag', false )
                        .classed( 'link-tag', true );

                    tagLookup.select( '#preset-input-' + this.hashCode( tagKey ) ).property( 'value', entry.value );
                } else { //entry is map of attr:tag values
                    tagLookup.select( '.mapping-list' ).classed( 'hidden', false );

                    tagLookup.select( '.map-type-icon' )
                        .classed( 'remove-map-tag', false )
                        .classed( 'map-tag', true );

                    d3.map( entry.value ).entries().forEach( e => {
                        d3.select( '#preset-input-' + this.hashCode( tagKey + e.key ) ).property( 'value', e.value );
                    } );
                }
            } );
        }
    }

    hashCode( input ) {
        let hash = 0, i, chr, len;

        if ( input.length === 0 ) return hash;

        for ( i = 0, len = input.length; i < len; i++ ) {
            chr  = input.charCodeAt( i );
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }

        return hash;
    }
}