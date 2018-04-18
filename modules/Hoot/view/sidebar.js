/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/10/18
 *******************************************************************************************************/

import _                   from 'lodash-es';
import LayerManager        from '../managers/layerManager';
import SidebarAddForm      from './forms/sidebarAddForm';
import SidebarConflateForm from './forms/sidebarConflateForm';
import { sidebarForms }    from '../config/formMetadata';

/**
 * Create the sidebar
 *
 * @constructor
 */
export default class Sidebar {
    constructor( container, context ) {
        this.context          = context;
        this.container        = container;
        this.formData         = sidebarForms;
        this.addFormData      = _.filter( this.formData, form => form.id !== 'conflate' );
        this.conflateFormData = _.filter( this.formData, form => form.id === 'conflate' );
        this.addForms         = {};
    }

    /**
     * Render all view inside sidebar
     */
    async render() {
        this.container.classed( 'col4', false );

        this.createResizer();
        this.createWrapper();
        this.createForms();

        this.listen();
    }

    /**
     * Create resize bar and attach d3 drag behavior
     */
    createResizer() {
        const self = this;

        this.resizer = this.container.append( 'div' )
            .attr( 'id', 'sidebar-resizer' )
            .on( 'dblclick', function() {
                self.resize( this, true );
            } );

        this.dragResize = d3.drag().on( 'drag', function() {
            self.resize( this );
        } );

        this.resizer.call( this.dragResize );
    }

    /**
     * Resize event
     *
     * @param target - resize bar
     * @param reset - whether to reset to original width or not
     */
    resize( target, reset ) {
        let width = reset ? 400 : d3.mouse( target.parentNode )[ 0 ],
            sidebarWidth;

        this.container.style( 'width', width + 'px' );

        sidebarWidth = this.container.node().getBoundingClientRect().width;

        d3.select( '#bar' ).style( 'width', `calc(100% - ${ sidebarWidth }px)` );
    }

    createWrapper() {
        this.wrapper = this.container.append( 'div' )
            .classed( 'wrapper', true );
    }

    /**
     * Bind form data and create a form for each item
     */
    createForms() {
        let sidebar = this;

        this.wrapper.selectAll( '.layer-add' )
            .data( this.addFormData ).enter()
            .select( function( d ) {
                sidebar.addForms[ d.id ] = new SidebarAddForm( sidebar.context, sidebar, d3.select( this ) );
                sidebar.addForms[ d.id ].render();
            } );

        this.wrapper.selectAll( '.layer-conflate' )
            .data( this.conflateFormData ).enter()
            .select( function() {
                sidebar.conflateForm = new SidebarConflateForm( sidebar.context, sidebar, d3.select( this ) );
            } );
    }

    conflateCheck() {
        let loadedLayers   = Object.values( LayerManager.loadedLayers ),
            addControllers = d3.selectAll( '.add-controller' );

        if ( loadedLayers.length === 2 ) {
            if ( !this.conflateForm.exists ) {
                this.conflateForm.render( loadedLayers );
            }
        } else if ( addControllers.size() > 0 ) {
            this.conflateForm.remove();
        }
    }

    /**
     * Listen for re-render
     */
    listen() {

    }
}