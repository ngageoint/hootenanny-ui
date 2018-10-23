/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/22/18
 *******************************************************************************************************/

describe( 'Hoot.navbar', () => {

    // before( async () => {
    //     await page.goto( 'http://localhost:3000' );
    //     await page.waitFor( '#id-container' );
    // } );

    it( 'should exist', async () => {
        expect( await page.$$( '#navbar' ) ).to.have.lengthOf( 1 );
    } );

    it( 'should contain all elements', async () => {
        const navbar = await page.$( '#navbar' );

        expect( await navbar.$$( '#navbar .menu-button' ) ).to.have.lengthOf( 1 );
        expect( await navbar.$$( '#navbar .logo-container' ) ).to.have.lengthOf( 1 );
        expect( await navbar.$$( '#navbar .about-toggle' ) ).to.have.lengthOf( 1 );
    } );
} );
