/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import About from './about';
import { event as d3_event } from 'd3-selection';

/**
 * Creates the navigation bar
 *
 * @param container - body
 * @constructor
 */
export default class Navbar {
    constructor( isLoggedIn, login ) {
        this.container  = d3.select( 'body' );
        this.isLoggedIn = isLoggedIn;
        this.login = login;
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

        leftContainer
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );

        if ( this.isLoggedIn ) {
            this.menuButton = leftContainer
                .insert( 'div', '.logo-container' )
                .classed( 'menu-button button text-light pointer icon-container', true )
                .on( 'click', () => this.toggleManagePanel() );

            this.menuButton
                .append( 'i' )
                .classed( 'medium material-icons', true )
                .text( 'menu' );
        }
    }

    createRightContainer() {
        let rightContainer = this.navbar
            .append( 'div' )
            .classed( 'nav-item', true);

        function showDropdown(dropdownContent) {
            const isVisible = dropdownContent.classed('visible');
            dropdownContent.classed('visible', !isVisible);
        }

        if ( this.isLoggedIn ) {
            let user = JSON.parse( localStorage.getItem( 'user' ) );

            const userContainer = rightContainer
                .append( 'div' )
                .classed( 'light strong small info pad2x flex align-center text-light user-info-container', true );
            userContainer.append( 'span' )
                .text( 'Logged in as ' + user.display_name );

            if ( user.privileges ) {
                Object.keys( user.privileges ).forEach( privilege => {
                    if ( user.privileges[ privilege ] === 'true' ) {
                        userContainer.append( 'i' )
                        .classed( 'material-icons', true )
                        .text( Hoot.config.privilegeIcons[ privilege ] )
                        .attr( 'title', privilege );
                    }
                } );
            }

            let dropdownToggle = rightContainer
                .append( 'div' )
                .classed('dropdown-toggle icon-container button flex align-center text-light pointer', true)
                .on('click', () => showDropdown(dropdownContent));

            dropdownToggle
                .append( 'i' )
                .classed( 'medium material-icons', true )
                .text( 'info_outline' );

            dropdownToggle
                .append( 'i' )
                .classed( 'medium material-icons', true )
                .text( 'arrow_drop_down' );

            let dropdownContent = rightContainer
                .append( 'ul' )
                .classed( 'dropdown-content fill-white', true );

            dropdownContent
                .append( 'li' )
                .classed( 'dropdown-item pad2x strong pointer', true )
                .on( 'click', () => this.openAboutModal() )
                .append( 'a' )
                // .attr( 'href', '#!' )
                .text( 'About' );

            dropdownContent
                .append( 'li' )
                .classed( 'dropdown-item pad2x strong pointer', true )
                .on( 'click', () => {
                    Hoot.api.logout()
                        .then( () => {
                            localStorage.removeItem( 'user' );
                            localStorage.removeItem( 'bounds_history' );
                            window.location.replace( 'login.html' );
                        } );
                } )
                .append( 'a' )
                // .attr( 'href', '#!' )
                .text( 'Logout' );

            d3.select('body').on('click.navbar', () => {
                if (d3.event && d3.event.target) {
                    if (!dropdownToggle.node().contains(d3.event.target) && dropdownContent.classed('visible')) {
                        showDropdown(dropdownContent);
                    }
                }
            });
        } else {
            rightContainer
                .append( 'div' )
                .attr( 'id', 'logoutTabBtn' )
                // .attr( 'href', '#logout' )
                .classed( '_icon light strong small info pad2x flex align-center text-light pointer', true )
                .text( 'Launch Login' )
                .on( 'click', () => this.login.launchOAuthLogin() );
        }
    }

    toggleManagePanel() {
        let managePanel = Hoot.ui.managePanel,
            vis         = managePanel.isOpen === true;

        //First time opening, render tabs and make datasets panel active
        if (d3.selectAll( '.panel-body.active' ).size() === 0) {
            Hoot.ui.managePanel.renderTabs()
                .then(() =>
                    managePanel.datasets.toggle()
                );

        }

        if (Hoot.ui.managePanel.active) {
            if (vis) { //deactivate tab on hide
                Hoot.ui.managePanel.active.deactivate();
            } else { //activate tab on show
                Hoot.ui.managePanel.active.activate();
            }
        }

        this.menuButton.classed( 'active', !vis );
        managePanel.container.classed( 'hidden', vis );

        d3.selectAll( '.context-menu, .datasets-options-menu' ).remove();

        managePanel.isOpen = !managePanel.isOpen;
    }

    initDropdown() {
        let that = this;

        // bind single click listener to open dropdown
        d3.select( 'nav .dropdown-toggle' ).on( 'click', () => toggleDropdown() );

        // toggle the dropdown
        function toggleDropdown( cb ) {
            d3.select( 'nav .dropdown-content' ).slideToggle( 50, () => {
                if ( cb ) {
                    cb();
                    return;
                }

                if ( !d3.select( 'nav .dropdown-content' ).is( ':visible' ) ) return;

                bindBodyClick();
            } );
        }

        // bind single click listener to body after dropdown is visible to close dropdown
        function bindBodyClick() {
            d3.select( 'body' ).on( 'click.navbar', () => toggleDropdown( () => that.initDropdown() ) );
        }
    }

    openAboutModal() {
        new About().render();
    }
}
