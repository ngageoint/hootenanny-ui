/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _                      from 'lodash-es';
import API                    from '../control/api';
import { transAssistButtons } from '../config/domElements';
import { tagInfo }            from '../../../data/index';
import Tab                    from './tab';

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
            .classed( 'ta-schema-select fill-dark0', true );

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
            .classed( 'action-buttons', true )
            .selectAll( 'button' )
            .data( transAssistButtons );

        let buttons = buttonContainer
            .enter()
            .append( 'button' )
            .classed( 'primary text-light big flex align-center', true )
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

        this.mappingForm = this.panelContent
            .append( 'form' )
            .classed( 'ta-attribute-mapping keyline-all round', true );

        this.changeLayer( layer );
    }

    changeLayer( newLayer ) {
        this.layer           = newLayer;
        this.attributeValues = this.valuesMap[ this.layer ];

        if ( !this.currentIndex[ this.layer ] ) this.currentIndex[ this.layer ] = 0;

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

        this.currentAttribute = this.attributesContainer
            .append( 'div' )
            .classed( 'current-attribute pad2y fill-white', true );

        //this.attributesName = this.currentAttribute
        //    .append( 'div' )
        //    .classed( 'attributes-name center strong', true );
        //
        //this.attributesSample = this.currentAttribute
        //    .append( 'div' )
        //    .classed( 'attributes-sample italic center quiet', true );

        this.attributesContainer.exit().remove();
    }

    createTagMapContainer() {
        this.tagMapContainer = this.mappingForm
            .append( 'div' )
            .classed( 'tag-map-container fill-white keyline-bottom keyline-top', true );

        this.tagMapContainer
            .append( 'button' )
            .classed( 'add-mapping-button round _icon big plus', true )
            .on( 'click', () => {
                d3.event.preventDefault();
                this.createTagLookup();
            } );
    }

    createTagLookup() {
        let that = this;
        let schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

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
            .on( 'input', change );

        let resultsList = tagLookup
            .append( 'div' )
            .classed( 'results-list', true );

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
                } );

            searchResult.exit().remove();
        }
    }

    createMappingActionButtons() {
        this.actionButtonContainer = this.mappingForm
            .append( 'div' )
            .classed( 'actions-container action-buttons fill-white', true );

        this.actionButtonContainer
            .append( 'button' )
            .classed( 'secondary big round', true )
            .text( 'Ignore' );

        this.actionButtonContainer
            .append( 'button' )
            .classed( 'dark text-light big round', true )
            .text( 'Next' );
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

    updateAttributes() {
        let allAttributes    = this.attributesContainer.datum().entries(),
            currentAttribute = allAttributes[ this.currentIndex[ this.layer ] ],
            attributeList    = _.filter( allAttributes, attribute => attribute.key !== currentAttribute.key );

        this.attributesCount
            .text( d => `${ this.currentIndex[ this.layer ] + 1 } of ${ d.keys().length } Attributes` );

        this.attributesName = this.currentAttribute
            .selectAll( '.attributes-name' )
            .data( [ currentAttribute ] )
            .enter()
            .append( 'div' )
            .classed( 'attributes-name center strong', true )
            .text( d => d.key )
            .on( 'click', () => {
                this.toggleAttributeList();
            } );

        this.attributesList = this.currentAttribute
            .append( 'div' )
            .classed( 'attributes-list', true );

        this.attributesList
            .append( 'div' )
            .classed( 'inner-wrapper', true )
            .selectAll( '.list-option' )
            .data( attributeList )
            .enter()
            .append( 'div' )
            .classed( 'list-option center', true )
            .text( d => d.key );

        this.attributesSample = this.currentAttribute
            .selectAll( '.attributes-sample' )
            .data( [ currentAttribute ] )
            .enter()
            .append( 'div' )
            .classed( 'attributes-sample center quiet', true )
            .text( d => {
                return _.reduce( d.value.values(), ( prev, curr, idx ) => {
                    if ( idx === 3 ) {
                        return prev + '...';
                    }
                    if ( idx > 3 ) {
                        return prev;
                    }

                    return prev + ', ' + curr;
                } );
            } );
    }

    toggleAttributeList() {
        let list        = this.attributesList,
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
        this.attributesSample.classed( 'hide', !listState );
    }
}