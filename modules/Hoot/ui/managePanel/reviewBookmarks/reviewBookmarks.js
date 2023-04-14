/** ****************************************************************************************************
 * File: reviewBookmarks.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _camelCase from 'lodash-es/camelCase';
import _find      from 'lodash-es/find';
import _forEach   from 'lodash-es/forEach';
import _get       from 'lodash-es/get';
import _map       from 'lodash-es/map';

import Tab  from '../tab';

import { d3combobox } from '../../d3.combobox';
import { select as d3_select } from 'd3-selection';

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

        this.filterControls = [
            {
                label: 'Items Per Page',
                name: 'itemsPerPage',
                readonly: 'readonly',
                options: [ 5, 10, 15, 25, 50 ]
            },
            {
                label: 'Sort By',
                name: 'sortBy',
                readonly: 'readonly',
                options: [
                    'Created At',
                    'Created By',
                    'Last Modified At',
                    'Last Modified By',
                    'Map ID'
                ]
            },
            {
                label: 'Filter By Creator',
                name: 'creatorFilter',
                readonly: 'readonly',
            },
            {
                label: 'Filter By Layer Name',
                name: 'layerNameFilter',
                readonly: 'readonly',
            }
        ];

        this.perPageCount   = 10;
        this.currentPageIdx = 0;
        this.bookmarks      = [];

    }

    render() {
        super.render();

        this.createFilterControls();
        this.createBookmarkTable();
        this.createPagination();

        d3_select( '#sortBy' ).property( 'value', 'Created At' );
        d3_select( '#itemsPerPage' ).property( 'value', this.perPageCount );

        this.loadBookmarks();

        return this;
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
            .attr( 'id', d => d.name )
            .attr( 'name', d => d.name )
            .attr( 'readonly', d => d.readonly );

        let showTagged = filtersContainer.append( 'div' )
            .classed( 'showTaggedBtn', true );

        showTagged.append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', 'showTagged' )
            .on( 'change', () => this.loadBookmarks() );

        showTagged.append( 'label' )
            .attr( 'for', 'showTagged' )
            .text( 'Show tagged?' );

        filtersContainer
            .append( 'div' )
            .append( 'button' )
            .classed( 'bookmark-action-button primary flex justify-center', true )
            .text( 'Clear filters' )
            .on( 'click', () => this.clearFilter() );

        let refreshButtonContainer = filtersContainer
            .append( 'div' )
            .append( 'button' )
            .classed( 'bookmark-action-button primary flex justify-center', true )
            .on( 'click', () => this.loadBookmarks() );

        refreshButtonContainer.append( 'i' )
            .classed( 'material-icons small', true )
            .text( 'replay' );

        refreshButtonContainer.append( 'span' )
            .text( 'Refresh' );
    }

    createBookmarkTable() {
        this.bookmarkTable = this.panelWrapper
            .append( 'div' )
            .classed( 'bookmark-table keyline-all', true );
    }

    createPagination() {
        let pagination = this.panelWrapper
            .append( 'div' )
            .classed( 'bookmark-pagination flex justify-between align-center', true );

        this.showingOnPage = pagination
            .append( 'div' )
            .classed( 'showing-on-page', true )
            .html( 'Showing <span class="from-count"></span>-' +
                '<span class="to-count"></span> of ' +
                '<span class="total-count"></span> items'
            );

        let pageNav = pagination
            .append( 'div' )
            .classed( 'page-nav', true );

        this.reverseButtons = pageNav
            .append( 'div' )
            .classed( 'reverse-buttons keyline-all joined', true );

        this.forwardButtons = pageNav
            .append( 'div' )
            .classed( 'forward-buttons keyline-all joined', true );

        this.pageButtons = pageNav
            .insert( 'div', '.forward-buttons' )
            .classed( 'page-buttons keyline-all joined', true );

        this.reverseButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'first_page' )
            .on( 'click', () => {
                this.currentPageIdx = 0;
                this.loadBookmarks();
            } );

        this.reverseButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'chevron_left' )
            .on( 'click', () => {
                this.currentPageIdx--;
                this.loadBookmarks();
            } );

        this.forwardButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'chevron_right' )
            .on( 'click', () => {
                this.currentPageIdx++;
                this.loadBookmarks();
            } );

        this.forwardButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'last_page' )
            .on( 'click', () => {
                this.currentPageIdx = this.pageButtons.selectAll( '.page' ).size() - 1;
                this.loadBookmarks();
            } );
    }

    async loadBookmarks() {
        try {
            // make sure data has already been fetched before continuing
            await Hoot.folders.dataExists();

            // need to know the users because we associate the bookmark to the proper user inside tagBookmarks()
            await Hoot.getAllUsers();

            const params = this.getFilterParams();
            let resp = await Hoot.api.getReviewBookmarks( params );

            this.bookmarks = this.tagBookmarks( resp.reviewBookmarks );
            this.bookmarksTotalCount = resp.totalCount;
            this.creatorsList = resp.creators;
            this.layerNames = resp.layerNames;

        } catch ( err ) {
            err.message = err.data;
            Hoot.message.alert( err );
        } finally {
            this.populateFilterCombos();
        }

        await this.paginateBookmarks();
    }

    getFilterParams() {
        const sortVal = _camelCase( d3_select( '#sortBy' ).node().value );

        const creatorName = d3_select( '#creatorFilter' ).node().value;
        const creatorId = creatorName === '' ? '' : _find( Hoot.config.users, { display_name: creatorName } ).id;

        const layerName = d3_select( '#layerNameFilter' ).node().value;
        const layerId = layerName === '' ? '' : Hoot.layers.findBy( 'name', layerName ).id;

        const showTagged = d3_select( '#showTagged' ).property( 'checked' );

        return {
            limit: this.perPageCount,
            orderBy: sortVal,
            creatorFilter: creatorId,
            layerNameFilter: layerId,
            offset: (this.perPageCount * this.currentPageIdx),
            showTagged: showTagged
        };
    }

    tagBookmarks( bookmarks ) {
        _forEach( bookmarks, bookmark => {
            bookmark.layerName = _get( Hoot.layers.findBy( 'id', bookmark.mapId ), 'name' );
            bookmark.visibility = _get( Hoot.layers.findBy( 'id', bookmark.mapId ), 'public' );
        } );

        return bookmarks;
    }

    populateFilterCombos() {
        // creators dropdown
        _find( this.filterControls, { name: 'creatorFilter' } ).options = this.creatorsList;

        // layer name dropdown
        _find( this.filterControls, { name: 'layerNameFilter' } ).options = this.layerNames;

        _forEach( this.filterControls, d => {
            let combobox = d3combobox()
                .data( _map( d.options, n => {
                    return {
                        value: n,
                        title: n
                    };
                } ) )
                .on( 'accept', () => {
                    if ( d.name === 'itemsPerPage' ) {
                        this.perPageCount = d3_select( '#' + d.name ).property( 'value' );
                    }

                    this.loadBookmarks();
                } );

            d3_select( '#' + d.name )
                .call( combobox );
        } );
    }

    populateBookmarks( bookmarks, hardRefresh ) {
        if ( hardRefresh ) {
            this.bookmarkTable.selectAll( '.bookmark-item' ).remove();
        }

        let items = this.bookmarkTable
            .selectAll( '.bookmark-item' )
            .data( bookmarks, d => d.id );

        items
            .exit()
            .transition()
            .duration( 400 )
            .style( 'opacity', 0 )
            .remove();

        items = items
            .enter()
            .append( 'div' )
            .attr( 'id', d => d.id )
            .classed( 'bookmark-item fill-white keyline-bottom', true )
            .style( 'opacity', 0 );

        items
            .transition()
            .duration( 400 )
            .style( 'opacity', 1 );

        let header = items
            .append( 'div' )
            .classed( 'bookmark-header flex justify-between align-center', true );

        header.append( 'div' )
            .classed( 'bookmark-title truncate', true )
            .append( 'a' )
            .text( data => {
                let title      = data.detail.bookmarkdetail.title,
                    layerName  = data.layerName;

                return `${ title } - ${ layerName }`;
            } )
            .on( 'click', (d3_event, d) => this.openBookmarkNotes( d ) );

        let details = header
            .append( 'div' )
            .classed( 'bookmark-details truncate', true );

        details.append( 'span' )
            .text( data => {
                let createdAt = new Date( data.createdAt ).toLocaleString(),
                    createdBy = Hoot.config.users[ data.createdBy ].display_name;

                return `${ createdAt } by ${ createdBy }`;
            } );

        let description = header
            .append( 'div' )
            .classed( 'bookmark-description truncate', true );

        description.append( 'span' )
            .text( d => d.detail.bookmarkdetail.desc );

        header.append( 'div' )
            .classed( 'delete-bookmark', true )
            .append( 'button' )
            .classed( '_icon trash', true )
            .on( 'click', (d3_event, d) => this.deleteBookmark( d ) );
    }

    clearFilter() {
        d3_select( '#sortBy' ).property( 'value', 'Created At' );
        d3_select( '#creatorFilter' ).property( 'value', '' );
        d3_select( '#layerNameFilter' ).property( 'value', '' );

        this.currentPageIdx = 0;
        this.loadBookmarks();
    }

    paginateBookmarks() {
        // last bookmark on page was deleted so move back one page and re-render
        if ( this.bookmarks.length === 0 && this.currentPageIdx > 0 ) {
            this.currentPageIdx--;
            this.loadBookmarks();
            return;
        }

        let pageCount = Math.ceil( this.bookmarksTotalCount / this.perPageCount ),
            items     = [ ...Array( pageCount ).keys() ],
            lastIdx   = pageCount - 1;

        let from  = this.perPageCount * this.currentPageIdx + 1,
            to    = this.perPageCount * (this.currentPageIdx + 1);

        this.showingOnPage.select( '.from-count' ).text( from );
        this.showingOnPage.select( '.to-count' ).text( to );
        this.showingOnPage.select( '.total-count' ).text( this.bookmarksTotalCount );

        let pages = this.pageButtons
            .selectAll( '.page' )
            .data( items );

        pages.exit().remove();

        pages
            .enter()
            .append( 'button' )
            .classed( 'page', true )
            .attr( 'data-index', d => d )
            .text( d => d + 1 )
            .on( 'click', (d3_event, d) => {
                this.currentPageIdx = d;
                this.loadBookmarks();
            } );

        this.pageButtons
            .selectAll( '.page' )
            .classed( 'selected', false );

        this.pageButtons
            .select( `[data-index="${ this.currentPageIdx }"]` )
            .classed( 'selected', true );

        this.reverseButtons.selectAll( 'button' )
            .property( 'disabled', this.currentPageIdx === 0 );

        this.forwardButtons
            .selectAll( 'button' )
            .property( 'disabled', this.currentPageIdx === lastIdx );

        this.populateBookmarks( this.bookmarks, true );
    }

    async deleteBookmark( d3_event, d ) {
        d3_event.stopPropagation();
        d3_event.preventDefault();

        let message = 'Are you sure you want to delete selected bookmark?',
            confirm = await Hoot.message.confirm( message );

        if ( !confirm ) return;

        return Hoot.api.deleteReviewBookmark( d.id )
            .then( resp => Hoot.message.alert( resp ) )
            .then( () => this.loadBookmarks() );
    }

    openBookmarkNotes( d ) {
        let bookmarkNotes = Hoot.ui.managePanel.bookmarkNotes;

        bookmarkNotes.toggle( true );
        bookmarkNotes.load( d );
    }
}
