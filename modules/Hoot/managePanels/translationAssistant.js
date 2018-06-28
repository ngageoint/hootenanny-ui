/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _                      from 'lodash-es';
import API                    from '../control/api';
import { transAssistButtons } from '../config/domElements';
import { tagInfo }            from '../../../data/index';
import { d3combobox }         from '../../lib/hoot/d3.combobox';
import Tab                    from './tab';
import TranslationSaveForm   from './translationAssistant/translationSaveForm';

/**
 * Creates the translation-assistant tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TranslationAssistant extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Translation Assistant';
        this.id   = 'manage-translation-assistant';

        this.schemaOptions = [
            {
                name: 'OSM',
                enabled: true,
                checked: true
            },
            {
                name: 'TDSv61',
                enabled: true
            }
        ];

        this.jsonMapping = {};
    }

    render() {
        super.render();

        this.createUploadForm();
        this.createSchemaSelector();
        this.createUploadButtons();
    }

    createUploadForm() {
        this.uploadForm = this.panelContent
            .append( 'form' )
            .classed( 'ta-upload-form round keyline-all fill-white', true );
    }

    createSchemaSelector() {
        let schema = this.uploadForm
            .append( 'div' )
            .classed( 'ta-schema-select fill-dark0 keyline-bottom', true );

        schema
            .append( 'label' )
            .classed( 'inline', true )
            .html( 'Tag Schema' );

        let schemaOpts = schema
            .selectAll( 'span' )
            .data( this.schemaOptions )
            .enter()
            .append( 'span' )
            .classed( 'inline pad0', true );

        schemaOpts.append( 'input' )
            .classed( 'inline schema-option', true )
            .attr( 'type', 'radio' )
            .attr( 'name', 'schema' )
            .attr( 'id', d => d.name )
            .attr( 'value', d => d.name )
            .property( 'disabled', d => !d.enabled )
            .property( 'checked', d => d.checked );

        schemaOpts.append( 'label' )
            .classed( 'inline', true )
            .attr( 'for', d => d.name )
            .html( d => d.name );
    }

    createUploadButtons() {
        let instance = this;

        let buttonContainer = this.uploadForm
            .append( 'div' )
            .classed( 'button-row pad2', true )
            .selectAll( 'button' )
            .data( transAssistButtons );

        let buttons = buttonContainer
            .enter()
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'primary text-light big', true )
            .on( 'click', function( d ) {
                d3.select( this ).select( 'input' ).node().click();
            } );

        buttons
            .append( 'input' )
            .attr( 'type', 'file' )
            .attr( 'name', 'taFiles' )
            .attr( 'multiple', true )
            .attr( 'accept', '.shp, .shx, .dbf, .zip' )
            .classed( 'hidden', true )
            .on( 'click', () => d3.event.stopPropagation() )
            .on( 'change', function( d ) {
                instance.processSchemaData( d3.select( this ).node(), d.uploadType )
                    .then( valuesMap => instance.initMapping( valuesMap ) );
            } );

        buttons
            .append( 'i' )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons
            .append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );
    }

    async processSchemaData( input, type ) {
        try {
            let formData = new FormData();

            for ( let i = 0; i < input.files.length; i++ ) {
                let file = input.files[ i ];
                formData.append( i, file );
            }

            // reset the file input value so on change will fire
            // if the same files/folder is selected twice in a row
            input.value = null;

            let upload     = await API.uploadSchemaData( type, formData ),
                attrValues = await API.getSchemaAttrValues( upload );

            return this.convertUniqueValues( attrValues );

        } catch ( e ) {
            throw new Error( 'Unable to process schema data.' );
        }
    }

    convertUniqueValues( json ) {
        let obj = {};

        d3.values( json ).forEach( v => {
            d3.entries( v ).forEach( e => {
                let map = d3.map();

                d3.entries( e.value ).forEach( a => {
                    //Omit empty fields
                    if ( a.value.length ) {
                        map.set( a.key, d3.set( a.value ) );
                    }
                } );

                obj[ e.key ] = map;
            } );
        } );

        return obj;
    }

    initMapping( valuesMap ) {
        let layers = d3.keys( valuesMap ),
            layer  = layers[ 0 ];

        this.currentIndex = {};
        this.valuesMap    = valuesMap; // hoot1: attributeValues

        if ( this.mappingForm ) {
            this.mappingForm.remove();
        }

        this.mappingForm = this.panelContent
            .append( 'form' )
            .classed( 'ta-attribute-mapping keyline-all round', true );

        this.changeLayer( layer );
    }

    changeLayer( newLayer ) {
        this.layer           = newLayer;
        this.attributeValues = this.valuesMap[ this.layer ];

        this.currentIndex[ this.layer ] = this.currentIndex[ this.layer ] || 0;
        this.jsonMapping[ this.layer ]  = this.jsonMapping[ this.layer ] || {};

        this.createAttributesContainer();
        this.createTagMapContainer();
        this.createMappingActionButtons();

        this.updateAttributes();
    }

    createAttributesContainer() {
        this.attributesContainer = this.mappingForm
            .selectAll( '.attributes-container' )
            .data( [ this.attributeValues ] )
            .enter()
            .append( 'div' )
            .classed( 'attributes-container', true );

        this.attributesNav = this.attributesContainer
            .append( 'div' )
            .classed( 'attributes-nav fill-dark text-light center strong pad0y', true );

        this.attributesNav
            .append( 'div' )
            .classed( 'arrow-icon back-arrow text-light', true )
            .on( 'click', () => this.back() );

        this.attributesNav
            .append( 'div' )
            .classed( 'arrow-icon forward-arrow text-light', true )
            .on( 'click', () => this.forward() );

        this.attributesCount = this.attributesNav
            .insert( 'div', '.back-arrow + *' )
            .classed( 'attributes-count text-light pad1x', true );

        this.attributesDisplay = this.attributesContainer
            .append( 'div' )
            .classed( 'current-attribute fill-white', true );

        this.attributesName = this.attributesDisplay
            .append( 'div' )
            .classed( 'attributes-name center strong', true )
            .on( 'click', () => {
                this.toggleAttributeList();
            } );

        this.attributesList = this.attributesDisplay
            .append( 'div' )
            .classed( 'attributes-list', true )
            .append( 'div' )
            .classed( 'inner-wrapper', true );

        this.attributesSample = this.attributesDisplay
            .append( 'div' )
            .classed( 'attributes-sample', true );

        this.attributesSample.append( 'span' )
            .classed( 'center quiet', true );

        this.attributesContainer.exit().remove();
    }

    createTagMapContainer() {
        this.tagMapContainer = this.mappingForm
            .append( 'div' )
            .classed( 'tag-map-container pad2 fill-white', true );

        this.tagMapContainer
            .append( 'button' )
            .classed( 'add-mapping-button round _icon big plus', true )
            .on( 'click', () => {
                d3.event.preventDefault();
                this.createTagLookup();
            } );
    }

    createTagLookup() {
        let that         = this,
            schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

        let tagLookup = this.tagMapContainer
            .insert( 'div', '.add-mapping-button' )
            .classed( 'tag-lookup round fill-white keyline-all', true );

        let inputWrapper = tagLookup
            .append( 'div' )
            .classed( 'input-wrapper', true );

        inputWrapper
            .append( 'div' )
            .classed( 'pad1 thumbnail searchtag _icon big blank search-icon keyline-right', true );

        let searchTag = inputWrapper.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Search Tag' )
            .classed( 'strong bigger pad1x pad2y reset', true )
            .on( 'input', () => change.call( this ) );

        let resultsList = tagLookup
            .append( 'div' )
            .classed( 'results-list', true );

        searchTag.node().focus();

        function keydown() {
            switch ( d3.event.keyCode ) {
                // tab
                case 9:
                    accept();
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

        function keyup() {
            switch ( d3.event.keyCode ) {
                // escape
                case 27:
                    remove();
                    break;
                // return
                case 13:
                    accept();
                    break;
            }
        }

        function change() {
            let value = searchTag.property( 'value' ),
                results;

            if ( value.length ) {
                results = tagInfo[ schemaOption ]
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

            updateTagResults( results, value );
        }

        function updateTagResults( results, value ) {
            let searchResult = resultsList.selectAll( '.search-result' )
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
                    that.selectTag( tagLookup, d );
                } );

            searchResult.exit().remove();
        }

        function accept() {
            let value = searchTag.property( 'value' );

            if ( value.length ) {
                let el     = resultsList.select( '.search-result:first-child' );
                //If selection is empty, use the user specified value as the tag key
                var d      = (!el.empty() && el.text() === value) ? el.datum() : { key: value, value: [] };
                var lookup = d3.select( searchTag.node().parentNode );
                //selectTag( lookup, d );
            }
        }

        function remove() {
            inputWrapper.remove();
        }
    }

    createMappingActionButtons() {
        this.actionButtonContainer = this.mappingForm
            .append( 'div' )
            .classed( 'actions-container action-buttons pad2 fill-white', true );

        let row1 = this.actionButtonContainer
            .append( 'div' )
            .classed( 'button-row', true );

        row1
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'ignore-button secondary big round', true )
            .text( 'Ignore' )
            .on( 'click', () => {
                d3.event.preventDefault();

                let originalKey = this.attributesContainer.datum().keys()[ this.currentIndex[ this.layer ] ],
                    mapping     = 'IGNORED';

                this.updateMappingJson( originalKey, mapping );
            } );

        row1
            .append( 'button' )
            .attr( 'type', 'button' )
            .attr( 'disabled', true )
            .classed( 'next-button dark text-light big round', true )
            .text( 'Next' )
            .on( 'click', () => {
                d3.event.preventDefault();

                let originalKey = this.attributesContainer.datum().keys()[ this.currentIndex[ this.layer ] ],
                    mapping     = this.buildAttributeMappingJson( originalKey );

                this.updateMappingJson( originalKey, mapping );
            } );
    }

    updateAttributes() {
        let allAttributes    = this.attributesContainer.datum().entries(),
            currentAttribute = allAttributes[ this.currentIndex[ this.layer ] ],
            attributeList    = _.filter( allAttributes, attribute => attribute.key !== currentAttribute.key );

        this.attributesCount
            .text( d => `${ this.currentIndex[ this.layer ] + 1 } of ${ d.keys().length } Attributes` );

        this.attributesName
            .html( this.getAttributeStatus( currentAttribute.key ) );

        let list = this.attributesList
            .selectAll( '.list-option' )
            .data( attributeList );

        list.enter()
            .append( 'div' )
            .classed( 'list-option strong center', true )
            .merge( list )
            .html( d => this.getAttributeStatus( d.key ) );

        list.exit().remove();

        this.attributesSample
            .select( 'span' )
            .text( () => {
                return _.reduce( currentAttribute.value.values(), ( prev, curr, idx ) => {
                    if ( idx === 3 ) {
                        return prev + '...';
                    }
                    if ( idx > 3 ) {
                        return prev;
                    }

                    return prev + ', ' + curr;
                } );
            } );

        d3.selectAll( '.tag-lookup' ).remove();
        this.toggleNextButton();

        this.currentAttribute = currentAttribute;

        let tagJson = this.jsonMapping[ this.layer ][ currentAttribute.key ];

        if ( tagJson && tagJson !== 'IGNORED' ) {
            let mapping = d3.map( tagJson );

            mapping.entries().forEach( d => {
                let tagKey = d.key,
                    schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

                let values = tagInfo[ schemaOption ]
                    .filter( val => val.key && val.key.toLowerCase() === tagKey.toLowerCase() );

                let tagLookup = this.tagMapContainer
                    .insert( 'div', '.add-mapping-button' )
                    .classed( 'tag-lookup round fill-white keyline-all', true );

                this.selectTag( tagLookup, values.length ? values[ 0 ] : { key: tagKey, value: [] } );
            } );
        }

        if ( d3.entries( this.jsonMapping[ this.layer ] ).some( d => d.value !== 'IGNORED' ) ) {
            this.enableTranslate();
        }
    }

    buildAttributeMappingJson( originalKey ) {
        let json = {};

        d3.selectAll( '.tag-lookup' ).each( function() {
            let container = d3.select( this );

            if ( container.select( '.searchtag' ).empty() ) {
                let tagKey = container.select( '.tag-key' ).text(),
                    single = container.select( '.mapping-single' ),
                    list   = container.select( '.mapping-list' );

                if ( !list.classed( 'hidden' ) ) {
                    let values = {};

                    list.selectAll( 'li' ).each( function() {
                        let row = d3.select( this ),
                            k   = row.select( 'span' ).text();

                        values[ k ] = row.select( 'input' ).property( 'value' );
                    } );

                    let attrMap = d3.map( values );

                    if ( attrMap.values().some( obj => obj.length > 0 ) ) {
                        json[ tagKey ] = values;
                    } else {
                        json[ tagKey ] = originalKey;
                    }
                } else if ( !single.classed( 'hidden' ) ) {
                    let value = single.select( 'input' ).property( 'value' );

                    if ( value.length > 0 ) {
                        json[ tagKey ] = value;
                    } else {
                        json[ tagKey ] = originalKey;
                    }
                } else {
                    json[ tagKey ] = originalKey;
                }
            }
        } );

        return json;
    }

    getAttributeStatus( attribute ) {
        let status;

        if ( !this.jsonMapping[ this.layer ] || !this.jsonMapping[ this.layer ][ attribute ] ) {
            status = '&#9744;';
        } else if ( this.jsonMapping[ this.layer ][ attribute ] === 'IGNORED' ) {
            status = '&#9746;';
        } else {
            status = '&#9745;';
        }

        return `<span class="attribute-status">${status}</span> ${ attribute }`;
    }

    updateMappingJson( key, mapping ) {
        this.jsonMapping[ this.layer ][ key ] = mapping;
        this.forward();
    }

    back() {
        if ( this.currentIndex[ this.layer ] === 0 ) {
            this.currentIndex[ this.layer ] = this.attributeValues.size() - 1;
        } else {
            this.currentIndex[ this.layer ]--;
        }

        this.updateAttributes();
    }

    forward() {
        if ( this.currentIndex[ this.layer ] < this.attributeValues.size() - 1 ) {
            this.currentIndex[ this.layer ]++;
        } else {
            this.currentIndex[ this.layer ] = 0;
        }

        this.updateAttributes();
    }

    toggleNextButton( enable ) {
        enable = enable || Boolean( d3.select( '.tag-lookup' ).node() );

        this.actionButtonContainer.select( '.next-button' ).property( 'disabled', !enable );
    }

    toggleAttributeList() {
        let list        = this.attributesDisplay.select( '.attributes-list' ),
            listState   = list.classed( 'visible' ),
            listNode    = list.node(),
            wrapperNode = list.select( '.inner-wrapper' ).node();

        function onEnd() {
            listNode.removeEventListener( 'transitionend', onEnd );
            listNode.style.height    = 'auto';
            listNode.style.minHeight = wrapperNode.clientHeight + 'px';
            list.classed( 'no-transition', true );
        }

        if ( listNode.clientHeight ) {
            list.classed( 'no-transition', false );
            listNode.style.minHeight = '0';
            listNode.style.height    = wrapperNode.clientHeight + 'px';
            setTimeout( () => listNode.style.height = '0', 1 );
        } else {
            listNode.style.height = wrapperNode.clientHeight + 'px';
            listNode.addEventListener( 'transitionend', onEnd, false );
        }

        list.classed( 'visible', !listState );

        this.attributesName.classed( 'box-shadow', !listState );
        this.attributesSample.classed( 'box-shadow', !listState );
        this.attributesSample.select( 'span' ).classed( 'hide', !listState );
    }

    selectTag( tagLookup, d ) {
        let tagKey = d.key,
            values = d.value;

        this.toggleNextButton( false );

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
            .data( this.currentAttribute.value.values() )
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


        let tagJson = this.jsonMapping[ this.layer ][ this.currentAttribute.key ];

        if ( tagJson ) {
            let mapping = d3.map( tagJson );

            let isCustomized = mapping
                .entries()
                .filter( entry => d.key === entry.key && entry.value !== this.currentAttribute.key );

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

    enableTranslate() {
        if ( !this.actionButtonContainer.select( '.translate-button' ).empty() ) return;

        this.actionButtonContainer
            .append( 'div' )
            .classed( 'button-row', true )
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'translate-button primary big round _icon light conflate', true )
            .append( 'span' )
            .text( 'Save Translation' )
            .on( 'click', () => {
                let json   = JSON.stringify( this.jsonMapping, null, 4 ),
                    output = 'hoot.require(\'translation_assistant\')\n' +
                        '\n' +
                        'var attributeMapping = ' + json + ';\n' +
                        'var fcode;\n' +
                        'var schema;\n' +
                        '\n' +
                        '//translateToOsm - takes \'attrs\' and returns OSM \'tags\'\n' +
                        'var translateToOsm = function(attrs, layerName) {\n' +
                        '    return translation_assistant.translateAttributes(attrs, layerName, attributeMapping, fcode, schema);\n' +
                        '};\n';

                let schema = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

                if ( schema === 'TDSv61' ) {
                    let isValid = this.validateMapping();

                    if ( !isValid.state ) {
                        //TODO: handle error
                    }

                    output = output.replace( 'var schema;', `var schema = ${ schema };` );
                }

                if ( window.confirm( 'Do you want to add this to internal translation list?' ) ) {
                    new TranslationSaveForm( this, output ).render();
                }
            } );
    }

    validateMapping() {

    }

    showTranslations() {
        d3.select( '[data-id="#util-translations"]' ).node().click();
    }
}