/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

/**
 * Creates the navigation bar
 *
 * @param container - body
 * @constructor
 */
export default class Navbar {
    constructor( container ) {
        this.container = container;
    }

    /**
     * Render navbar and all of its view
     */
    async render() {
        let navbar        = this.createNavbar(),
            leftContainer = this.createLeftContainer( navbar );

        this.createSettingsButton( leftContainer );
        this.createLogo( leftContainer );
    }

    /**
     * Create navbar container
     *
     * @returns {d3} - navbar container
     */
    createNavbar() {
        return this.container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain text-white fill-dark', true );
    }

    /**
     * Create left-aligned container
     *
     * @param navbar - navbar container
     * @returns {d3} - left container
     */
    createLeftContainer( navbar ) {
        return navbar
            .append( 'div' )
            .classed( 'nav-item', true );
    }

    /**
     * Create a menu button in the left container
     *
     * @param leftContainer - left-aligned container
     */
    createSettingsButton( leftContainer ) {
        let button = leftContainer.append( 'div' )
            .classed( 'button dark text-light pointer icon-container flex justify-between', true )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.select( '#settings-panel' ).classed( 'hidden' );

                d3.select( this )
                    .classed( 'light', !vis )
                    .classed( 'dark', vis );

                d3.select( '#settings-panel' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .tools-menu, .dataset-options-menu' ).remove();
            } );

        button.append( 'i' )
            .classed( 'medium material-icons', true )
            .text( 'menu' );
    }

    /**
     * Create the Hoot logo in the left container
     *
     * @param leftContainer - left-aligned container
     */
    createLogo( leftContainer ) {
        leftContainer
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );
    }
}