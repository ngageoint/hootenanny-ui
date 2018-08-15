/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/10/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import LayerManager  from '../../managers/layerManager';
import Event         from '../../managers/eventManager';
import LayerAdd      from './layerAdd';
import LayerConflate from './layerConflate';
import LayerReview   from './layerReview';

/**
 * Create the sidebar
 *
 * @constructor
 */
export default class Sidebar {
    constructor( context ) {
        this.context     = context;
        this.iDSidebar   = d3.select( '#sidebar' );
        this.forms       = {};
        this.mergedLayer = null;

        let formMeta = [
            {
                type: 'add',
                refType: 'primary',
                id: 'primary',
                class: 'layer-add',
                tableId: 'add-ref-table',
                color: 'violet',
                toggleButtonText: 'Add Reference Datasets'
            },
            {
                type: 'add',
                refType: 'secondary',
                id: 'secondary',
                class: 'layer-add',
                tableId: 'add-secondary-table',
                color: 'orange',
                toggleButtonText: 'Add Secondary Datasets'
            },
            {
                type: 'conflate',
                id: 'conflate',
                class: 'layer-conflate',
                toggleButtonText: 'Conflate'
            },
            {
                type: 'review',
                id: 'review',
                class: 'layer-review',
                toggleButtonText: 'Complete Review'
            }
        ];

        this.addFormData      = _.filter( formMeta, form => form.type === 'add' );
        this.conflateFormData = _.filter( formMeta, form => form.type === 'conflate' );
        this.reviewFormData   = _.filter( formMeta, form => form.type === 'review' );
    }

    /**
     * Render all view inside sidebar
     */
    async render() {
        this.iDSidebar.classed( 'col4', false );
        this.iDSidebar.select( '.sidebar-component' ).remove();
        this.container = this.iDSidebar.append( 'div' )
            .attr( 'id', 'hoot-sidebar' )
            .classed( 'hoot-sidebar', true );

        this.createResizer();
        this.createWrapper();
        this.createForms();

        this.listen();

        return this;
    }

    /**
     * Create resize bar and attach d3 drag behavior
     */
    createResizer() {
        const self = this;

        this.resizer = this.iDSidebar.append( 'div' )
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
        let width = reset ? 400 : d3.mouse( target.parentNode )[ 0 ];

        this.iDSidebar.style( 'width', width + 'px' );

        d3.select( '#bar' ).style( 'left', this.iDSidebar.node().clientWidth + 'px' );
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
                sidebar.forms[ d.id ] = new LayerAdd( sidebar, d3.select( this ) );
                sidebar.forms[ d.id ].render();
            } );

        this.wrapper.selectAll( '.layer-conflate' )
            .data( this.conflateFormData ).enter()
            .select( function() {
                sidebar.conflateForm = new LayerConflate( sidebar, d3.select( this ) );
            } );
    }

    layerMerged( layer ) {
        let sidebar = this;

        this.wrapper.selectAll( '.layer-review' )
            .data( this.reviewFormData ).enter()
            .select( function() {
                sidebar.reviewLayer = new LayerReview( sidebar, d3.select( this ), layer );

                sidebar.reviewLayer.render();
                sidebar.mergedLayer = null;
            } );
    }

    layerRemoved( data ) {
        if ( !data ) {
            this.reset();
        } else {
            this.forms[ data.id ].render( data );
        }
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

    reset() {
        this.wrapper.selectAll( '.sidebar-form' ).remove();

        this.createForms();
    }

    listen() {
        Event.listen( 'layer-merged', this.layerMerged, this );
        Event.listen( 'layer-removed', this.layerRemoved, this );
    }
}