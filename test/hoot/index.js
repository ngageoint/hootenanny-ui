/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/29/18
 *******************************************************************************************************/

let iD        = require( '../../modules/index' ),
    Hoot      = require( '../../modules/Hoot/hoot' ).default,
    $         = require( 'jquery' ),
    _         = require( 'lodash-es' ),
    chai      = require( 'chai' ),
    sinonChai = require( 'sinon-chai' );

chai.use( sinonChai );

let id = iD.Context();

global.Hoot   = Hoot;
global.d3     = iD.d3;
global.$      = $;
global._      = _;
global.iD     = iD;
global.expect = chai.expect;

before( () => {
    localStorage.setItem( 'sawSplash', 'true' );

    d3.select( 'body' )
        .append( 'div' )
        .attr( 'id', 'id-container' )
        .append( 'div' )
        .attr( 'id', 'id-sink' );

    id.ui()( document.getElementById( 'id-sink' ), function() {
        Hoot.init( id );
    } );
} );

beforeEach( function( done ) {
    setTimeout( done, 50 );
} );

const tests = require.context( './spec/reviewBookmarkPanel/', true, /.js$/ );

tests.keys().forEach( tests );
