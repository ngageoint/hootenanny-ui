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

    init() {
        this.$navbar = this.$container
            .insert( 'nav', ':first-child' )
            .attr( 'id', 'navbar' )
            .classed( 'contain dark fill-dark', true );

        this.$navbar
            .append( 'div' )
            .attr( 'id', 'manageTabBtn' )
            .attr( 'href', '#jobs' )
            .classed( 'pointer pad2 block keyline-left keyline-right dark float-right strong small sprocket', true )
            .text( 'Manage' )
            .on( 'click', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                let vis = !d3.selectAll( '#jobsBG' ).classed( 'hidden' ),
                    txt = vis ? 'Manage' : 'Return to Map';

                d3.select( this )
                    .classed( 'fill-light', !vis )
                    .classed( 'dark', vis )
                    .text( txt );

                d3.selectAll( '#jobsBG' )
                    .classed( 'hidden', vis );

                d3.selectAll( '.context-menu, .tools-menu, .dataset-options-menu' ).remove();
            } );

        this.$navbar
            .append( 'div' )
            .classed( 'logo-container', true )
            .append( 'img' )
            .attr( 'src', './img/hoot_logo_update.png' )
            .classed( 'pointer hoot-logo', true );

        return true;
    }
}