/*******************************************************************************************************
 * File: sidebarAddForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/10/18
 *******************************************************************************************************/

import _           from 'lodash-es';
import FolderTree  from '../models/folderTree';
import HootOSM     from '../../managers/hootOsm';
import SidebarForm from './sidebarForm';
import Event       from '../../managers/eventManager';

export default class SidebarAddForm extends SidebarForm {
    constructor( ...params ) {
        super( params );
    }

    render() {
        super.render();

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
        //this.innerWrapper = this.form.append( 'div' )
        //    .classed( 'inner-wrapper', true );

        this.fieldset = this.innerWrapper.append( 'fieldset' );
    }

    /**
     * Create table inside fieldset
     */
    createTable() {
        this.table = this.fieldset.append( 'div' )
            .attr( 'id', d => d.tableId )
            .classed( 'layer-add-table keyline-all filled-white strong overflow', true )
    }

    /**
     * Render folder tree inside table
     */
    renderFolderTree() {
        if ( !this.folderTree ) {
            this.folderTree = new FolderTree( this.table );
        }

        this.folderTree.render();
    }

    /**
     * Create combobox of recently added layers
     */
    createRecentlyUsedLayers() {
        let recentlyUsed = this.fieldset.append( 'div' )
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
        let colorPalette = this.fieldset.append( 'div' )
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
        this.fieldset.append( 'div' )
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
        let color = this.form.select( '.palette .active' ).attr( 'data-color' ),
            layerId,
            layerName;

        if ( !this.form.select( '.sel' ).empty() ) {
            let gNode    = d3.select( this.form.select( '.sel' ).node().parentNode ),
                textNode = gNode.select( '.dnameTxt' );

            layerName = textNode.attr( 'data-name' );
            layerId   = textNode.attr( 'data-id' );
        } else {
            // error
        }

        let params = {
            name: layerName,
            refType: d.refType,
            id: layerId,
            color
        };

        this.loadingState( params );
        this.loadLayer( params );
    }

    /**
     * Listen for re-render
     */
    listen() {
        super.listen();
        Event.listen( 'render-dataset-table', this.renderFolderTree, this );
    }
}