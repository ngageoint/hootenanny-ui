/*******************************************************************************************************
 * File: layerAdd.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/10/18
 *******************************************************************************************************/

import _map    from 'lodash-es/map';
import _reject from 'lodash-es/reject';

import FolderTree  from '../../tools/folderTree';
import SidebarForm from './sidebarForm';

import { d3combobox } from '../d3.combobox';

export default class LayerAdd extends SidebarForm {
    constructor( container, d ) {
        super( container, d );

        this.selectedLayer = {
            name: null,
            id: null
        };
    }

    render( data ) {
        super.render( data );

        this.createFieldset();
        this.createTable();
        this.createRecentlyUsedLayers();
        this.createColorPalette();
        this.createSubmitButton();
        this.renderFolderTree();

        this.listen();
    }

    /**
     * Create fieldset container for form
     */
    createFieldset() {
        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    /**
     * Create table inside fieldset
     */
    createTable() {
        this.table = this.fieldset
            .append( 'div' )
            .attr( 'id', d => d.tableId )
            .classed( 'layer-add-table layer-table keyline-all filled-white strong overflow', true )
            .on( 'click', () => {
                let rect     = this.table.select( '.sel' ),
                    selected = !rect.empty();

                this.form.select( '.add-layer' ).property( 'disabled', !selected );

                if ( selected ) {
                    let input = this.form.select( '.recently-used-input' ),
                        gNode = d3.select( rect.node().parentNode );

                    input.property( 'value', '' );
                    input.node().blur();

                    this.selectedLayer.name = gNode.attr( 'data-name' );
                    this.selectedLayer.id   = Number(gNode.attr( 'data-id' ));
                } else {
                    this.selectedLayer.name = null;
                    this.selectedLayer.id   = null;
                }
            } );
    }

    /**
     * Render folder tree inside table
     */
    renderFolderTree() {
        if ( !this.folderTree ) {
            this.folderTree = new FolderTree( this.table );
            this.folderTree.setDoubleClickHandler(this, () => this.submitLayer());
        }

        this.folderTree.render();
    }

    /**
     * Create combobox of recently added layers
     */
    createRecentlyUsedLayers() {
        let that = this;

        let recentlyUsed = this.fieldset.append( 'div' )
            .classed( 'hoot-form-field fill-white small keyline-all round', true );

        recentlyUsed.append( 'label' )
            .classed( 'strong fill-light round-top keyline-bottom', true )
            .text( 'Recently Used Layers' );

        recentlyUsed.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'placeholder', 'Recently Used Layers' )
            .classed( 'recently-used-input', true )
            .select( function() {
                if ( Hoot.layers.recentlyUsedLayers ) {
                    that.updateRecentlyUsed();
                }
            } );
    }

    /**
     * Create color palatte to choose what color the layer will be on the map
     */
    createColorPalette() {
        let colorPalette = this.fieldset.append( 'div' )
            .classed( 'keyline-all form-field palette clearfix round', true );

        colorPalette.selectAll( 'a' )
            .data( _reject( Hoot.layers.getPalette(), c => c.name === 'green' ) )
            .enter()
            .append( 'a' )
            .attr( 'class', function( p ) {
                let activeClass = d3.select( this.parentNode ).datum().color === p.name ? 'active _icon check' : '',
                    osmClass    = p.name === 'osm' ? '_osm' : '';

                return `block float-left keyline-right ${ activeClass } ${ osmClass }`;
            } )
            // .attr( 'href', '#' )
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
        this.fieldset.append( 'div' )
            .classed( 'hoot-form-field action-container', true )
            .append( 'button' )
            .classed( 'add-layer dark text-light small strong round', true )
            .property( 'disabled', true )
            .text( 'Add Layer' )
            .on( 'click', (d3_event) => {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                this.submitLayer();
            } );
    }

    updateRecentlyUsed() {
        let that = this;

        if ( this.selectedLayer.name ) {
            Hoot.layers.setRecentlyUsedLayers( this.selectedLayer.name );
        }

        let combobox = d3combobox()
            .data( _map( Hoot.layers.recentlyUsedLayers, n => {
                return {
                    value: n,
                    title: n
                };
            } ) );

        this.form.select( '.recently-used-input' )
            .call( combobox )
            .on( 'change', function() {
                if ( !that.table.select( '.sel' ).empty() ) {
                    let evt = new MouseEvent( 'click' );

                    that.table.select( '.sel' ).node().parentNode.dispatchEvent( evt );
                }

                that.form.select( '.add-layer' ).property( 'disabled', false );

                let name = d3.select( this ).property( 'value' ),
                    id   = Hoot.layers.findBy( 'name', name ).id;

                that.selectedLayer.name = name;
                that.selectedLayer.id   = id;
            } );
    }

    /**
     * Submit layer event
     *
     * @param d - form data
     */
    async submitLayer( d, skipCheckForReview = false ) {
        let color = this.form.select( '.palette .active' ).attr( 'data-color' );

        let params = {
            name: d ? d.name : this.selectedLayer.name,
            id: d ? d.id : this.selectedLayer.id,
            refType: this.formMeta.refType,
            color
        };

        //exits for folder double-click
        if (!params.id) return;

        this.loadingState( params );

        await Hoot.layers.loadLayer( params, skipCheckForReview );

        Hoot.events.emit( 'load-layer' );
    }

    /**
     * Listen for events
     */
    listen() {
        // Need refType to differentiate between panel for add reference dataset and add secondary dataset
        const className = `${ this.constructor.name }_${ this.formMeta.refType }`;

        Hoot.events.listen( className, 'render-dataset-table', () => {
            this.renderFolderTree();
            Hoot.layers.syncRecentlyUsedLayers();
            this.updateRecentlyUsed();
        } );

        Hoot.events.listen( className, 'recent-layers-retrieved', () => this.updateRecentlyUsed() );
        Hoot.events.listen( className, 'load-layer', () => this.updateRecentlyUsed() );
    }
}
