/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/29/18
 *******************************************************************************************************/

const tests = require.context( './hoot/', true, /.js$/ );

tests.keys().forEach(tests);

const components = require.context( '../modules/', true, /index\.js$/ );

// console.log( components.keys() );

components.keys().forEach(components);
