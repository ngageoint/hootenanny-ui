/*******************************************************************************************************
 * File: tagMapWidget.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

import { sort } from 'd3';
import { d3combobox } from 'lib/hoot/d3.combobox';
import { services } from '../../../../services';

export default class TagMapWidget {
    constructor( instance ) {
        this.instance = instance;
    }

    createTagLookup() {
        let that = this;

        this.schemaOption = d3.select('#tagSchema').node().value;

        this.tagLookup = this.instance.tagMapContainer
            .insert( 'div', '.add-mapping-button' )
            .classed( 'tag-lookup round fill-white keyline-all', true );

        this.inputWrapper = this.tagLookup
            .append( 'div' )
            .classed( 'input-wrapper', true );

        this.inputWrapper
            .append( 'div' )
            .classed( 'pad1 thumbnail searchtag _icon big blank search-icon keyline-right', true );

        this.searchTag = this.inputWrapper.append('input')
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Search Tag' )
            .classed( 'strong bigger pad1x pad2y reset', true )
            .on( 'input', () => this.change.call(this) )
            .on( 'keyup', () => that.keyup() )
            .on( 'keydown', () => that.keydown(this) );


        this.resultsList = this.tagLookup
            .append( 'div' )
            .classed( 'results-list', true );

        this.searchTag.node().focus();

        if (!Hoot.config.tagInfo[this.schemaOption]) {
            Hoot.config.tagInfo[this.schemaOption] = [];
        }
        if (Hoot.config.tagInfo[this.schemaOption].length === 0) {
            (this.schemaOption === 'OSM'
                ?  new Promise(function(resolve, reject) {
                    services.taginfo.keys({}, function(err, data) {
                        if (!err) {resolve(data.map(v => { return v.value; }));}
                        else { reject(err);}
                    });
                })
                : Hoot.translations.getFieldMappings(this.schemaOption)
            )
            .then(resp => {
                Hoot.config.tagInfo[this.schemaOption] = resp;
            });
        }
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
                this.scroll( 'up' );
                d3.event.preventDefault();
                break;
            // down arrow
            case 40:
                this.scroll( 'down' );
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

    scroll( dir ) {
        let resultList = d3.select( this.searchTag.node().parentNode ).node().nextSibling,
            results    = this.resultsList.selectAll( 'div' );

        if ( results.size() ) {
            let tags = results.data().map( d => d.key );

            // get index of current
            let curIdx = tags.indexOf( this.searchTag.property( 'value' ) );

            // get height of element
            let height = results.nodes()[ 0 ].getBoundingClientRect().height;

            if ( dir === 'up' ) {
                curIdx -= 1;
            }
            else if ( dir === 'down' ) {
                curIdx += 1;
            }

            curIdx = curIdx < 0 ? 0 : curIdx;
            curIdx = curIdx > tags.length - 1 ? tags.length - 1 : curIdx;

            // scroll to curIdx
            resultList.scrollTop = curIdx * height;

            this.searchTag.property( 'value', tags[ curIdx ] );

            this.currentTags = tags;
        }
    }

    async change() {
        let value = this.searchTag.property( 'value' ),
            results;
        if ( value.length ) {
            if (this.schemaOption === 'OSM') {
                results = await new Promise(function(resolve, reject) {
                    services.taginfo.keys({
                        debounce: true,
                        query: value
                    }, function(err, data) {
                        if (!err) {resolve(data.map(v => { return v.value; }));}
                        else { reject(err);}
                    });
                })
                .then(data => data)
                .catch(() => []);
            } else {
                results = Hoot.config.tagInfo[this.schemaOption].filter( val => val.toLowerCase().indexOf( value.toLowerCase() ) > -1 );
            }
        } else {
            results = [];
        }
        results.sort( ( a, b ) => {
            if ( a > b ) {
                return 1;
            }
            if ( a < b ) {
                return -1;
            }
            // a is equal to b
            return 0;
        } );

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
                return !d || d.replace( value, '<span class="match">' + value + '</span>' );
            } )
            .on( 'click', d => this.selectTag( d ) );

        searchResult.exit().remove();
    }

    accept() {
        let value = this.searchTag.property( 'value' );

        if ( value.length ) {
            let el = this.resultsList.select( '.search-result:first-child' );

            //If selection is empty, use the user specified value as the tag key
            let d = (!el.empty() && el.text() === value) ? el.datum() : { key: value, value: [] };

            this.selectTag( d );
        }
    }

    remove() {
        this.tagLookup.remove();
    }

    selectTag( d ) {
        let that = this;
        let tagKey = d;
        ( this.schemaOption === 'OSM'
            ? new Promise(function (resolve, reject) {
                services.taginfo.values({
                    key: tagKey,
                }, function (err, data) {
                    data = data.length === 0 ? [{value: 'Value'}] : data;
                    if (!err) { resolve(data.map(v => { return v.value; })); }
                    else { reject(err); }
                });
            })
            : Hoot.translations.getColumns(tagKey.split('::')[0], this.schemaOption)
        )
        .then((values) => {
            this.instance.toggleNextButton( false );

            this.tagLookup.html( null );

            this.tagLookup
                .append( 'div' )
                .classed( 'translate-icon remove-tag inline thumbnail big _icon blank keyline-left', true )
                .on( 'click', () => this.tagLookup.remove() );

            this.tagLookup
                .append( 'div' )
                .classed( 'translate-icon map-type-icon remove-map-tag inline thumbnail big _icon blank keyline-left', true )
                .on( 'click', function () {
                    let icon = d3.select( this );

                    if ( icon.classed( 'remove-map-tag' ) ) {
                        icon.classed( 'remove-map-tag', false );
                        icon.classed( 'link-tag', true );

                        that.tagLookup.select( '.mapping-single' ).classed( 'hidden', false );
                        that.tagLookup.select( '.mapping-list' ).classed( 'hidden', true );
                    } else if ( icon.classed( 'link-tag' ) ) {
                        icon.classed( 'link-tag', false );
                        icon.classed( 'map-tag', true );

                        that.tagLookup.select( '.mapping-single' ).classed( 'hidden', true );
                        that.tagLookup.select( '.mapping-list' ).classed( 'hidden', false );
                    } else {
                        icon.classed( 'map-tag', false );
                        icon.classed( 'remove-map-tag', true );

                        that.tagLookup.select( '.mapping-single' ).classed( 'hidden', true );
                        that.tagLookup.select( '.mapping-list' ).classed( 'hidden', true );
                    }
                } );

            this.tagLookup
                .append( 'label' )
                .classed( 'tag-key pad1 space-bottom0 center bigger', true )
                .text( tagKey );

            // single
            this.tagLookup
                .append( 'div' )
                .classed( 'mapping-wrapper mapping-single keyline-top hidden', true )
                .append( 'input' )
                .attr( 'id', () => 'preset-input-' + this.hashCode(tagKey ) )
                .attr( 'type', 'text' )
                .select( function () {
                    let combobox = d3combobox()
                        .data( values.map( obj => {
                            return { title: obj.replace( '_', ' ' ), value: obj };
                        } ) );

                    d3.select( this ).call( combobox );
                } );

            // list
            let attrMapList = this.tagLookup
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
                .select( function () {
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
                        this.tagLookup.select( '.mapping-single' ).classed( 'hidden', false );

                        this.tagLookup.select( '.map-type-icon' )
                            .classed( 'remove-map-tag', false )
                            .classed( 'link-tag', true );

                        this.tagLookup.select( '#preset-input-' + this.hashCode( tagKey ) ).property( 'value', entry.value );
                    } else { //entry is map of attr:tag values
                        this.tagLookup.select( '.mapping-list' ).classed( 'hidden', false );

                        this.tagLookup.select( '.map-type-icon' )
                            .classed( 'remove-map-tag', false )
                            .classed( 'map-tag', true );

                        d3.map( entry.value ).entries().forEach( e => {
                            d3.select( '#preset-input-' + this.hashCode( tagKey + e.key ) ).property( 'value', e.value );
                        } );
                    }
                } );
            } } );
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
