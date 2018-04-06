/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/19/18
 *******************************************************************************************************/

import _                 from 'lodash-es';
import Events            from '../../util/events';
import FolderTree        from '../folderTree';
import HootOSM           from '../../models/hootOsm';
import LayerManager      from '../../models/layerManager';
import LayerController   from './layerController';
import LayerConflateForm from '../forms/layerConflateForm';
//import { d3combobox } from '../../lib/hoot/d3.combobox';
import { sidebarForms }  from '../../config/formMetadata';

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
        this.conflate         = new LayerConflateForm( this.container );
        this.layerTables      = {};
        this.layerControllers = {};
    }

    /**
     * Render all view inside sidebar
     */
    async render() {
        this.container.classed( 'col4', false );

        this.createResizer();
        this.createWrapper();
        this.update();

        this.listen();
    }

    update( data ) {
        if ( data ) {
            this.resetForm( data );
        } else {
            this.createForms();
        }

        this.createToggleButtons();
        this.createFieldsets();
        this.createTables();
        this.createRecentlyUsedLayers();
        this.createColorPalette();
        this.createSubmitButton();
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
        this.forms = this.wrapper.selectAll( 'form' )
            .data( this.formData )
            .enter().append( 'form' )
            .attr( 'id', d => d.id )
            .classed( 'sidebar-form layer-add round importable-layer fill-white strong', true );
    }

    resetForm( data ) {
        this.wrapper.select( `#${ data.id }` ).remove();
        delete this.layerTables[ data.tableId ];

        let enter = this.wrapper.selectAll( 'forms' )
            .data( [ data ] )
            .enter();

        if ( data.id === 'add-ref' ) {
            this.forms = enter.insert( 'form', ':first-child' );
        } else {
            this.forms = enter.append( 'form' );
        }

        this.forms.attr( 'id', d => d.id )
            .classed( 'sidebar-form layer-add round importable-layer fill-white strong', true );
    }

    /**
     * Create toggle button for each form
     */
    createToggleButtons() {
        let buttons = this.forms.append( 'a' )
            .classed( 'toggle-button button dark text-light strong block round', true )
            .attr( 'href', '#' )
            .on( 'click', d => this.toggleForm( d.id ) );

        buttons.append( 'i' )
            .classed( 'material-icons center strong', true )
            .text( 'add' );

        buttons.append( 'span' )
            .classed( 'strong', true )
            .text( d => d.toggleButtonText );
    }

    /**
     * Create fieldset for each form
     */
    createFieldsets() {
        this.fieldsets = this.forms.append( 'fieldset' )
            .classed( 'hidden', true );
    }

    /**
     * Create table for each fieldset
     */
    createTables() {
        this.tables = this.fieldsets.append( 'div' )
            .attr( 'id', d => d.tableId )
            .classed( 'layer-add-table filled-white strong overflow', true )
            .select( d => this.renderFolderTree( d ) );
    }

    /**
     * Render folder tree inside each table
     */
    renderFolderTree( d ) {
        let table = d3.select( `#${ d.tableId }` );

        if ( !this.layerTables[ d.tableId ] ) {
            this.layerTables[ d.tableId ] = new FolderTree( table );
        }

        this.layerTables[ d.tableId ].render();
    }

    /**
     * Open or close add-layer form
     *
     * @param selection - button element
     */
    toggleForm( selection ) {
        let form          = d3.select( `#${ selection }` ),
            button        = form.select( '.toggle-button' ),
            fieldset      = form.select( 'fieldset' ),
            buttonState   = button.classed( 'active' ),
            fieldsetState = fieldset.classed( 'hidden' );

        button.classed( 'active', !buttonState );
        fieldset.classed( 'hidden', !fieldsetState );
    }

    /**
     * Create combobox of recently added layers
     */
    createRecentlyUsedLayers() {
        let recentlyUsed = this.fieldsets.append( 'div' )
            .classed( 'form-field fill-white small keyline-all round', true );

        recentlyUsed.append( 'label' )
            .classed( 'strong fill-light round-top keyline-bottom', true )
            .text( 'Recently Used Layers' );

        recentlyUsed.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Recently Used Layers' )
            .select( function() {
                //let combobox = d3combobox();
            } );
    }

    /**
     * Create color palatte to choose what color the layer will be on the map
     */
    createColorPalette() {
        let colorPalette = this.fieldsets.append( 'div' )
            .classed( 'keyline-all form-field palette clearfix round', true );

        colorPalette.selectAll( 'a' )
            .data( _.reject( HootOSM.getPalette(), c => c.name === 'green' ) )
            .enter()
            .append( 'a' )
            .attr( 'class', function( p ) {
                let activeClass = d3.select( this.parentNode ).datum().color === p.name ? 'active _icon check' : '',
                    osmClass    = p.name === 'osm' ? '_osm' : '';

                return `block float-left keyline-right ${ activeClass } ${ osmClass }`;
            } )
            .attr( 'href', '#' )
            .attr( 'data-color', p => p.name )
            .style( 'background', p => p.hex )
            .on( 'click', function() {
                d3.select( this.parentNode )
                    .selectAll( 'a' )
                    .classed( 'active _icon check', false );

                d3.select( this )
                    .classed( 'active _icon check', true );
            } );
    }

    /**
     * Create button to submit adding a layer
     */
    createSubmitButton() {
        this.fieldsets.append( 'div' )
            .classed( 'form-field action-container', true )
            .append( 'button' )
            .classed( 'dark text-light small strong round', true )
            .text( 'Add Layer' )
            .on( 'click', d => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.submitLayer( d );
            } );
    }

    /**
     * Submit layer event
     *
     * @param d - form data
     */
    submitLayer( d ) {
        let form  = d3.select( `#${ d.id }` ),
            color = form.select( '.palette .active' ).attr( 'data-color' ),
            layerId,
            layerName;

        if ( !form.select( '.sel' ).empty() ) {
            let gNode    = d3.select( form.select( '.sel' ).node().parentNode ),
                textNode = gNode.select( '.dnameTxt' );

            layerName = textNode.attr( 'data-name' );
            layerId   = textNode.attr( 'data-id' );
        } else {
            // error
        }

        let params = {
            name: layerName,
            id: layerId,
            color
        };

        HootOSM.loadLayer( params );

        this.layerControllers[ layerName ] = new LayerController( params, form, this.context );
        this.layerControllers[ layerName ].init();
    }

    layerLoaded( layerName ) {
        this.layerControllers[ layerName ].update();
        this.conflateCheck();
    }

    layerRemoved( [ data, layerName ] ) {
        delete this.layerControllers[ layerName ];

        this.update( data );
        this.conflateCheck();
    }

    conflateCheck() {
        let loadedLayers = LayerManager.getLoadedLayers();

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
        Events.listen( 'layer-loaded', this.layerLoaded, this );
        Events.listen( 'layer-removed', this.layerRemoved, this );
        Events.listen( 'all-loaded', this.conflateCheck, this );
    }
}