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
export default function Navbar( container ) {
    this.container = container;

    /**
     * Render navbar and all of its components
     */
    this.render = () => {
        let navbar = this.createNavbar(),
            leftContainer = this.createLeftContainer( navbar );

        this.createSettingsButton( leftContainer );
        this.createLogo( leftContainer );
    };

    /**
     * Create navbar container
     */
    this.createNavbar = () => {
        return this.container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain text-white fill-dark', true );
    };

    /**
     * Create left-aligned container
     *
     * @param container - navbar container
     */
    this.createLeftContainer = container => {
        return container
            .append( 'div' )
            .classed( 'nav-item', true );
    };

    /**
     * Create a menu button in the left container
     *
     * @param container - left-aligned container
     */
    this.createSettingsButton = container => {
        let button = container.append( 'div' )
            .classed( 'pointer icon-container flex justify-between', true )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.select( '#settings-panel' ).classed( 'hidden' );

                d3.select( this )
                    .classed( 'fill-white', !vis )
                    .classed( 'text-dark', !vis );

                d3.select( '#settings-panel' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .tools-menu, .dataset-options-menu' ).remove();
            } );

        button.append( 'i' )
            .classed( 'medium material-icons', true )
            .text( 'menu' );
    };

    /**
     * Create the Hoot logo in the left container
     *
     * @param container - left-aligned container
     */
    this.createLogo = container => {
        container
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );
    };
}