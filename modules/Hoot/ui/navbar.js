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
    constructor( isLoggedIn, login ) {
        this.container  = d3.select( 'body' );
        this.isLoggedIn = isLoggedIn;
        this.login      = login;
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
            .classed( 'nav-item', true );

        if ( this.isLoggedIn ) {
            let user = JSON.parse( localStorage.getItem( 'user' ) );

            let dropdownToggle = rightContainer
                .append( 'div' )
                .classed( 'dropdown-toggle icon-container button flex align-center text-light pointer', true );

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
                .classed( 'dropdown-item pad2x strong', true )
                .append( 'span' )
                .text( 'Logged in as ' + user.display_name );

            dropdownContent
                .append( 'li' )
                .classed( 'dropdown-item pad2x strong pointer', true )
                .on( 'click', () => this.openAboutModal() )
                .append( 'a' )
                .attr( 'href', '#!' )
                .text( 'About' );

            dropdownContent
                .append( 'li' )
                .classed( 'dropdown-item pad2x strong pointer', true )
                .on( 'click', () => {
                    Hoot.api.logout()
                        .then( () => {
                            localStorage.removeItem( 'user' );
                            // window.location.replace( 'login.html' );
                        } );
                } )
                .append( 'a' )
                .attr( 'href', '#!' )
                .text( 'Logout' );

            this.initDropdown();
        } else {
            rightContainer
                .append( 'div' )
                .attr( 'id', 'logoutTabBtn' )
                .attr( 'href', '#logout' )
                .classed( '_icon light strong small info pad2x flex align-center text-light pointer', true )
                .text( 'Launch Login' )
                .on( 'click', () => this.login.launchOAuthLogin() );
        }
    }

    toggleManagePanel() {
        let managePanel = Hoot.ui.managePanel,
            vis         = managePanel.isOpen === true;

        this.menuButton.classed( 'active', !vis );
        managePanel.container.classed( 'hidden', vis );

        d3.selectAll( '.context-menu, .datasets-options-menu' ).remove();

        managePanel.isOpen = !managePanel.isOpen;
    }

    //////////////////// possibly use in the future
    initDropdown() {
        let that = this;

        // bind single click listener to open dropdown
        $( 'nav .dropdown-toggle' ).one( 'click', () => toggleDropdown() );

        // toggle the dropdown
        function toggleDropdown( cb ) {
            $( 'nav .dropdown-content' ).slideToggle( 50, () => {
                if ( cb ) {
                    cb();
                    return;
                }

                if ( !$( 'nav .dropdown-content' ).is( ':visible' ) ) return;

                bindBodyClick();
            } );
        }

        // bind single click listener to body after dropdown is visible to close dropdown
        function bindBodyClick() {
            $( 'body' ).one( 'click', () => toggleDropdown( () => that.initDropdown() ) );
        }
    }

    openAboutModal() {
        new About().render();
    }
}
