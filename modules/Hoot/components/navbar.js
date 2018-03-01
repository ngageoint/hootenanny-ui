/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

export default class Header {
    constructor( context ) {
        this.context    = context;
        this.$container = context.container();
    }

    render() {
        let navbar = this.$container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain text-white fill-dark', true );

        let leftContainer = navbar
            .append( 'div' )
            .classed( 'nav-left', true );

        // icon container
        leftContainer
            .append( 'div' )
            .classed( 'vertical-align icon-container', true )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.selectAll( '#jobsBG' ).classed( 'hidden' );

                d3.select( this )
                    .classed( 'fill-white', !vis )
                    .classed( 'text-dark', !vis );

                d3.select( '#jobsBG' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .tools-menu, .dataset-options-menu' ).remove();
            } )
            .append( 'i' )
            .classed( 'pointer medium material-icons', true )
            .text( 'settings' );

        // logo container
        leftContainer
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );
    }

    init() {
        this.render();
    }
}