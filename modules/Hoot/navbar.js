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
        // create navbar container
        let navbar = this.container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain text-white fill-dark', true );

        // Create left-aligned container
        let leftContainer = navbar
            .append( 'div' )
            .classed( 'nav-item', true );

        // create menu button in the left container for toggling manage panel
        let menuButton = leftContainer
            .append( 'div' )
            .classed( 'button dark text-light pointer icon-container flex justify-between', true )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.select( '#manage-panel' ).classed( 'hidden' );

                d3.select( this )
                    .classed( 'light', !vis )
                    .classed( 'dark', vis );

                d3.select( '#manage-panel' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .tools-menu, .dataset-options-menu' ).remove();
            } );

        menuButton.append( 'i' )
            .classed( 'medium material-icons', true )
            .text( 'menu' );

        leftContainer
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );

        return this;
    }
}