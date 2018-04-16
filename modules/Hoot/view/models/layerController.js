/*******************************************************************************************************
 * File: layerController.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/3/18
 *******************************************************************************************************/

import LayerManager from '../../managers/layerManager';
import MapMetadata  from './MapMetadata';

class LayerController {
    constructor( context, form, layer ) {
        this.context    = context;
        this.form       = form;
        this.wrapper    = d3.select( this.form.node().parentNode );
        this.layer      = layer;
        this.name       = layer.name;
        this.id         = layer.id;
        this.color      = layer.color;
        this.isConflate = layer.isConflate;
        this.typeClass  = this.isConflate ? 'conflate-controller' : 'add-controller';
    }

    render() {
        this.form.select( '.inner-wrapper' )
            .classed( 'hidden', true );

        this.form
            .attr( 'class', () => {
                if ( this.color === 'osm' ) {
                    this.color = '_osm';
                }

                return `sidebar-form controller layer-loading round fill-white ${ this.color }`;
            } )
            .attr( 'data-name', this.name )
            .attr( 'data-id', this.id )
            .select( 'a' )
            .remove();

        this.createController();
        this.createThumbnail();
        this.createText();
        this.createDeleteButton();
    }

    createController() {
        this.controller = this.form.append( 'div' )
            .classed( 'contain keyline-all round', true );
    }

    createThumbnail() {
        this.thumbnail = this.controller.append( 'div' )
            .classed( 'pad1 inline thumbnail _icon _loading light', true );
    }

    createText() {
        let text = this.isConflate ? 'Conflating' : 'Loading';

        this.text = this.controller.append( 'span' )
            .classed( 'strong pad1x', true )
            .html( `${ text } &#8230;` );
    }

    createDeleteButton() {
        this.deleteButton = this.controller.append( 'button' )
            .classed( 'delete-button icon-button keyline-left round-right inline _icon trash', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if ( window.confirm( 'Are you sure you want to delete?' ) ) {
                    // handle delete
                }
            } );
    }

    update() {
        let layer = LayerManager.findLoadedBy( 'name', this.name );

        this.form.classed( 'layer-loading', false )
            .classed( this.typeClass, true );

        this.thumbnail.attr( 'class', () => {
            let icon = layer.merged ? 'conflate' : 'data',
                osm  = layer.color === 'osm' ? '_osm' : '';

            return `pad1 inline thumbnail light big _icon ${ icon } ${ osm }`;
        } );

        this.contextLayer = this.controller.append( 'div' )
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

        this.text.remove();

        this.text = this.contextLayer.append( 'span' )
            .classed( 'strong pad1x', true )
            .text( layer.name );

        if ( layer.tags && (layer.tags.params || layer.tags.stats) ) {
            this.contextLayer.style( 'width', 'calc( 100% - 140px' );
            this.metadata = new MapMetadata( this.context, this.controller, layer );
            this.metadata.render();
        }
    }
}

export default LayerController;