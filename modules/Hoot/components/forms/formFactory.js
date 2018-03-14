/** ****************************************************************************************************
 * File: formFactory.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

export default function FormFactory() {
    const self = this;

    this.generateForm = ( selector, metadata ) => {
        let container = this.createContainer( selector ),
            formDiv   = this.createFormDiv( container ),
            form      = this.createForm( container, formDiv, metadata.title );

        this.createFieldSets( form, metadata.form );
        this.createButton( formDiv, metadata.button );

        return container;
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
    };

    this.createCombobox = field => {
        let input = field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'autocomplete', 'off' )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'disabled', d => d.disabled )
            .on( 'change', d => d.onChange() )
            .on( 'keyup', d => d.onChange() );

        input.select( d => {
            if ( d.combobox && d.combobox.data && d.combobox.command ) {
                d.combobox.command( input.node(), d );
            }
        } );
    };

    this.createTextField = field => {
        field.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'readonly', d => d.readOnly )
            .attr( 'disabled', d => d.disabled )
            .classed( 'text-input', true )
            .on( 'keyup', d => d.onChange( d ) );
    };

    this.createMultipart = field => {
        let wrapper = field.append( 'div' ).classed( 'contain', true );

        self.createTextField( wrapper );

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
    };

    this.createButton = ( formDiv, buttonMeta ) => {
        let buttonContainer = formDiv.append( 'div' )
            .classed( 'modal-footer', true );

        buttonContainer.append( 'button' )
            .attr( 'disabled', true )
            .attr( 'id', buttonMeta.id )
            .classed( 'round strong primary', true )
            .text( buttonMeta.text );
    };
}