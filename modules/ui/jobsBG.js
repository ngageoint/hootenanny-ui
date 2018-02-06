/** ****************************************************************************************************
 * File: jobsBG
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

export function uiBG( context ) {
	function jobsBG( selection ) {
		let bg = d3.select( 'body' )
			.append( 'div' )
			.attr( 'id', 'jobsBG' )
			.classed( 'col12 pin-bottom pin-top hidden', true )
			.style( {
				position: 'absolute',
				top: '60px',
				'z-index': 999
			} )
	}
}