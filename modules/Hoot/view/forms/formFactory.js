/** ****************************************************************************************************
 * File: formFactory.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

/**
 * Create a form contained within a modal
 *
 * @constructor
 */
export default class FormFactory {

    /**
     * Create a form with all of it's contents using the provided metadata
     *
     * @param selector - where to append container to
     * @param metadata - form data
     * @returns {d3} - form container
     */
    generateForm( selector, metadata ) {
        let container = this.createContainer( selector ),
            formModal = this.createFormModal( container ),
            form      = this.createForm( container, formModal, metadata.title );

        this.createFieldSets( form, metadata.form );
        this.createButton( formModal, metadata.button );

        return container;
    }

    /**
     * Create dark background container
     *
     * @param selector - where to append container to
     * @returns {d3} - form container
     */
    createContainer( selector ) {
        return d3.select( selector )
            .append( 'div' )
            .classed( 'fill-darken3 modal-overlay', true );
    }

    /**
     * Create modal
     *
     * @param container
     * @returns {d3} - form modal
     */
    createFormModal( container ) {
        return container.append( 'div' )
            .classed( 'contain col4 pad1 hoot-menu fill-white round modal', true );
    }

    /**
     * Create form with a header
     *
     * @param container - form container
     * @param modal - form modal
     * @param formTitle - form title
     * @returns {d3} - form wrapper
     */
    createForm( container, modal, formTitle ) {
        let form   = modal.append( 'form' ),
            header = form
                .append( 'div' )
                .classed( 'big pad1y keyline-bottom modal-header', true );

        header.append( 'h3' )
            .text( formTitle )
            .append( 'div' )
            .classed( 'fr _icon close pointer', true )
            .on( 'click', () => container.remove() );

        return form;
    }

    /**
     * Create each input field in the form
     *
     * @param form - form div
     * @param formMeta - form data
     */
    createFieldSets( form, formMeta, hidden ) {
        let self = this;

        let fieldContainer = form.append( 'fieldset' )
            .classed( 'hidden', hidden );

        let fields = fieldContainer.selectAll( '.form-field' )
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
                case 'text': {
                    self.createTextField( field );
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
        } );

        return fieldContainer;
    }

    /**
     * Create a custom dropdown menu
     *
     * @param field - field div
     */
    createCombobox( field ) {
        let input = field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'autocomplete', 'off' )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'disabled', d => d.disabled )
            .on( 'change', d => d.onChange && d.onChange() )
            .on( 'keyup', d => d.onChange && d.onChange() );

        input.select( d => {
            if ( d.combobox && d.combobox.data && d.combobox.command ) {
                d.combobox.command( input.node(), d );
            }
        } );
    }

    /**
     * Create a text input
     *
     * @param field - field div
     */
    createTextField( field ) {
        field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'readonly', d => d.readOnly )
            .attr( 'disabled', d => d.disabled )
            .classed( 'text-input', true )
            .on( 'keyup', d => d.onChange( d ) );
    }

    /**
     * Create a file upload input
     *
     * @param field - field div
     */
    createMultipart( field ) {
        let wrapper = field.append( 'div' ).classed( 'contain', true );

        this.createTextField( wrapper );

        let span = wrapper.append( 'span' )
            .classed( 'icon-button pointer keyline-left pin-right flex align-center justify-center', true );

        span.append( 'div' )
            .classed( 'material-icons small', true )
            .text( 'folder' );

        span.append( 'input' )
            .attr( 'id', d => d.multipartId )
            .attr( 'type', 'file' )
            .attr( 'readonly', true )
            .property( 'multiple', false )
            .attr( 'accept', '.shp, .shx, .dbf, .prj, .osm, .zip' )
            .classed( 'pointer pin-top dataset-file-upload', true )
            .on( 'change', d => d.onChange() );
    }

    /**
     * Create a submit button
     *
     * @param container - container to append element to
     * @param buttonMeta - button data
     */
    createButton( container, buttonMeta ) {
        let buttonContainer = container.append( 'div' )
            .classed( 'modal-footer', true );

        let button = buttonContainer.append( 'button' )
            .attr( 'disabled', true )
            .attr( 'id', buttonMeta.id )
            .classed( 'round strong primary', true )
            .on( 'click', buttonMeta.onClick );

        button
            .append( 'span' )
            .text( buttonMeta.text );
    }
}