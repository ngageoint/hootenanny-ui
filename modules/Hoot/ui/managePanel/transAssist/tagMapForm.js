/*******************************************************************************************************
 * File: tagMapForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

import _filter    from 'lodash-es/filter';
import _findIndex from 'lodash-es/findIndex';
import _reduce    from 'lodash-es/reduce';

import { d3combobox } from '../../d3.combobox';

import TagMapWidget from './tagMapWidget';

export default class TagMapForm {
    constructor( instance ) {
        this.instance = instance;

        this.jsonMapping = {};
    }

    render( valuesMap ) {
        this.layers = Object.keys( valuesMap );

        this.currentIndex = {};
        this.valuesMap    = valuesMap;

        this.changeLayer( this.layers[ 0 ] );
    }

    changeLayer( newLayer ) {
        this.layer           = newLayer;
        this.attributeValues = this.valuesMap[ this.layer ];

        this.currentIndex[ this.layer ] = this.currentIndex[ this.layer ] || 0;

        this.jsonMapping[ this.layer ]  = {};

        if ( this.mappingForm ) {
            this.mappingForm.remove();
        }

        this.mappingForm = this.instance.panelWrapper
            .append( 'form' )
            .classed( 'ta-attribute-mapping keyline-all round', true );

        this.createAttributesContainer();
        this.createTagMapContainer();
        this.createMappingActionButtons();

        this.updateAttributes();
    }

    createAttributesContainer() {
        let that = this;

        this.attributesContainer = this.mappingForm
            .selectAll( '.attributes-container' )
            .data( [ this.attributeValues ] );

        this.attributesContainer = this.attributesContainer
            .enter()
            .append( 'div' )
            .classed( 'attributes-container', true )
            .merge( this.attributesContainer );

        if ( this.layers.length > 1 ) {
            this.layersList = this.attributesContainer
                .append( 'div' )
                .classed( 'layer-select', true )
                .selectAll( 'input' )
                .data( [ this.layers ] );

            this.layersList
                .enter()
                .append( 'input' )
                .attr( 'type', 'text' )
                .attr( 'id', 'preset-input-layer' )
                .attr( 'value', this.layer )
                .on( 'change', function() {
                    that.changeLayer( this.value );
                } )
                .on( 'keydown', function(d3_event) {
                    if ( d3_event.keyCode === 13 ) {
                        d3.select( this ).dispatch( 'change' );
                    }
                } )
                .each( function( d ) {
                    d3.select( this )
                        .call( d3combobox()
                            .data( d.map( function( n ) {
                                return {
                                    value: n,
                                    title: n
                                };
                            } ) )
                        );
                } );
        }

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
    }

    createTagMapContainer() {
        this.tagMapContainer = this.mappingForm
            .append( 'div' )
            .classed( 'tag-map-container pad2 fill-white', true );

        this.tagMapContainer
            .append( 'button' )
            .classed( 'add-mapping-button round _icon big plus', true )
            .on( 'click', (d3_event) => {
                d3_event.preventDefault();
                new TagMapWidget( this ).createTagLookup();
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
            .on( 'click', (d3_event) => {
                d3_event.preventDefault();

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
            .on( 'click', (d3_event) => {
                d3_event.preventDefault();

                let originalKey = this.attributesContainer.datum().keys()[ this.currentIndex[ this.layer ] ],
                    mapping     = this.buildAttributeMappingJson( originalKey );

                this.updateMappingJson( originalKey, mapping );
            } );
    }

    updateAttributes() {
        let allAttributes    = Object.entries(this.attributeValues),
            currentAttribute = allAttributes[ this.currentIndex[ this.layer ] ],
            attributeList    = _filter( allAttributes, attribute => attribute.key !== currentAttribute.key );

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
            .on( 'click', (d3_event, d) => {
                this.currentIndex[ this.layer ] = _findIndex( allAttributes, ([key, value]) => key === d.key );

                this.updateAttributes();
                this.toggleAttributeList();
            } );

        list.exit().remove();

        this.attributesSample
            .select( 'span' )
            .text( () => {
                return _reduce( currentAttribute.value.values(), ( prev, curr, idx ) => {
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
            let mapping = new Map( tagJson );

            Object.entries(mapping).forEach( ([key, value]) => {
                let tagKey       = key,
                    schemaOption = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

                let values = Hoot.config.tagInfo[ schemaOption ]
                    .filter( val => val.key && val.key.toLowerCase() === tagKey.toLowerCase() );

                let tagMap = new TagMapWidget( this );

                tagMap.createTagLookup();
                tagMap.selectTag( values.length ? values[ 0 ] : { key: tagKey, value: [] } );
            } );
        }

        if ( Object.entries( this.jsonMapping[ this.layer ] ).some( ([key, value]) => value !== 'IGNORED' ) ) {
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

                    let attrMap = new Map( values );

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
                        'var translateToOsm = function(attrs, layerName) {\n' +
                        '    return translation_assistant.translateAttributes(attrs, layerName, attributeMapping, fcode, schema);\n' +
                        '};\n';

                let schema = d3.selectAll( '.schema-option:checked' ).attr( 'value' );

                switch (schema) {
                    case 'OSM':
                    default:
                        break;

                    case 'MGCP':
                    case 'TDSv61':
                    case 'TDSv70': {
                        let isValid = this.validateMapping(this.jsonMapping);

                        if ( !isValid.state ) {
                            Hoot.message.alert( { message:'A mapping for Feature Code is required for ' + isValid.layers.join(', '),
                                                  type:'warn',
                                                  keepOpen:true });
                            return;
                        }
                        output = output.replace('var schema;', 'var schema = \'' + schema + '\';');
                        break;
                    }
                }

                let message = 'Do you want to add this to internal translation list?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    this.instance.openSaveForm( output );
                }
            } );

        translateButton
            .append( 'span' )
            .text( 'Save Translations' );
    }

    // Make sure Feature Code was mapped
    // Every layer must have a Feature Code or be entirely ignored
    // At least one layer must be mapped (all layers cannot be entirely ignored)
    validateMapping(jsonMapping) {
        var lyrs = [];

        // this is taken from the Hoot UI 1.x code
        var rule1 = Object.entries(jsonMapping).every(function([key, value]) {
                var valid = Object.entries(value).some(function([subKey, subValue]) {
                    return typeof subValue === 'object' && Object.keys(subValue).find(function(f) {
                        return f.indexOf('Feature Code') > -1;
                        });
                    }) || Object.entries(value).every(function([subKey, subValue]) {
                    return typeof subValue === 'string' && subValue.indexOf('IGNORED') > -1;
                });
                if (!valid) lyrs.push(key);
                return valid;
            });

        var rule2 = Object.entries(jsonMapping).some(function([key, value]) {
                var valid = Object.entries(value).some(function([subKey, subValue]) {
                    return typeof subValue === 'object' && Object.keys(subValue).find(function(f) {
                        return f.indexOf('Feature Code') > -1;
                        });
                });
                if (!valid) lyrs.push('at least one layer');
                return valid;
            });

        return {state: rule1 && rule2, layers: lyrs};
    }
}
