/** ****************************************************************************************************
 * File: formFactory.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import { d3combobox as d3_combobox } from '../../../lib/d3.combobox';
import _ from 'lodash-es';

export default function FormFactory() {
    const self = this;

    this.generateForm = ( selector, metadata ) => {
        let container = this.createContainer( selector ),
            formDiv   = this.createFormDiv( container ),
            form      = this.createForm( container, formDiv, metadata.title );

        this.createFieldSets( form, metadata.form );
        this.createButton( formDiv, metadata.button );
    };

    this.createContainer = selector => {
        return d3.select( selector )
            .append( 'div' )
            .classed( 'fill-darken3 modal-overlay', true );
    };

    this.createFormDiv = container => {
        return container.append( 'div' )
            .classed( 'contain col4 pad1 hoot-menu fill-white round modal', true );
    };

    this.createForm = ( container, formDiv, formTitle ) => {
        let form   = formDiv.append( 'form' ),
            header = form
                .append( 'div' )
                .classed( 'big pad1y keyline-bottom modal-header', true );

        header.append( 'h3' )
            .text( formTitle )
            .append( 'div' )
            .classed( 'fr _icon x pointer', true )
            .on( 'click', () => container.remove() );

        return form;
    };

    this.createFieldSets = ( form, formMeta ) => {
        let fieldContainer = form.append( 'fieldset' )
            .selectAll( '.form-field' );

        let fields = fieldContainer
            .data( formMeta ).enter()
            .append( 'div' )
            .classed( 'form-field fill-white small keyline-all round', true );

        fields.append( 'label' )
            .classed( 'strong fill-light round-top keyline-bottom', true )
            .text( d => d.label );

        fields.select( function( d ) {
            let field = d3.select( this )
                .classed( 'contain', true );

            switch ( d.inputType ) {
                case 'textarea': {

                    break;
                }
                case 'combobox': {
                    self.createCombobox( field );
                    break;
                }
                case 'multipart': {
                    self.createMultipart( field );
                    break;
                }
                default: {
                    self.createTextField( field );
                    break;
                }
            }

            if ( d.id ) {
                field.attr( 'id', d.id );
            }

            if ( d.onChange ) {
                field.on( 'change', d.onChange );
            }
        } );
    };

    this.createCombobox = function( field ) {
        let inputField = field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', d => d.placeholder );

        field.select( d => {
            if ( d.combobox && d.combobox.data && d.combobox.command ) {
                d.combobox.command.call( inputField.node(), d );
            }
        } );
    };

    this.createMultipart = function( field ) {
        let fieldDiv = field.append( 'div' ).classed( 'contain', true );

        self.createTextField( fieldDiv );

        let wrapper = fieldDiv.append( 'span' )
            .classed( 'icon-button pointer keyline-left pin-right flex align-center justify-center', true );

        wrapper.append( 'div' )
            .classed( 'material-icons small', true )
            .text( 'folder' );

        wrapper.append( 'input' )
            .attr( 'id', d => d.multipartId )
            .attr( 'type', 'file' )
            .property( 'multiple', false )
            .attr( 'accept', '.shp, .shx, .dbf, .prj, .osm, .zip' )
            .classed( 'pointer pin-top dataset-file-upload', true );
    };

    this.createTextField = function( field ) {
        field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'class', d => d.className );
    };

    this.createButton = ( formDiv, buttonMeta ) => {
        let buttonContainer = formDiv.append( 'div' )
            .classed( 'modal-footer', true );

        buttonContainer.append( 'button' )
            .classed( 'round strong primary', true )
            .attr( 'disabled', true )
            .text( buttonMeta.text );
    };
}