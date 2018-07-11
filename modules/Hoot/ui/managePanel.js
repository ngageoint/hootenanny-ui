/** ****************************************************************************************************
 * File: managePanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _                   from 'lodash-es';
import Event               from '../managers/eventManager';
import Datasets            from './managePanel/datasets/datasets';
import TransAssist         from './managePanel/transAssist/transAssist';
import Translations        from './managePanel/translations/translations';
import Basemaps            from './managePanel/basemaps/basemaps';
import ReviewBookmarks     from './managePanel/reviewBookmarks';
import ReviewBookmarkNotes from './managePanel/reviewBookmarkNotes';

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
    constructor( container, context ) {
        this.context   = context;
        this.container = container;

        this.manageTabs = [
            Datasets,
            TransAssist,
            Translations,
            Basemaps,
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
            .text( 'Settings Panel' );

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