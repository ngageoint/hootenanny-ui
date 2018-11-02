/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/29/18
 *******************************************************************************************************/

let iD         = require( '../../modules/index' ),
    $          = require( 'jquery' ),
    _          = require( 'lodash-es' ),
    { expect } = require( 'chai' );

let id = iD.Context();

global.Hoot   = id.hoot;
global.d3     = iD.d3;
global.$      = $;
global._      = _;
global.iD     = iD;
global.expect = expect;

before( () => {
    localStorage.setItem( 'sawSplash', 'true' );

    d3.select( 'body' )
        .append( 'div' )
        .attr( 'id', 'id-container' )
        .append( 'div' )
        .attr( 'id', 'id-sink' );

    id.ui()( document.getElementById( 'id-sink' ) );
} );

beforeEach( function( done ) {
    setTimeout( done, 2000 );
} );

const tests = require.context( './spec/', true, /.js$/ );

tests.keys().forEach( tests );
