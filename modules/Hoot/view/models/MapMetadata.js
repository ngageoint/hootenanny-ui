/*******************************************************************************************************
 * File: MapMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/16/18
 *******************************************************************************************************/

export default class MapMetadata {
    constructor( context, controller, layer ) {
        this.context   = context;
        this.container = controller;
        this.layer     = layer;
    }

    render() {
        this.createIconButton();
    }

    createIconButton() {
        this.container.append( 'button' )
            .attr( 'tabindex', -1 )
            .classed( 'metadata-button icon-button keyline-left unround inline _icon info', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                // toggle menu
            } );
    }
}