/** ****************************************************************************************************
 * File: reviewBookmarks.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _get from 'lodash-es/get';
import _map from 'lodash-es/map';

import Hoot from '../../../hoot';
import Tab  from '../tab';

import { d3combobox } from 'lib/hoot/d3.combobox'; // resolved by include-paths rollup plugin

/**
 * Creates the review-bookmarks tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class ReviewBookmarks extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Review Bookmarks';
        this.id   = 'util-review-bookmarks';

        this.showItemCount = 10;
        this.bookmakrs     = [];

        this.filterControls = [
            {
                label: 'Sort By',
                name: 'sortBy',
                options: [
                    'Created At',
                    'Created By',
                    'Modified At',
                    'Modified By',
                    'Map ID'
                ]
            },
            {
                label: 'Filter By Creator',
                name: 'filterCreator'
            },
            {
                label: 'Filter By Layer Name',
                name: 'filterLayerName'
            }
        ];
    }

    render() {
        super.render();

        this.createFilterControls();
        this.createBookmarkTable();

        this.loadBookmarks();
    }

    createFilterControls() {
        let filtersContainer = this.panelWrapper
            .append( 'div' )
            .classed( 'bookmark-filter-container', true );

        let controls = filtersContainer
            .selectAll( '.filter-control' )
            .data( this.filterControls )
            .enter();

        let control = controls
            .append( 'div' )
            .classed( 'filter-control', true );

        control
            .append( 'label' )
            .text( d => d.label );

        control
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'name', d => d.name )
            .select( function( d ) {
                let combobox = d3combobox()
                    .data( _map( d.options, n => {
                        return {
                            value: n,
                            title: n
                        };
                    } ) );

                d3.select( this ).call( combobox );
            } );

        let resetButtonContainer = filtersContainer
            .append( 'div' )
            .classed( 'reset-button-container', true );

        resetButtonContainer
            .append( 'button' )
            .classed( 'reset-button primary flex justify-center', true )
            .append( 'i' )
            .classed( 'material-icons', true )
            .text( 'replay' );
    }

    createBookmarkTable() {
        this.bookmarkTable = this.panelWrapper
            .append( 'div' )
            .classed( 'bookmark-table keyline-all fill-white', true );
    }

    async loadBookmarks() {
        try {
            // make sure data has already been fetched before continuing
            await Hoot.folders.dataExists();

            let resp = await Hoot.api.getReviewBookmarks();

            this.bookmarks = resp.reviewBookmarks;
        } catch ( e ) {
            console.log( 'Unable to retrieve bookmarks for review' );
            throw new Error( e );
        } finally {
            this.populateBookmarks();
        }
    }

    populateBookmarks() {
        let items = this.bookmarkTable
            .selectAll( '.bookmark-item' )
            .data( this.bookmarks, d => d.id );

        items = items
            .enter()
            .append( 'div' )
            .classed( 'bookmark-item keyline-all round', true );

        items = items
            .merge( items );

        items.exit().remove();

        let wrapper = items
            .append( 'div' )
            .classed( 'bookmark-wrapper', true );

        let header = wrapper
            .append( 'div' )
            .classed( 'bookmark-header flex justify-between align-center', true );

        header
            .append( 'div' )
            .classed( 'bookmark-title', true )
            .append( 'a' )
            .text( this.renderBookmarkTitle );

        header
            .append( 'div' )
            .classed( 'delete-bookmark', true )
            .append( 'button' )
            .classed( '_icon trash', true )
            .on( 'click', d => this.deleteBookmark( d ) );

        let body = wrapper
            .append( 'div' )
            .classed( 'bookmark-body', true );

        let description = body
            .append( 'div' )
            .classed( 'bookmark-description', true );

        description
            .append( 'label' )
            .text( 'Description:' );

        description
            .append( 'span' )
            .text( d => d.detail.bookmarkdetail.desc );

        let details = body
            .append( 'div' )
            .classed( 'bookmark-details', true );

        details
            .append( 'label' )
            .text( 'Created At:' );

        details
            .append( 'span' )
            .text( this.renderBookmarkCreatedBy );
    }

    renderBookmarkTitle( d ) {
        let layerName      = _get( Hoot.layers.findBy( 'id', d.mapId ), 'name' ),
            relationId     = `r${ d.relationId }_${ d.mapId }`,
            details = d.detail.bookmarkdetail;

        return `${ details.title } - [${ layerName } : ${ relationId }]`;
    }

    renderBookmarkCreatedBy( d ) {
        let createdAt = new Date( d.createdAt ).toLocaleString(),
            createdBy = 'matt@test.com';

        return `${ createdAt } by ${ createdBy }`;
    }

    async deleteBookmark( d ) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        let message = 'Are you sure you want to delete selected bookmark?',
            confirm = await Hoot.message.confirm( message );

        if ( !confirm ) return;

        return Hoot.api.deleteReviewBookmark( d.id )
            .then( resp => Hoot.message.alert( resp ) )
            .then( () => this.loadBookmarks() );
    }
}