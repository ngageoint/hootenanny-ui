/*******************************************************************************************************
 * File: tag_select_copy.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/12/18
 *******************************************************************************************************/

import { svgIcon } from '../svg';

export function uiTagSelectCopy( context ) {
    function render( selection ) {
        let button = selection.selectAll( '.tag-select-button' )
            .data( [ 0 ] );

        button = button.enter()
            .append( 'button' )
            .attr( 'class', 'tag-select-button' )
            .call( svgIcon( '#iD-icon-apply', 'checked' ) );

        button.on( 'click', () => {
            d3.event.stopPropagation();
            d3.event.preventDefault();

            let icon = button.select( 'svg' );

            icon.classed( 'visible', !icon.classed( 'visible' ) );

            var seltags = d3.selectAll('li.tag-row').filter(function() {
                return d3.select(this).selectAll('svg.icon.checked.visible').size() === 1;
            }).data().reduce(function(m, d) {
                m[d.key] = d.value;
                return m;
            }, {});

            context.copyTags(seltags);
        } );
    }

    return render;
}