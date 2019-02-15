/** ****************************************************************************************************
 * File: reviewBookmarks.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _camelCase from 'lodash-es/camelCase';
import _debounce  from 'lodash-es/debounce';
import _filter    from 'lodash-es/filter';
import _forEach   from 'lodash-es/forEach';
import _get       from 'lodash-es/get';
import _isEqual   from 'lodash-es/isEqual';
import _map       from 'lodash-es/map';
import _reject    from 'lodash-es/reject';
import _slice     from 'lodash-es/slice';
import _sortBy    from 'lodash-es/sortBy';
import _uniq      from 'lodash-es/uniq';

import Tab  from '../tab';

import { d3combobox } from '../../../../lib/hoot/d3.combobox';

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
                name: 'filterByCreator'
            },
            {
                label: 'Filter By Layer Name',
                name: 'filterByLayerName'
            }
        ];

        this.perPageCount   = 10;
        this.currentPageIdx = 0;
        this.bookmarks      = [];

        this.defaultSortOpt = 'createdAt';

        this.defaultFilterOpts = {
            createdBy: '',
            layerName: ''
        };

        this.filterOpts = this.defaultFilterOpts;
    }

    render() {
        super.render();

        this.createFilterControls();
        this.createBookmarkTable();
        this.createPagination();

        d3.select( '#sortBy' ).property( 'value', 'Created At' );
        d3.select( '#itemsPerPage' ).property( 'value', this.perPageCount );

        this.loadBookmarks()
            .then( bookmarks => {
                this.currentBookmarks = this.sortBookmarks( bookmarks );

                this.paginateBookmarks();
            } );

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

        let resetButtonContainer = filtersContainer
            .append( 'div' )
            .classed( 'reset-button-container', true );

        resetButtonContainer
            .append( 'button' )
            .classed( 'reset-button primary flex justify-center', true )
            .append( 'i' )
            .classed( 'material-icons small', true )
            .text( 'replay' )
            .on( 'click', () => this.resetFilter() );
    }

    createBookmarkTable() {
        this.bookmarkTable = this.panelWrapper
            .append( 'div' )
            .classed( 'bookmark-table keyline-all', true )
            .append( 'div' )
            .classed( 'inner-wrapper', true );
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
                this.paginateBookmarks();
            } );

        this.reverseButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'chevron_left' )
            .on( 'click', () => {
                this.currentPageIdx--;
                this.paginateBookmarks();
            } );

        this.forwardButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'chevron_right' )
            .on( 'click', () => {
                this.currentPageIdx++;
                this.paginateBookmarks();
            } );

        this.forwardButtons
            .append( 'button' )
            .classed( 'material-icons', true )
            .text( 'last_page' )
            .on( 'click', () => {
                this.currentPageIdx = this.pageButtons.selectAll( '.page' ).size() - 1;
                this.paginateBookmarks();
            } );
    }

    async loadBookmarks() {
        try {
            // make sure data has already been fetched before continuing
            await Hoot.folders.dataExists();

            let resp = await Hoot.api.getReviewBookmarks();

            this.bookmarks = this.parseBookmarks( resp.reviewBookmarks );

            return this.bookmarks;
        } catch ( e ) {
            // TODO: show alert
            // window.console.log( 'Unable to retrieve bookmarks for review' );
            throw new Error( e );
        } finally {
            this.populateFilterCombos();
        }
    }

    parseBookmarks( bookmarks ) {

        _forEach( bookmarks, bookmark => {
            let createdBy = 'anonymous';

            if ( Hoot.config.users[ bookmark.createdBy ] ) {
                createdBy = Hoot.config.users[ bookmark.createdBy ].email;
            }

            bookmark.createdBy = createdBy;
            bookmark.layerName = _get( Hoot.layers.findBy( 'id', bookmark.mapId ), 'name' );
        } );

        return bookmarks;
    }

    populateFilterCombos() {
        // created by
        this.filterControls[ 2 ].options = _uniq( _map( this.bookmarks, bookmark => {
            return bookmark.createdBy;
        } ) );

        // layer name
        this.filterControls[ 3 ].options = _uniq( _map( this.bookmarks, bookmark => {
            return bookmark.layerName;
        } ) );

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
                        this.perPageCount = d3.select( '#' + d.name ).property( 'value' );
                        this.paginateBookmarks();
                    } else if ( d.name === 'sortBy' ) {
                        this.currentBookmarks = this.sortBookmarks( this.currentBookmarks );
                        this.paginateBookmarks();
                    } else {
                        this.setFilterOpt( d );
                    }
                } );

            d3.select( '#' + d.name )
                .call( combobox )
                .on( 'input', _debounce( () => this.setFilterOpt( d ), 400 ) );
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
            .text( this.renderBookmarkTitle )
            .on( 'click', d => this.openBookmarkNotes( d ) );

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
        let title      = d.detail.bookmarkdetail.title,
            layerName  = d.layerName,
            relationId = `r${ d.relationId }_${ d.mapId }`;

        return `${ title } - [${ layerName } : ${ relationId }]`;
    }

    renderBookmarkCreatedBy( d ) {
        let createdAt = new Date( d.createdAt ).toLocaleString(),
            createdBy = d.createdBy;

        return `${ createdAt } by ${ createdBy }`;
    }

    setFilterOpt( d ) {
        let value = d3.select( '#' + d.name ).node().value;

        this.filterOpts[ d.name ] = value.toLowerCase();

        this.filterBookmarks();
    }

    resetFilter() {
        d3.select( '#sortBy' ).property( 'value', 'Created At' );
        d3.select( '#filterByCreator' ).property( 'value', '' );
        d3.select( '#filterByLayerName' ).property( 'value', '' );

        this.currentPageIdx = 0;

        this.populateBookmarks( this.sortBookmarks( this.bookmarks ), true );
    }

    filterBookmarks() {
        let createdByVal = d3.select( '#filterByCreator' ).node().value.toLowerCase(),
            layerNameVal = d3.select( '#filterByLayerName' ).node().value.toLowerCase();

        let creatorFiltered,
            layerNameFiltered;

        if ( createdByVal.length ) {
            creatorFiltered = _filter( this.bookmarks, bookmark => {
                let createdBy = bookmark.createdBy.toLowerCase();

                if ( createdBy.indexOf( createdByVal ) > -1 ) {
                    return bookmark;
                }
            } );
        } else {
            creatorFiltered = this.bookmarks;
        }

        if ( layerNameVal.length ) {
            layerNameFiltered = _filter( creatorFiltered, bookmark => {
                let layerName = bookmark.layerName.toLowerCase();

                if ( layerName.indexOf( layerNameVal ) > -1 ) {
                    return bookmark;
                }
            } );
        } else {
            layerNameFiltered = creatorFiltered;
        }

        if ( !_isEqual( this.currentBookmarks, layerNameFiltered ) ) {
            this.currentPageIdx   = 0;
            this.currentBookmarks = this.sortBookmarks( layerNameFiltered );

            this.paginateBookmarks();
        }
    }

    sortBookmarks( bookmarks ) {
        let sortOpt = _camelCase( d3.select( '#sortBy' ).node().value );

        bookmarks = _sortBy( bookmarks, sortOpt );

        return bookmarks;
    }

    paginateBookmarks() {
        // slice appropriate range of items from array
        let startIdx  = this.perPageCount * this.currentPageIdx,
            endIdx    = this.perPageCount * (this.currentPageIdx + 1),
            bookmarks = _slice( this.currentBookmarks, startIdx, endIdx );

        // last bookmark on page was deleted so move back one page and re-render
        if ( bookmarks.length === 0 && this.currentPageIdx > 0 ) {
            this.currentPageIdx--;
            this.paginateBookmarks();
            return;
        }

        let pageCount = Math.ceil( this.currentBookmarks.length / this.perPageCount ),
            items     = [ ...Array( pageCount ).keys() ],
            lastIdx   = pageCount - 1;

        let from  = startIdx + 1,
            to    = endIdx,
            total = this.currentBookmarks.length;

        // if last page is showing, set the end of range to total number of bookmarks
        if ( this.currentPageIdx === lastIdx && bookmarks.length < endIdx ) {
            to = this.currentBookmarks.length;
        }

        this.showingOnPage.select( '.from-count' ).text( from );
        this.showingOnPage.select( '.to-count' ).text( to );
        this.showingOnPage.select( '.total-count' ).text( total );

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
            .on( 'click', d => {
                this.currentPageIdx = d;
                this.paginateBookmarks();
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

        this.populateBookmarks( bookmarks, true );
    }

    async deleteBookmark( d ) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        let message = 'Are you sure you want to delete selected bookmark?',
            confirm = await Hoot.message.confirm( message );

        if ( !confirm ) return;

        return Hoot.api.deleteReviewBookmark( d.id )
            .then( resp => Hoot.message.alert( resp ) )
            .then( () => {
                this.currentBookmarks = _reject( this.currentBookmarks, bookmark => bookmark.id === d.id );

                this.paginateBookmarks();
            } );
    }

    openBookmarkNotes( d ) {
        let bookmarkNotes = Hoot.ui.managePanel.bookmarkNotes;

        bookmarkNotes.toggle( true );
        bookmarkNotes.load( d );
    }
}
