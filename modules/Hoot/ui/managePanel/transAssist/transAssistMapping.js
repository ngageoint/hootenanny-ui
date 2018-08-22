/*******************************************************************************************************
 * File: transAssistMapping.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

import _                 from 'lodash-es';
import Hoot              from '../../../hoot';
import TransAssistTagMap from './transAssistTagMap';

export default class TransAssistMapping {
    constructor( instance ) {
        this.instance = instance;

        this.jsonMapping = {};
    }

    render( valuesMap ) {
        let layers = d3.keys( valuesMap ),
            layer  = layers[ 0 ];

        this.currentIndex = {};
        this.valuesMap    = valuesMap;

        if ( this.mappingForm ) {
            this.mappingForm.remove();
        }

        this.mappingForm = this.instance.panelWrapper
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
            .on( 'click', () => this.toggleAttributeList() );

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
                new TransAssistTagMap( this ).createTagLookup();
            } );
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
            .html( d => this.getAttributeStatus( d.key ) )
            .on( 'click', d => {
                this.currentIndex[ this.layer ] = _.findIndex( allAttributes, attr => attr.key === d.key );

                this.updateAttributes();
                this.toggleAttributeList();
            } );

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
                let tagKey       = d.key,
                    schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

                let values = Hoot.config.tagInfo[ schemaOption ]
                    .filter( val => val.key && val.key.toLowerCase() === tagKey.toLowerCase() );

                let tagLookup = this.tagMapContainer
                    .insert( 'div', '.add-mapping-button' )
                    .classed( 'tag-lookup round fill-white keyline-all', true );

                let tagMap = new TransAssistTagMap( this );

                tagMap.createTagLookup();
                tagMap.selectTag( tagLookup, values.length ? values[ 0 ] : { key: tagKey, value: [] } );
            } );
        }

        if ( d3.entries( this.jsonMapping[ this.layer ] ).some( d => d.value !== 'IGNORED' ) ) {
            this.enableTranslateButton();
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

    enableTranslateButton() {
        if ( !this.actionButtonContainer.select( '.translate-button' ).empty() ) return;

        let translateButton = this.actionButtonContainer
            .append( 'div' )
            .classed( 'button-row', true )
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'translate-button primary big round _icon light conflate', true )
            .on( 'click', async () => {
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

                let message = 'Do you want to add this to internal translation list?',
                    confirm = await Hoot.response.confirm( message );

                if ( confirm ) {
                    this.instance.openSaveForm( output );
                }
            } );

        translateButton
            .append( 'span' )
            .text( 'Save Translations' );
    }

    validateMapping() {

    }
}