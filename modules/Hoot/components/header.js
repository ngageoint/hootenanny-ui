/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

export default class Header {
	constructor( context ) {
		this.context = context;
        this.$container = context.container();
	}

	init() {
		this.$navbar = this.$container
			.insert( 'div', ':first-child' )
			.attr( 'id', 'header' )
			.classed( 'contain pad2x dark fill-dark', true );

		this.$manageTabBtn = this.$navbar
			.append( 'nav' )
			.classed( 'contain inline fr', true )
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
					.classed( 'dark', vis)
					.text( txt );

				d3.selectAll( '#jobsBG' )
					.classed( 'hidden', vis );

				d3.selectAll('.context-menu, .tools-menu, .dataset-options-menu').remove();
			} );

		this.$hootLogo = this.$navbar
			.append( 'div' )
			.append( 'div' )
			.classed( 'point hoot-logo', true );

		return true;
	}
}