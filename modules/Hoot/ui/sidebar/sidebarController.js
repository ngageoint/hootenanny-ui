/*******************************************************************************************************
 * File: sidebarController.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/3/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import Hoot          from '../../hoot';
import LayerMetadata from './layerMetadata';

class SidebarController {
    constructor( context, form, layer ) {
        this.context    = context;
        this.form       = form;
        this.wrapper    = d3.select( this.form.node().parentNode );
        this.layerName  = layer.name;
        this.layerId    = layer.id;
        this.layerColor = layer.color;
        this.isConflate = layer.isConflate;
        this.refType    = layer.refType;
        this.typeClass  = this.isConflate ? 'conflate-controller' : 'add-controller';
    }

    render() {
        this.form.select( '.inner-wrapper' ).remove();

        this.form
            .attr( 'class', () => {
                if ( this.layerColor === 'osm' ) {
                    this.layerColor = '_osm';
                }

                return `sidebar-form layer-loading round fill-white ${ this.layerColor }`;
            } )
            .attr( 'data-name', this.layerName )
            .attr( 'data-id', this.layerId )
            .select( 'a' )
            .remove();

        this.createController();
        this.createInnerWrapper();
        this.createFieldset();
        this.createColorPalette();
        this.createThumbnail();
        this.createText();
        this.createDeleteButton();
    }

    togglePanel() {
        let formState    = this.form.classed( 'expanded' ),
            wrapper      = this.innerWrapper,
            wrapperState = this.innerWrapper.classed( 'visible' ),
            wrapperNode  = this.innerWrapper.node();

        // remove listener so class isn't re-added to element
        function onEnd() {
            wrapper.classed( 'no-transition', true );
            wrapperNode.removeEventListener( 'transitionend', onEnd );
        }

        if ( wrapperNode.clientHeight ) {
            // close panel and re-enable transition
            this.innerWrapper.classed( 'no-transition', false );
            wrapperNode.style.height = '0';
        } else {
            // open panel
            let bodyNode = this.fieldset.node();

            wrapperNode.style.height = bodyNode.clientHeight + 'px';
            // disable transition when panel is completely open
            wrapperNode.addEventListener( 'transitionend', onEnd, false );
        }

        this.form.classed( 'expanded', !formState );
        this.innerWrapper.classed( 'visible', !wrapperState );
    }

    createController() {
        this.controller = this.form.append( 'div' )
            .classed( 'controller contain keyline-all round', true );
    }

    createInnerWrapper() {
        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    createColorPalette() {
        let self    = this,
            palette = Hoot.layers.getPalette();

        this.colorPalette = this.fieldset.append( 'div' )
            .classed( 'keyline-all hoot-form-field palette clearfix round', true );

        if ( !this.isConflate ) {
            palette = _.reject( palette, color => color.name === 'green' );
        }

        this.colorPalette.selectAll( 'a' )
            .data( palette )
            .enter()
            .append( 'a' )
            .attr( 'class', p => {
                let activeClass = this.layerColor === p.name ? 'active _icon check' : '',
                    osmClass    = p.name === 'osm' ? '_osm' : '';

                return `block float-left keyline-right ${ activeClass } ${ osmClass }`;
            } )
            .attr( 'href', '#' )
            .attr( 'data-color', p => p.name )
            .style( 'background', p => p.hex )
            .on( 'click', function( p ) {
                d3.select( this.parentNode )
                    .selectAll( 'a' )

                    .classed( 'active _icon check', false );

                d3.select( this )
                    .classed( 'active _icon check', true );

                self.form
                    .classed( self.layerColor, false )
                    .classed( p.name, true );

                self.layerColor = p.name;
                Hoot.layers.setLayerColor( self.layerId, self.layerColor );
            } );
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
            .on( 'click', async d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let message = 'Are you sure you want to delete?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    Hoot.layers.removeLoadedLayer( this.layerId );
                    Hoot.ui.sidebar.layerRemoved( d );
                }
            } );
    }

    update() {
        let layer = Hoot.layers.findLoadedBy( 'name', this.layerName );

        this.layerId   = layer.id;
        this.layerName = layer.name;

        this.form.classed( 'layer-loading', false )
            .classed( this.typeClass, true );

        this.thumbnail.attr( 'class', () => {
            let icon = layer.merged ? 'conflate' : 'data',
                osm  = layer.color === 'osm' ? '_osm' : '';

            return `pad1 inline thumbnail light big _icon ${ icon } ${ osm }`;
        } ).on( 'click', () => this.togglePanel() );

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

        if ( this.isConflate ) {
            this.metadata = new LayerMetadata( this.context, this.form, layer );
            this.metadata.render();
            this.contextLayer.style( 'width', 'calc( 100% - 145px )' );
        }
    }
}

export default SidebarController;