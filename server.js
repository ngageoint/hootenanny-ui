/** ****************************************************************************************************
 * File: server.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/18/18
 *******************************************************************************************************/

function makeServer() {
    var express = require( 'express' );
    var path = require( 'path' );
    var app = express();

    app.use( express.static('dist'));

    app.get( '/', function( req, res ) {
        res.status( 200 ).sendFile( 'dist/index.html', { root: path.resolve() } );
    } );

    var server = app.listen( 3000 );

    return server;
}

module.exports = makeServer;
