/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/18/18
 *******************************************************************************************************/

import { expect } from 'chai';
import server     from '../../server';

describe( 'hoot.managePanel', () => {
    let server;

    before( ( client, done ) => {
        server = require('../../server')(done);
        client
            .url( 'http://localhost:3000' )
            .pause( 5000 );
    } );

    after( ( client, done ) => {
        server.close();
        client.end( () => done() );
    } );

    afterEach( ( client, done ) => {
        done();
    } );

    it( 'should load the login page', client => {
        client.expect.element( '#navbar' ).to.be.present;
    } );
} );


// const filePath = 'some/path/to.json';

// afterEach: (client, done) => {
//     const { currentTest } = client;
//     let results;
//
//     try {
//         results = require(filePath);
//     } catch (e) {
//         results = {};
//     }
//
//     const data = {
//         name: currentTest.module,
//         success: currentTest.results.errors === 0 && currentTest.results.failed === 0,
//         errors: Object.entries(currentTest.results.testcases).reduce((errors, [testcaseName, testcase]) => {
//             if (testcase.errors !== 0 || testcase.failed !== 0) {
//                 errors.push({
//                     testcase: testcaseName,
//                     assertions: testcase.assertions
//                 });
//             }
//
//             return errors;
//         }, [])
//     };
//
//     results[data.name] = data;
//
//     try {
//         fs.writeFileSync(filePath, JSON.stringify(results), "utf8");
//     } catch (e) {
//         console.log(`An error occured while saving ${filePath}:`);
//         console.log(e);
//     }
//
//     done()
// };
