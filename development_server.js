/* eslint-disable no-console */

let gaze     = require( 'gaze' ),
    ecstatic = require( 'ecstatic' ),
    colors   = require( 'colors/safe' ),
    express  = require( 'express' ),
    app      = express(),
    url      = require( 'url' ),
    proxy    = require( 'express-http-proxy' );

let isDevelopment = process.argv[ 2 ] === 'develop';

let buildData = require( './build_data' )( isDevelopment ),
    buildSrc  = require( './build_src' )( isDevelopment ),
    buildCSS  = require( './build_css' )( isDevelopment );

buildData().then( () => buildSrc() );

buildCSS();

if ( isDevelopment ) {
    gaze( [ 'css/**/*.css' ], ( err, watcher ) => {
        watcher.on( 'all', () => {
            buildCSS();
        } );
    } );

    gaze(
        [
            'data/**/*.{js,json}',
            'data/core.yaml',
            // ignore the output files of `buildData`
            '!data/presets/categories.json',
            '!data/presets/fields.json',
            '!data/presets/presets.json',
            '!data/presets.yaml',
            '!data/taginfo.json',
            '!dist/locales/en.json'
        ],
        ( err, watcher ) => {
            watcher.on( 'all', () => {
                buildData()
                    .then( () => {
                        // need to recompute js files when data changes
                        buildSrc();
                    } );
            } );
        }
    );

    gaze( [ 'modules/**/*.js' ], ( err, watcher ) => {
        watcher.on( 'all', () => {
            buildSrc();
        } );
    } );

    //gaze( [ 'css/hoot/**/*.scss' ], ( err, watcher ) => {
    //    'use strict';
    //    watcher.on( 'all', () => {
    //        buildSrc();
    //    } );
    //} );

    let port     = 8088,
        hootHost = 'localhost',
        hootPort = 8999,
        hootUrl  = 'http://' + hootHost + ':' + hootPort;

    app.use(
        ecstatic( { root: __dirname, cache: 0 } )
    ).listen( port );

    app.get( '/hootenanny-id', ( req, res ) => {
        res.writeHead( 301,
            { Location: 'http://localhost:8080' }
        );
        res.end();
    } );

    app.use( '/hoot-services', proxy( hootUrl, {
        forwardPath: req => {
            return '/hoot-services' + url.parse( req.url ).path;
        }
    } ) );

    app.use( '/static', proxy( hootUrl, {
        forwardPath: req => {
            return '/static' + url.parse( req.url ).path;
        }
    } ) );

    console.log( colors.yellow( 'Listening on ' + port ) );

}
