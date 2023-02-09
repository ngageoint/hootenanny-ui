/*******************************************************************************************************
 * File: sidebarController.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/3/18
 *******************************************************************************************************/

import _reject       from 'lodash-es/reject';
import LayerMetadata from './layerMetadata';

class SidebarController {
    constructor( form, layer ) {
        this.context    = Hoot.context;
        this.form       = form;
        this.wrapper    = d3.select( this.form.node().parentNode );
        this.layerName  = layer.name;
        this.layerId    = layer.id;
        this.layerColor = layer.color;
        this.isConflating = layer.isConflating;
        this.isMerged     = layer.isMerged;
        this.jobId      = layer.jobId;
        this.refType    = layer.refType;
        this.typeClass  = layer.isMerged ? 'conflate-controller' : 'add-controller';
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
        if (this.isConflating) {
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

        if ( !this.isMerged ) {
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
            .on( 'click', function( d3_event, p ) {
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
                //Hoot.ui.sidebar.forms.conflate.updateLayerColors( self.layerColor, self.refType );
            } );
    }

    createThumbnail() {
        this.thumbnail = this.controller
            .append( 'div' )
            .classed( 'pad1 inline thumbnail _icon _loading light', true );
    }

    createText() {
        let text = this.isConflating ? 'Conflating' : 'Loading';

        this.text = this.controller
            .append( 'span' )
            .classed( 'strong pad1x', true )
            .html( `${ text } &#8230;` );
    }

    createDeleteButton() {
        this.deleteButton = this.controller
            .append( 'button' )
            .classed( 'delete-button icon-button keyline-left round-right inline', true )
            .on( 'click', async (d3_event, d) => {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                let message = 'Are you sure you want to remove?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    Hoot.layers.removeLoadedLayer( this.layerId );
                    Hoot.ui.sidebar.layerRemoved( d );
                }
            } );
        this.deleteButton.append('i')
            .classed('material-icons', true)
            .attr('title', 'remove layer')
            .text('delete_outline');
    }

    createShowLayersButton() {
        let sources,
            isMerged = true,
            icon;
        this.showButton = this.controller
            .append('button')
            .classed('showlayers icon-button keyline-left inline unround', true)
            .on('click', async function (d3_event) {
                try {
                    d3_event.preventDefault();
                    if (!sources) {
                        sources = Object.values(Hoot.layers.loadedLayers).reduce((sources, l) => {
                            let key = l.isMerged ? 'merged' : 'original';
                            sources[key] = key === 'merged' ? l : (sources[key] || []).concat(l);
                            return sources;
                        }, { histories: {} });
                    }

                    // take snapshot of history
                    sources.histories[isMerged ? 'merged' : 'original'] = Hoot.context.history().toJSON();

                    if (isMerged) {
                        Hoot.layers.hideLayer(Hoot.layers.findLoadedBy( 'refType', 'merged' ).id);
                        Hoot.layers.showLayer(Hoot.layers.findLoadedBy( 'refType', 'primary' ).id);
                        Hoot.layers.showLayer(Hoot.layers.findLoadedBy( 'refType', 'secondary' ).id);
                    } else {
                        Hoot.layers.hideLayer(Hoot.layers.findLoadedBy( 'refType', 'primary' ).id);
                        Hoot.layers.hideLayer(Hoot.layers.findLoadedBy( 'refType', 'secondary' ).id);
                        Hoot.layers.showLayer(Hoot.layers.findLoadedBy( 'refType', 'merged' ).id);
                    }

                    if (Object.keys(sources.histories).length === 2) { // the first time we don't want to refresh history, so we just ignore.
                        const history = sources.histories[isMerged ? 'original' : 'merged'];
                        if (history) Hoot.context.history().fromJSON(history); // if no changes occur, toJSON doesn't build anything, so do not refresh history
                    }

                    isMerged = !isMerged;

                    //toggle swap tooltip
                    icon.attr('title', `show ${isMerged ? 'inputs' : 'merged'}`);

                } catch (e) {
                    console.error(e);
                }
            });
        icon = this.showButton.append('i')
            .classed('material-icons', true)
            .attr('title', `show ${isMerged ? 'inputs' : 'merged'}`)
            .text('swap_vert');

    }

    createCancelButton() {
        this.cancelButton = this.controller
            .append( 'button' )
            .classed( 'cancel-button icon-button keyline-left round-right inline', true )
            .on( 'click', async(d3_event, d) => {
                d3_event.stopPropagation();
                d3_event.preventDefault();

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
            let icon = layer.isMerged ? 'conflate' : 'data',
                osm  = layer.color === 'osm' ? '_osm' : '';

            return `pad1 inline thumbnail light big _icon ${ icon } ${ osm }`;
        } ).on( 'click', () => this.togglePanel() );

        this.contextLayer = this.controller
            .append( 'div' )
            .classed( 'context-menu-layer', true )
            .on( 'contextmenu', (d3_event) => {
                d3_event.preventDefault();

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
                    .style( 'left', (d3_event.pageX - 2) + 'px' )
                    .style( 'top', (d3_event.pageY - 2) + 'px' )
                    .style( 'display', 'block' );

                // close menu
                d3.select( 'body' ).on( 'click.context-menu', () => {
                    d3.select( '.context-menu' ).style( 'display', 'none' );
                } );
            } );

        this.form.selectAll(`button.${this.isConflating ? 'cancel' : 'delete'}-button`).remove();
        this.text.remove();

        this.text = this.contextLayer
            .append('span')
            .classed('strong pad1x', true)
            .attr('title', layer.name)
            .text(layer.name);

        if ( layer.isMerged ) {
            this.createShowLayersButton();
            this.metadata = new LayerMetadata( this.context, this.form, layer );
            this.metadata.render();
        }
        this.createDeleteButton();
    }
}

export default SidebarController;
