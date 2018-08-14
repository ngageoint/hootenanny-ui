/** ****************************************************************************************************
 * File: managePanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _                   from 'lodash-es';
import Event               from '../../managers/eventManager';
import Datasets            from './datasets/datasets';
import TransAssist         from './transAssist/transAssist';
import Translations        from './translations/translations';
import Basemaps            from './basemaps/basemaps';
import ReviewBookmarks     from './reviewBookmarks';
import ReviewBookmarkNotes from './reviewBookmarkNotes';

/**
 * Creates the settings panel
 *
 * @constructor
 */
export default class ManagePanel {
    /**
     *
     * @constructor
     * @param container
     */
    constructor( context ) {
        this.context   = context;
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
        Promise.all( _.map( this.manageTabs, Tab => new Tab( this ).render() ) );

        this.listen();

        return this;
    }

    /**
     * Toggle tab body into view
     *
     * @param d - node data
     */
    toggleTab( d ) {
        this.activeId  = d3.select( d ).attr( 'data-id' );
        let activeBody = d3.select( this.activeId ).node();

        this.panel.node()
            .appendChild( activeBody );

        this.panelSidebar.selectAll( '.tab-header' )
            .classed( 'strong', false );

        d3.select( d )
            .classed( 'strong', true );
    }

    /**
     * Listen for tab change
     */
    listen() {
        Event.listen( 'toggle-manage-tab', this.toggleTab, this );
    }
}