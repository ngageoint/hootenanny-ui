/** ****************************************************************************************************
 * File: bootstrap.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/22/18
 *******************************************************************************************************/

const puppeteer = require( 'puppeteer' );
const pti = require( 'puppeteer-to-istanbul' );
const server = require( '../../server' );
const { expect } = require( 'chai' );
const _ = require( 'lodash' );
const globalVariables = _.pick( global, [ 'browser', 'expect' ] );

// puppeteer options
const opts = {
    headless: false,
    slowMo: 100,
    timeout: 10000
};

// expose variables
before( async () => {
    server();
    global.expect = expect;
    global.browser = await puppeteer.launch( opts );
    global.page = await browser.newPage();

    await page.coverage.startJSCoverage();

    // set sawSplash to true so that the Welcome modal doesn't show every time
    await page.evaluateOnNewDocument( () => {
        localStorage.setItem( 'sawSplash', 'true' );
    } );

    await page.goto( 'http://localhost:3000' );
    await page.waitFor( '#id-container' );
} );

// close browser and reset global variables
after( async () => {
    const jsCoverage = await page.coverage.stopJSCoverage();

    pti.write( jsCoverage );

    await browser.close();

    global.browser = globalVariables.browser;
    global.expect = globalVariables.expect;
} );
