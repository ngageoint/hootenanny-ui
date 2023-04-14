/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import _map from 'lodash-es/map';

import Datasets            from './datasets';
import Jobs                from './jobs';
import TransAssist         from './transAssist/transAssist';
import Translations        from './translations';
import Basemaps            from './basemaps';
import ReviewBookmarks     from './reviewBookmarks/reviewBookmarks';
import ReviewBookmarkNotes from './reviewBookmarks/reviewBookmarkNotes';
import AdminPanel          from './adminPanel';
import TaskingManagerPanel from './TaskingManagerPanel';
import { select as d3_select } from 'd3-selection';

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
        this.manageTabs = [
            Datasets,
            Jobs,
            Basemaps,
            Translations,
            TransAssist,
            ReviewBookmarks,
            ReviewBookmarkNotes
        ];

        this.isOpen = false;
    }

    /**
     * Render base panel and all of its components
     */
    render() {
        this.container = d3_select( 'body' )
            .insert( 'div', '#id-container' )
            .attr( 'id', 'manage-panel' )
            .classed( 'hidden', true );

        this.panelSidebar = this.container
            .append( 'div' )
            .attr( 'id', 'manage-sidebar-menu' )
            .classed( 'wrapper fill-light keyline-right', true );

        this.panelSidebar
            .append( 'h3' )
            .classed( 'manage-header pad1y strong center', true )
            .append( 'label' )
            .text( 'Manage Panel' );

        return this;
    }

    renderTabs() {
        if ( Hoot.users.isAdvanced() ) {
            this.manageTabs.push( TaskingManagerPanel );
        }

        if ( Hoot.users.isAdmin() ) {
            this.manageTabs.push( AdminPanel );
        }
        // Render all tabs
        return Promise.all( _map( this.manageTabs, Tab => new Tab( this ).render() ) )
            .then( modules => {
                this.datasets        = modules[ 0 ];
                this.jobs            = modules[ 1 ];
                this.basemaps        = modules[ 2 ];
                this.translations    = modules[ 3 ];
                this.transAssist     = modules[ 4 ];
                this.reviewBookmarks = modules[ 5 ];
                this.bookmarkNotes   = modules[ 6 ];
                this.tabs = modules;
            } );
    }

}
