/** ****************************************************************************************************
 * File: basemaps.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import AddBasemap                 from '../modals/addBasemap';
import Tab                        from './tab';
import { geoExtent as GeoExtent } from '../../../geo/index';
import _filter                   from 'lodash-es/filter';

/**
 * Creates the basemaps tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Basemaps extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Basemaps';
        this.id   = 'util-basemaps';
    }

    render() {
        super.render();

        this.createNewBasemapButton();
        this.createBasemapTable();

        this.loadBasemaps();

        return this;
    }

    createNewBasemapButton() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-basemap-button button primary _icon big light plus', true )
            .text( 'Add New Basemaps' )
            .on( 'click', () => new AddBasemap( this ).render() );
    }

    createBasemapTable() {
        this.basemapTable = this.panelWrapper
            .append( 'div' )
            .classed( 'basemap-table keyline-all fill-white', true );
    }

    async loadBasemaps() {
        try {
            let basemaps = await Hoot.api.getBasemaps();

            this.populateBasemaps( basemaps );

        } catch ( e ) {
            window.console.error( 'Unable to retrieve basemaps' );
            throw new Error( e );
        }
    }

    populateBasemaps( basemaps ) {
        let instance = this;

        let allBasemaps = _filter(basemaps, function(b) { return b.status === 'enabled' || b.status === 'disabled'; } );

        let rows = this.basemapTable
            .selectAll( '.basemap-item' )
            .data( allBasemaps, d => d.name );

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
            .classed( 'keyline-left _icon', true )
            .on( 'click', function( d3_event, d ) {
                let button = d3.select( this );

                d3_event.stopPropagation();
                d3_event.preventDefault();

                if ( d.status === 'disabled' ) {
                    Hoot.api.enableBasemap( d ).then( () => {
                        button
                            .classed( 'closedeye', false )
                            .classed( 'openeye', true );

                        d.status = 'enabled';

                        instance.renderBasemap( d );
                    } );
                } else {
                    Hoot.api.disableBasemap( d ).then( () => {
                        button
                            .classed( 'closedeye', true )
                            .classed( 'openeye', false );

                        d.status = 'disabled';

                        Hoot.context.background().removeBackgroundSource( d );
                    } );
                }
            } )
            .select( function( d ) {
                let button = d3.select( this );

                if ( d.status === 'processing' ) {
                    button.classed( 'closedeye' , true );
                    button.classed( 'disabled', true );
                } else if ( d.status === 'failed' ) {
                    button.classed( 'closedeye' , true );
                    button.classed( 'disabled', true );
                } else if ( d.status === 'disabled' ) {
                    button.classed( 'closedeye', true );
                    button.classed( 'openeye', false );
                } else {
                    button.classed( 'closedeye', false );
                    button.classed( 'openeye', true );
                    // basemaps is already enabled, so just render it in the UI
                    instance.renderBasemap( d );
                }
            } );

        buttonContainer
        .append( 'button' )
        .classed( 'keyline-left _icon trash', true )
        .on( 'click', function( d3_event, d ) {
            d3_event.stopPropagation();
            d3_event.preventDefault();

            let r = confirm( `Are you sure you want to delete: ${ d.name }?` );
            if ( !r ) return;

            Hoot.api.deleteBasemap( d.name )
                .then( () => instance.loadBasemaps() );
        } );
    }

    renderBasemap( d ) {
        let path = window.location.pathname;
        let pathWithoutFile = path.substr(0, path.lastIndexOf('/'));
        let pathRelative = (pathWithoutFile === '') ? '' : '..';

        let newSource = {
            name: d.name,
            id: d.name,
            type: 'tms',
            projection: 'mercator',
            template: `${ pathRelative }/static/BASEMAP/${ d.name }/{zoom}/{x}/{-y}.png`,
            default: true,
            nocache: true,
            extent: new GeoExtent( [ d.extent.minx, d.extent.miny ], [ d.extent.maxx, d.extent.maxy ] )
        };

        Hoot.context.background().addNewBackgroundSource( newSource );
    }
}

