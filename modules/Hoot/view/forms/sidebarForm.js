/*******************************************************************************************************
 * File: sidebarForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/13/18
 *******************************************************************************************************/

import HootOSM         from '../../managers/hootOsm';
import LayerController from '../models/layerController';
import Event           from '../../managers/eventManager';

export default class SidebarForm {
    constructor( [ context, sidebar, container ] ) {
        this.context   = context;
        this.sidebar   = sidebar;
        this.container = container;

        this.form         = null;
        this.controller   = null;
        this.loadingLayer = null;
    }

    reset() {
        this.loadingLayer = null;
        this.form.remove();
        this.render();
    }

    render() {
        this.createForm();
        this.createToggleButton();
        this.createInnerWrapper();

        this.listen();
    }

    /**
     * Open or close add-layer form
     */
    toggleForm() {
        let buttonState  = this.button.classed( 'active' ),
            wrapperState = this.innerWrapper.classed( 'visible' ),
            wrapperNode  = this.innerWrapper.node();

        this.button.classed( 'active', !buttonState );
        this.innerWrapper.classed( 'visible', !wrapperState );

        if ( wrapperNode.clientHeight ) {
            wrapperNode.style.height = '0';
        } else {
            let fieldset = this.innerWrapper.select( 'fieldset' ).node();

            wrapperNode.style.height = fieldset.clientHeight + 'px';
        }
    }

    createForm() {
        this.form = this.container.append( 'form' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => `sidebar-form round importable-layer fill-white strong ${ d.class }` );
    }

    /**
     * Create toggle button for form
     */
    createToggleButton() {
        this.button = this.form.append( 'a' )
            .classed( 'toggle-button button dark text-light strong block round', true )
            .attr( 'href', '#' )
            .on( 'click', d => this.toggleForm( d.id ) );

        this.button.append( 'i' )
            .classed( 'material-icons center strong', true )
            .text( 'add' );

        this.button.append( 'span' )
            .classed( 'strong', true )
            .text( d => d.toggleButtonText );
    }

    createInnerWrapper() {
        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    loadingState( params ) {
        this.loadingLayer = params.name;
        this.controller   = new LayerController( this.context, this.form, params );
        this.controller.render();
    }

    loadLayer( params ) {
        HootOSM.loadLayer( params );
    }

    layerLoaded( layerName ) {
        if ( this.loadingLayer === layerName ) {
            this.controller.update();
            this.sidebar.conflateCheck();
        }
    }

    layerRemoved( layerName ) {
        if ( this.loadingLayer === layerName ) {
            this.reset();
            this.sidebar.conflateCheck();
        }
    }

    /**
     * Listen for re-render
     */
    listen() {
        Event.listen( 'layer-loaded', this.layerLoaded, this );
        Event.listen( 'layer-removed', this.layerRemoved, this );
    }
}