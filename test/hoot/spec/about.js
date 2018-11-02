/** ****************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/22/18
 *******************************************************************************************************/

describe( 'About Modal', () => {
    it( 'opens', () => {
        expect( d3.select( '#about-hootenanny' ).size() ).to.equal( 0 );

        d3.select( '#navbar .about-toggle' ).dispatch( 'click' );

        expect( d3.select( '#about-hootenanny' ).size() ).to.equal( 1 );
    } );

    it( 'closes', () => {
        expect( d3.select( '#about-hootenanny' ).size() ).to.equal( 1 );

        d3.select( '#about-hootenanny ._icon.close' ).dispatch( 'click' );

        expect( d3.select( '#about-hootenanny' ).size() ).to.equal( 0 );
    } );
} );
