/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/29/18
 *******************************************************************************************************/

let iD        = require( '../../modules/index' ),
    Hoot      = require( '../../modules/Hoot/hoot' ).default,
    _         = require( 'lodash-es' ),
    chai      = require( 'chai' );

let id = iD.coreContext();

global.Hoot   = Hoot;
global.d3     = iD.d3;
global._      = _;
global.iD     = iD;
global.expect = chai.expect;

before( async () => {
    localStorage.setItem( 'sawSplash', 'true' );
    localStorage.setItem( 'user', '{"email":"karma@test.com","id":-1541432234,"display_name":"Karma","privileges":{"advanced":"true"},"provider_created_at":1510002712000,"last_authorized":1542647276773,"created_at":1542647276766}' );

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

const tests = require.context( './spec/', true, /.js$/ );
//        'test/spec/*/!(localized|wikipedia).js'

tests.keys().forEach( tests );
