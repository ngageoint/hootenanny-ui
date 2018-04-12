/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/10/18
 *******************************************************************************************************/

import LayerManager      from '../managers/layerManager';
import LayerAddForm      from './forms/layerAddForm';
import LayerConflateForm from './forms/layerConflateForm';
import { sidebarForms }  from '../config/formMetadata';

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
        this.addForms         = {};
        this.conflate         = new LayerConflateForm( this.context, this.container );
        this.layerControllers = {};
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

        this.wrapper.selectAll( 'form' )
            .data( this.formData ).enter()
            .select( function( d ) {
                sidebar.addForms[ d.id ] = new LayerAddForm( this.context, sidebar, d3.select( this ) );
                sidebar.addForms[ d.id ].render( d );
            } );
    }

    conflateCheck() {
        let loadedLayers = Object.values( LayerManager.getLoadedLayers() );

        if ( loadedLayers.length === 2 ) {
            if ( !this.conflate.exists ) {
                this.conflate.render( loadedLayers );
            }
        } else {
            this.conflate.remove();
        }
    }

    /**
     * Listen for re-render
     */
    listen() {

    }
}