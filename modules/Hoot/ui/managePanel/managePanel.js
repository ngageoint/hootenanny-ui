/** ****************************************************************************************************
 * File: managePanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _                   from 'lodash-es';
import Hoot                from '../../hoot';
import Datasets            from './datasets';
import TransAssist         from './transAssist/transAssist';
import Translations        from './translations';
import Basemaps            from './basemaps';
import ReviewBookmarks     from './reviewBookmarks';
import ReviewBookmarkNotes from './reviewBookmarkNotes';

/**
 * Creates the settings panel
 *
 * @constructor
 */
export default class ManagePanel {
    /**
     * @constructor
     */
    constructor() {
        this.container = d3.select( '#id-container' );

        this.manageTabs = [
            Datasets,
            Basemaps,
            Translations,
            TransAssist,
            ReviewBookmarks,
            ReviewBookmarkNotes
        ];
    }

    /**
     * Render base panel and all of its components
     */
    async render() {
        this.panel = this.container
            .append( 'div' )
            .attr( 'id', 'manage-panel' )
            .classed( 'hidden', true );

        this.panelSidebar = this.panel.append( 'div' )
            .attr( 'id', 'manage-sidebar-menu' )
            .classed( 'wrapper fill-light keyline-right', true );

        this.panelSidebar.append( 'h3' )
            .classed( 'manage-header pad1y pointer strong center', true )
            .append( 'label' )
            .text( 'Manage Panel' );

        // Create all tab items in the panel
        Promise.all( _.map( this.manageTabs, Tab => new Tab( this ).render() ) )
            .then( () => this.listen() );

        return this;
    }

    /**
     * Toggle tab body into view
     *
     * @param id - panel id
     */
    toggleTab( id ) {
        d3.selectAll( '.panel-body' ).classed( 'active', false );
        d3.select( '#' + id ).classed( 'active', true );

        this.panelSidebar
            .selectAll( '.tab-header' )
            .classed( 'strong', false );

        d3.select( `[data-id="#${id}"` ).classed( 'strong', true );
    }

    listen() {
        Hoot.events.on( 'tab-toggle', d => this.toggleTab( d ) );
    }
}