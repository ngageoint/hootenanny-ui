/** ****************************************************************************************************
 * File: webpack.config.babel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

export default function( env ) {
    let buildData = require( './build_data' )( env );

    process.env.NODE_ENV   = env.NODE_ENV;
    process.env.BUILD_INFO = env.BUILD_INFO || 'unknown';

    return buildData()
        .then( () => require( `./webpack-config/webpack.${ env.NODE_ENV }.config.js` ) );
}
