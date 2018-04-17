/*******************************************************************************************************
 * File: MapMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/16/18
 *******************************************************************************************************/

export default class MapMetadata {
    constructor( context, form, layer ) {
        this.context = context;
        this.form    = form;
        this.layer   = layer;
    }

    render() {
        this.createIconButton();
        this.createBody();
    }

    toggle() {
        let formState = this.form.classed( 'expanded' ),
            bodyState = this.body.classed( 'visible' );

        this.form.classed( 'expanded', !formState );
        this.body.classed( 'visible', !bodyState );
    }

    createIconButton() {
        this.form.select( '.controller' )
            .append( 'button' )
            .attr( 'tabindex', -1 )
            .classed( 'metadata-button icon-button keyline-left unround inline _icon info', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.toggle();
            } );
    }

    createBody() {
        this.body = this.form.append( 'div' )
            .classed( 'metadata-body inner-wrapper', true );
    }
}