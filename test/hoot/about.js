/** ****************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/22/18
 *******************************************************************************************************/

import * as iD from '../../modules/index';
import $ from 'jquery';
import chai from 'chai';

chai.use( require( 'chai-dom' ) );

const { expect } = chai;

window.d3 = iD.d3;
window.$ = $;

let id;

describe( 'Hoot.about', () => {

    before( () => {
        d3.select( 'body' )
            .append( 'div' )
            .attr( 'id', 'id-container' )
            .append( 'div' )
            .attr( 'id', 'id-sink' );

        id = iD.Context();

        id.ui()( document.getElementById( 'id-sink' ) );
    } );

    it( 'should open the about modal', async () => {
        console.log( document.getElementById( '#about-hootenanny' ) );

        // expect( document.querySelector( '#about-hootenanny' ) ).to.be.ok;

        // expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 0 );
        //
        // await page.click( '#navbar .about-toggle' );
        //
        // expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 1 );
    } );

    it( 'should close the about modal', async () => {
        // expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 1 );
        //
        // await page.click( '#about-hootenanny ._icon.close' );
        //
        // expect( await page.$$( '#about-hootenanny' ) ).to.have.lengthOf( 0 );
    } );
} );
