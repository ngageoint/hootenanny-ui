/*******************************************************************************************************
 * File: transAssistUpload.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

import Hoot from '../../../hoot';

export default class TransAssistUpload {
    constructor( instance ) {
        this.instance = instance;

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

        this.uploadButtons = [
            {
                title: 'Upload File(s)',
                icon: 'play_for_work',
                uploadType: 'FILE'
            },
            {
                title: 'Upload Folder',
                icon: 'move_to_inbox',
                uploadType: 'DIR'
            }
        ];
    }

    render() {
        this.createUploadForm();
        this.createSchemaSelector();
        this.createUploadButtons();
    }

    createUploadForm() {
        this.uploadForm = this.instance.panelWrapper
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
        let that = this;

        let buttonContainer = this.uploadForm
            .append( 'div' )
            .classed( 'button-row pad2', true )
            .selectAll( 'button' )
            .data( this.uploadButtons );

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
                that.processSchemaData( d3.select( this ).node(), d.uploadType )
                    .then( valuesMap => that.instance.initMapping( valuesMap ) );
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

            let upload     = await Hoot.api.uploadSchemaData( type, formData ),
                attrValues = await Hoot.api.getSchemaAttrValues( upload );

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
}