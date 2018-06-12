/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

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

        this.createUploadForm();
        this.createSchemaSelector();
        this.createUploadButtons();
    }

    createUploadForm() {
        this.uploadForm = this.panelContent
            .append( 'form' )
            .classed( 'trans-assist-form round keyline-all', true );
    }

    createSchemaSelector() {
        let schema = this.uploadForm
            .append( 'div' )
            .classed( 'schema-select-container fill-dark0', true );

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
            .classed( 'upload-button-container pad1x pad2y', true )
            .selectAll( 'button' )
            .data( transAssistButtons );

        let buttons = buttonContainer
            .enter()
            .append( 'button' )
            .classed( 'primary text-light flex align-center', true )
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
                instance.processSchemaData.call( this, d.uploadType );
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

    async processSchemaData( type ) {
        let formData = new FormData();

        for ( let i = 0; i < this.files.length; i++ ) {
            let file = this.files[ i ];
            formData.append( i, file );
        }

        // reset the file input value so on change will fire
        // if the same files/folder is selected twice in a row
        this.value = null;

        let upload     = await API.uploadSchemaData( type, formData ),
            attrValues = await API.getSchemaAttrValues( upload );

        console.log( attrValues );
    }
}