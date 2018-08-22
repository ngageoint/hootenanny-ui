/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import About from './about';

/**
 * Creates the navigation bar
 *
 * @param container - body
 * @constructor
 */
export default class Navbar {
    constructor() {
        this.container = d3.select( 'body' );

        this.dropdownItems = [
            {
                title: 'About',
                onClick: () => this.openAboutModal()
            }
        ];
    }

    /**
     * Render navbar and all of its view
     */
    async render() {
        this.navbar = this.container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain text-white fill-dark', true );

        this.createLeftContainer();
        this.createRightContainer();

        return this;
    }

    createLeftContainer() {
        let leftContainer = this.navbar
            .append( 'div' )
            .classed( 'nav-item', true );

        let menuButton = leftContainer
            .append( 'div' )
            .classed( 'menu-button button text-light pointer icon-container', true )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.select( '#manage-panel' ).classed( 'hidden' );

                d3.select( this )
                    .classed( 'active', !vis );

                d3.select( '#manage-panel' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .datasets-options-menu' ).remove();
            } );

        menuButton
            .append( 'i' )
            .classed( 'medium material-icons', true )
            .text( 'menu' );

        leftContainer
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );
    }

    createRightContainer() {
        let rightContainer = this.navbar
            .append( 'div' )
            .classed( 'nav-item', true );

        let dropdownContent = rightContainer
            .append( 'ul' )
            .classed( 'dropdown-content fill-white', true )
            .selectAll( '.dropdown-item' )
            .data( this.dropdownItems );

        dropdownContent
            .enter()
            .append( 'li' )
            .classed( 'dropdown-item pad2x strong pointer', true )
            .append( 'a' )
            .attr( 'href', '#!' )
            .text( d => d.title );

        let dropdownToggle = rightContainer
            .append( 'div' )
            .classed( 'dropdown-toggle icon-container button dark flex align-center text-light pointer', true )
            .on( 'click', () => this.openAboutModal() );

        dropdownToggle
            .append( 'i' )
            .classed( 'medium material-icons', true )
            .text( 'info_outline' );

        //dropdownToggle
        //    .append( 'i' )
        //    .classed( 'medium material-icons', true )
        //    .text( 'arrow_drop_down' );

        //this.initDropdown();
    }

    //////////////////// possibly use in the future
    //initDropdown() {
    //    let that = this;
    //
    //    // bind single click listener to open dropdown
    //    $( '.dropdown-toggle' ).one( 'click', () => toggleDropdown() );
    //
    //    // toggle the dropdown
    //    function toggleDropdown( cb ) {
    //        $( '.dropdown-content' ).slideToggle( 50, () => {
    //            if ( cb ) {
    //                cb();
    //                return;
    //            }
    //
    //            if ( !$( '.dropdown-content' ).is( ':visible' ) ) return;
    //
    //            bindBodyClick();
    //        } );
    //    }
    //
    //    // bind single click listener to body after dropdown is visible to close dropdown
    //    function bindBodyClick() {
    //        $( 'body' ).one( 'click', () => toggleDropdown( () => that.initDropdown()  ) );
    //    }
    //}

    openAboutModal() {
        new About().render();
    }
}