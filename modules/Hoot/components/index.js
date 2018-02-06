/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

import Header from './header';
import JobsBackground from './JobsBackground';

//export default [
//	new Header()
//]

export function components ( context ) {
	return [
		new Header( context ),
		new JobsBackground( context )
	]
}