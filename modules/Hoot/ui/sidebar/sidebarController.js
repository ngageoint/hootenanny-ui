/*******************************************************************************************************
 * File: sidebarController.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/3/18
 *******************************************************************************************************/

import _debounce from 'lodash-es/debounce';
import _reject       from 'lodash-es/reject';
import { svgIcon }    from '../../../svg';
import LayerMetadata from './layerMetadata';
import { uiBackground } from '../../../ui';

class SidebarController {
    constructor( form, layer ) {
        this.context    = Hoot.context;
        this.form       = form;
        this.wrapper    = d3.select( this.form.node().parentNode );
        this.layerName  = layer.name;
        this.layerId    = layer.id;
        this.layerColor = layer.color;
        this.isConflate = layer.isConflate;
        this.merged = layer.merged;
        this.jobId      = layer.jobId;
        this.refType    = layer.refType;
        this.typeClass  = this.isConflate ? 'conflate-controller' : 'add-controller';
    }

    render() {
        //remove the input form components
        //at some point it would be nice to preserve the state of adv opts
        //and just hide this so it could be restored on
        //job cancel or error
        this.form.select( '.inner-wrapper' ).remove();//.classed('hidden', true);
        this.form.select( 'a' ).remove();//.classed('hidden', true);

        this.form
            .attr( 'class', () => {
                if ( this.layerColor === 'osm' ) {
                    this.layerColor = '_osm';
                }

                return `sidebar-form layer-loading round fill-white ${ this.layerColor }`;
            } )
            .attr( 'data-name', this.layerName )
            .attr( 'data-id', this.layerId );

        this.createController();
        this.createInnerWrapper();
        this.createFieldset();
        this.createColorPalette();
        this.createThumbnail();
        this.createText();
        if (this.isConflate) {
            this.createCancelButton();
        } else {
            this.createDeleteButton();
        }

        Hoot.ui.sidebar.adjustSize();
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
        this.controller = this.form
            .append( 'div' )
            .classed( 'controller contain keyline-all round', true );
    }

    createInnerWrapper() {
        this.innerWrapper = this.form
            .append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    createColorPalette() {
        let self    = this,
            palette = Hoot.layers.getPalette();

        this.colorPalette = this.fieldset
            .append( 'div' )
            .classed( 'keyline-all hoot-form-field palette clearfix round', true );

        if ( !this.isConflate ) {
            palette = _reject( palette, color => color.name === 'green' );
        }

        this.colorPalette
            .selectAll( 'a' )
            .data( palette )
            .enter()
            .append( 'a' )
            .attr( 'class', p => {
                let activeClass = this.layerColor === p.name ? 'active _icon check' : '',
                    osmClass    = p.name === 'osm' ? '_osm' : '';

                return `block float-left keyline-right ${ activeClass } ${ osmClass }`;
            } )
            // .attr( 'href', '#' )
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
        this.thumbnail = this.controller
            .append( 'div' )
            .classed( 'pad1 inline thumbnail _icon _loading light', true );
    }

    createText() {
        let text = this.isConflate && !this.merged ? 'Conflating' : 'Loading';

        this.text = this.controller
            .append( 'span' )
            .classed( 'strong pad1x', true )
            .html( `${ text } &#8230;` );
    }

    createDeleteButton() {
        this.deleteButton = this.controller
            .append( 'button' )
            .classed( 'delete-button icon-button keyline-left round-right inline _icon trash', true )
            .on( 'click', async d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let message = 'Are you sure you want to remove?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    Hoot.layers.removeLoadedLayer( this.layerId );
                    Hoot.ui.sidebar.layerRemoved( d );
                }
            } );
    }

    createShowLayersButton() {
        let sources, isMerged = true;
        this.showButton = this.controller
            .append('button')
            .classed('showlayers icon-button keyline-left inline unround', true)
            .call(svgIcon('#iD-icon-layers'))
            .on('click', async function () {
                try {
                    let span = d3.select(this).select('span');
                    d3.event.preventDefault();
                    if (!sources) {
                        sources = Object.values(Hoot.layers.loadedLayers).reduce((sources, l) => {
                            let key = l.merged ? 'merged' : 'original';
                            sources[key] = key === 'merged' ? l : (sources[key] || []).concat(l);
                            return sources;
                        }, {});
                    }

                    Hoot.layers.loadedLayers = {};
                    Hoot.context.flush();

                    if (isMerged) {
                        span.text('Original');
                        Hoot.layers.removeLoadedLayer(sources.merged.id);
                        await Promise.all([
                            Hoot.layers.loadLayer(sources.original[0], true),
                            Hoot.layers.loadLayer(sources.original[1], true)
                        ]);
                    } else {
                        span.text('Merged');
                        sources.original.forEach(layer => Hoot.layers.removeLoadedLayer(layer.id));
                        await Hoot.layers.loadLayer(sources.merged, true);
                    }
                    isMerged = !isMerged;
                    uiBackground.renderLayerToggle();
                } catch (e) {
                    console.log(e);
                }
            });

        this.showButton.append('span').text('Merged');
    }

    createCancelButton() {
        this.cancelButton = this.controller
            .append( 'button' )
            .classed( 'cancel-button icon-button keyline-left round-right inline', true )
            .on( 'click', async d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let message = 'Are you sure you want to cancel?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    Hoot.api.cancelJob(this.jobId)
                        .then( () => {
                            this.restoreInputs();
                        });
                }
            } );
        this.cancelButton.append('i')
            .classed('material-icons', true)
            .attr('title', 'cancel job' )
            .text('cancel');
    }

    hideInputs() {
        d3.selectAll( '.add-controller' ).classed('hidden', true);
    }

    restoreInputs() {
        // remove conflating layer
        d3.selectAll( '.layer-loading' ).remove();
        // restore input layers
        d3.selectAll( '.add-controller' ).classed('hidden', false);
        // remove conflate button
        Hoot.ui.sidebar.forms.conflate.remove();
        // restore the conflate button
        Hoot.ui.sidebar.conflateCheck();
    }

    update() {
        let layer = Hoot.layers.findLoadedBy( 'name', this.layerName );

        this.layerId   = layer.id;
        this.layerName = layer.name;

        this.form
            .classed( 'layer-loading', false )
            .classed( this.typeClass, true );

        this.thumbnail.attr( 'class', () => {
            let icon = layer.merged ? 'conflate' : 'data',
                osm  = layer.color === 'osm' ? '_osm' : '';

            return `pad1 inline thumbnail light big _icon ${ icon } ${ osm }`;
        } ).on( 'click', () => this.togglePanel() );

        this.contextLayer = this.controller
            .append( 'div' )
            .classed( 'context-menu-layer', true )
            .on( 'contextmenu', () => {
                d3.event.preventDefault();

                // create the div element that will hold the context menu
                d3.selectAll( '.context-menu' )
                    .data( [ 1 ] )
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

        d3.selectAll(`button.${this.isConflate ? 'cancel' : 'delete'}-button`).remove();
        this.text.remove();

        this.text = this.contextLayer
            .append('span')
            .classed('strong pad1x', true)
            .attr('title', layer.name)
            .text(layer.name);

        if (layer.merged) {
            this.createShowLayersButton();
        }

        if ( this.isConflate ) {
            this.metadata = new LayerMetadata( this.context, this.form, layer );
            this.metadata.render();
        }
        this.createDeleteButton();
    }
}

export default SidebarController;
