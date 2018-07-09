/** ****************************************************************************************************
 * File: basemaps.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import API from '../../control/api';
import Tab from '../tab';
import BasemapAddForm from './basemapAddForm';

/**
 * Creates the basemaps tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Basemaps extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Basemaps';
        this.id   = 'util-basemaps';
    }

    render() {
        super.render();

        this.createNewBasemapButton();
        this.createBasemapTable();

        this.loadBasemaps();
    }

    createNewBasemapButton() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-basemap-button button primary _icon big light plus', true )
            .text( 'Add New Basemap' )
            .on( 'click', () => new BasemapAddForm().render() );
    }

    createBasemapTable() {
        this.basemapTable = this.panelWrapper
            .append( 'div' )
            .classed( 'basemap-table keyline-all fill-white', true );
    }

    async loadBasemaps() {
        try {
            let basemaps = await API.getBasemaps();

            this.populateBasemaps( basemaps );
        } catch ( e ) {
            console.log( 'Unable to retrieve basemaps' );
            throw new Error( e );
        }
    }

    populateBasemaps( basemaps ) {
        let instance = this;

        let rows = this.basemapTable
            .selectAll( '.basemap-item' )
            .data( basemaps, d => d.name );

        rows.exit().remove();

        let basemapItem = rows
            .enter()
            .append( 'div' )
            .classed( 'basemap-item keyline-bottom', true );

        rows.merge( basemapItem );

        basemapItem

            .append( 'span' )
            .text( d => d.name );

        let buttonContainer = basemapItem
            .append( 'div' )
            .classed( 'button-container fr', true );

        buttonContainer
            .append( 'button' )
            .classed( 'keyline-left _icon openeye', true )
            .on( 'click', d => {

            } );

        buttonContainer
            .append( 'button' )
            .classed( 'keyline-left _icon trash', true )
            .on( 'click', function( d ) {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let r = confirm( `Are you sure you want to delete: ${ d.name }?` );
                if ( !r ) return;

                API.deleteBasemap( d.name )
                    .then( () => instance.loadBasemaps() );
            } );
    }
}

