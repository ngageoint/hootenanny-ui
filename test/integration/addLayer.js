/*******************************************************************************************************
 * File: addLayer.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/29/18
 *******************************************************************************************************/

let { expect } = require( 'chai' );

describe( 'Adding a layer', () => {
    
    after( ( client, done ) => {
        client.end( () => done() );
    } );

    afterEach( ( client, done ) => {
        done();
    } );

    it( 'should load the sidebar', client => {
        client
            .url( 'http://d1x11dgx2ymfgq.cloudfront.net' )
            .pause( 5000 )
            .waitForElementVisible( 'body', 30000 )
            .waitForElementVisible( 'button.start-editing', 3000 )
            .click( 'button.start-editing' )
            .waitForElementVisible( '#sidebar', 3000 )
            .expect.element( '#primary' ).to.have.css( 'display' ).which.equals( 'block' );
    } );

    it( 'should expand the "Add Reference" form', client => {
        client
            .pause( 3000 )
            .click( '#primary .toggle-button' )
            .pause( 1500 )
            .expect.element( '#primary .inner-wrapper' ).to.have.attribute( 'class' ).which.contains( 'visible' );

    } );

    it( 'should select a layer from the table', client => {
        client
            .click( '#add-ref-table g[data-name="UndividedHighway"]' )
            .pause( 1000 )
            .expect.element( '#add-ref-table g[data-name="UndividedHighway"] rect' ).to.have.attribute( 'class' ).which.contains( 'sel' )
    } );

    it( 'should add a layer to the map', client => {
        client
            .waitForElementVisible( '#primary .action-container button', 3000 )
            .click( '#primary .action-container button' )
            .pause( 5000 )
            .waitForElementVisible( '#primary .controller .thumbnail', 3000 )
            .waitForElementVisible( '#primary .controller .context-menu-layer', 3000 );

        client.expect.element( '#primary .controller div.thumbnail' ).to.have.attribute( 'class' ).which.contains( 'data' );
        client.expect.element( '#primary .controller .context-menu-layer' ).text.to.equal( 'UndividedHighway' );
    } );
} );