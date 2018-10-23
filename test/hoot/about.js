/** ****************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/22/18
 *******************************************************************************************************/

describe( 'Hoot.about', () => {
    it( 'should open the about modal', async () => {
        expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 0 );

        await page.click( '#navbar .about-toggle' );

        expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 1 );
    } );

    it ( 'should close the about modal', async () => {
        expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 1 );

        await page.click( '#about-hootenanny ._icon.close' );

        expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 0 );
    } );
} );
