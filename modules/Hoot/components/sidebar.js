/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/19/18
 *******************************************************************************************************/

import Events from '../util/events';
import FolderTree from './folderTree';
import { sidebarForms } from '../config/domElements';

/**
 * Create the sidebar
 *
 * @constructor
 */
export default class Sidebar {
    constructor( container ) {
        this.container = container;
        this.formData  = sidebarForms;
        this.layerTables = {};
    }

    /**
     * Render all components inside sidebar
     */
    async render() {
        this.createForms();
        this.createToggleButtons();
        this.createFieldsets();
        this.createTables();

        this.listen();
    }

    /**
     * Bind form data and create a form for each item
     */
    createForms() {
        this.forms = this.container.selectAll( 'form' )
            .data( this.formData )
            .enter().append( 'form' )
            .attr( 'id', d => d.id )
            .classed( 'add-layer-form round importable-layer fill-white strong', true );
        //.on( 'submit', d => this.toggleForm( d.id ) );
    }

    /**
     * Create toggle button for each form
     */
    createToggleButtons() {
        let buttons = this.forms.append( 'a' )
            .classed( 'toggle-button strong block', true )
            .attr( 'href', '#' )
            .on( 'click', d => this.toggleForm( d.id ) );

        buttons.append( 'i' )
            .classed( 'material-icons text-center strong', true )
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
            .classed( 'add-layer-table filled-white strong overflow', true )
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
     * Listen for re-render
     */
    listen() {
        Events.listen( 'render-layer-tables', this.renderFolderTree, d3.selectAll( '.add-layer-table' ) );
    }
}