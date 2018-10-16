/** ****************************************************************************************************
 * File: header.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/5/18
 *******************************************************************************************************/

export function uiHeader( context ) {
    function header( selection ) {
        let nav = selection
            .append( 'nav' )
            .classed( 'contain inline fr', true );

        let manageTabBtn = nav
            .append( 'div' )
            .attr( 'id', 'manageTabBtn' )
            .attr( 'href', '#jobs' )
            .classed( 'point pad2 block keyline-left _icon dark strong small sprocket', true )
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
                d3.selectAll( '.context-menu, .tools-menu, .datasets-options-menu' ).remove();
            } );

        let logoContainer = selection
            .append( 'div' )
            .classed( 'point hoot-logo', true )
            .on( 'click', () => {
                console.log( 'clickkkk' );
            } );
    }

    return header;
}
