/*******************************************************************************************************
 * File: sidebarForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/13/18
 *******************************************************************************************************/

import SidebarController from './sidebarController';

export default class SidebarForm {
    constructor( container, d ) {
        this.container    = container;
        this.formMeta     = d;
        this.form         = null;
        this.controller   = null;
    }

    render( data ) {
        if ( data ) {
            this.resetForm( data );
        } else {
            this.createForm();
        }

        this.createToggleButton();
        this.createInnerWrapper();
    }

    get exists() {
        return this.form;
    }

    remove() {
        if ( this.exists ) {
            this.form.remove();
            this.form = null;
        }
    }

    /**
     * Open or close add-layer form
     */
    toggle() {
        let buttonState  = this.button.classed( 'active' ),
            wrapper      = this.innerWrapper,
            wrapperState = wrapper.classed( 'visible' ),
            wrapperNode  = wrapper.node(),
            fieldset     = wrapper.select( 'fieldset' ).node();

        function onEnd() {
            wrapperNode.removeEventListener( 'transitionend', onEnd );
            wrapperNode.style.height    = 'auto';
            wrapperNode.style.minHeight = fieldset.clientHeight + 'px';
            wrapper.classed( 'no-transition', true );
        }

        if ( wrapperNode.clientHeight ) {
            wrapper.classed( 'no-transition', false );
            wrapperNode.style.minHeight = '0';
            wrapperNode.style.height    = fieldset.clientHeight + 'px';
            setTimeout( () => wrapperNode.style.height = '0', 1 );
        } else {
            wrapperNode.style.height = fieldset.clientHeight + 'px';
            wrapperNode.addEventListener( 'transitionend', onEnd, false );
        }

        this.button.classed( 'active', !buttonState );
        wrapper.classed( 'visible', !wrapperState );
    }

    createForm() {
        this.form = this.container.append( 'form' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => `sidebar-form round importable-layer fill-white strong ${ d.class }` );
    }

    resetForm( d ) {
        this.form.remove();
        this.folderTree = null;

        if ( d.id === 'reference' ) {
            this.form = this.container.insert( 'form', ':first-child' );
        } else {
            this.form = this.container.append( 'form' );
        }

        this.form.attr( 'id', d => d.id )
            .attr( 'class', d => `sidebar-form round importable-layer fill-white strong ${ d.class }` );
    }

    /**
     * Create toggle button for form
     */
    createToggleButton() {
        this.button = this.form.append( 'a' )
            // .attr( 'href', '#' )
            .attr( 'class', d => {
                let iconClass = d.type === 'add' ? 'plus' : d.type === 'conflate' ? 'conflate' : 'check';

                return `toggle-button button _icon big light text-light strong block round ${ iconClass }`;
            } )
            .on( 'click', (d3_event, d) => this.toggle( d.id ) );

        this.button.append( 'span' )
            .classed( 'strong', true )
            .text( d => d.toggleButtonText );
    }

    createInnerWrapper() {
        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    loadingState( params ) {
        this.loadingLayerName = params.name;
        this.controller       = new SidebarController( this.form, params );

        this.controller.render();
    }
}
