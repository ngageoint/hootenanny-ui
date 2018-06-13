/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _                      from 'lodash-es';
import API                    from '../control/api';
import { transAssistButtons } from '../config/domElements';
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

        this.loadTags();
        this.createUploadForm();
        this.createSchemaSelector();
        this.createUploadButtons();
    }

    async loadTags() {
        let osm   = await API.getOSMTagInfo(),
            tds61 = await API.getTDSTagInfo();
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
        let layers = d3.values( valuesMap ),
            layer  = layers[ 0 ];

        this.valuesMap = valuesMap;

        this.createMappingForm();
        this.createAttributesContainer();
        this.createTagMapContainer();
        this.createMappingActionButtons();

        this.changeLayer( layer );
    }

    createMappingForm() {
        this.mappingForm = this.panelContent
            .append( 'form' )
            .classed( 'ta-attribute-mapping keyline-all round', true );
    }

    createAttributesContainer() {
        this.attributesContainer = this.mappingForm
            .append( 'div' )
            .classed( 'attributes-container', true );

        this.attributesNav = this.attributesContainer
            .append( 'div' )
            .classed( 'attributes-nav fill-dark text-light center strong pad0y', true );

        this.attributesNav
            .append( 'div' )
            .classed( 'arrow-icon back-arrow text-light', true )
            .on( 'click', () => '' );

        this.attributesNav
            .append( 'div' )
            .classed( 'arrow-icon forward-arrow text-light', true );

        this.attributeCount = this.attributesNav
            .insert( 'div', '.back-arrow + *' )
            .classed( 'attributes-count text-light pad1x', true );
    }

    createTagMapContainer() {
        this.tagMapContainer = this.mappingForm
            .append( 'div' )
            .classed( 'tag-map-container fill-white keyline-bottom keyline-top', true );

        this.tagMapContainer
            .append( 'button' )
            .classed( 'add-mapping-button round _icon big plus', true )
            .on( 'click', () => {

            } );

        this.tagLookup = this.tagMapContainer
            .insert( 'div', '.add-mapping-button' )
            .classed( 'tag-lookup round fill-white' );
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
            .classed( 'primary text-light big round', true )
            .text( 'Next' );
    }

    changeLayer( newLayer ) {

    }
}