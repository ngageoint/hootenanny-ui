/*******************************************************************************************************
 * File: layerController.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/3/18
 *******************************************************************************************************/

import LayerManager from '../../models/layerManager';

class LayerController {
    constructor( layer, form, context ) {
        this.context = context;
        this.form    = form;
        this.wrapper = d3.select( this.form.node().parentNode );
        this.name    = layer.name;
        this.id      = layer.id;
        this.color   = layer.color;
    }

    init() {
        this.render();
    }

    render() {
        this.form.selectAll( 'fieldset' )
            .classed( 'hidden', true );

        this.form
            .attr( 'class', () => {
                if ( this.color === 'osm' ) {
                    this.color = '_osm';
                }

                return `round space-bottom1 loadingLayer ${ this.color }`;
            } )
            .attr( 'data-name', this.name )
            .select( 'a' )
            .remove();

        this.form.append( 'div' )
            .classed( 'contain keyline-all round controller', true )
            .html( '<div class="pad1 inline _loading"><span></span></div>' +
                '<span class="strong pad1x">Loading &#8230;</span>' +
                '<button class="keyline-left delete-button round-right inline _icon trash"></button>' )
            .select( 'button' )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if ( window.confirm( 'Are you sure you want to delete?' ) ) {
                    // handle delete
                }
            } );
    }

    layerAdded() {
        let layer = LayerManager.getLoadedLayers( this.name );

        //let form = this.wrapper.insert( 'form', '.loadingLayer' );
        this.form.html( '' );

        let controller = this.form.append( 'div' )
            .attr( 'class', `contain keyline-all round space-bottom1 controller ${ layer.color }` );

        controller.append( 'div' )
            .attr( 'class', () => {
                let icon = layer.merged ? 'conflate' : 'data',
                    osm  = layer.color === 'osm' ? '_osm' : '';

                return `pad1 inline thumbnail dark big _icon ${ icon } ${ osm }`;
            } );

        controller.append( 'button' )
            .classed( 'keyline-left delete-button round-right inline _icon trash', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if ( window.confirm( 'Are you sure you want to delete?' ) ) {
                    // handle delete
                }
            } );

        let contextLayer = controller.append( 'div' )
            .classed( 'context-menu-layer', true )
            .on( 'contextmenu', () => {
                d3.event.preventDefault();

                // create the div element that will hold the context menu
                d3.selectAll( '.context-menu' ).data( [ 1 ] )
                    .enter()
                    .append( 'div' )
                    .classed( 'context-menu', true )
                    .html( '' )
                    .append( 'ul' )
                    .append( 'li' )
                    .on( 'click', () => {
                        this.context.extent( layer.extent );

                        d3.select( '.context-menu' ).remove();
                    } )
                    .text( 'Zoom to Layer' );

                // show the context menu
                d3.select( '.context-menu' )
                    .style( 'left', (d3.event.pageX - 2) + 'px' )
                    .style( 'top', (d3.event.pageY - 2) + 'px' )
                    .style( 'display', 'block' );

                // close menu
                d3.select( 'body' ).on( 'click.context-menu', () => {
                    d3.select( '.context-menu' ).style( 'display', 'none' );
                } );
            } );

        contextLayer.append( 'span' )
            .classed( 'strong pad1x', true )
            .text( layer.name );

        //this.wrapper.select( '.loadingLayer' ).remove();
    }
}

export default LayerController;