/** ****************************************************************************************************
 * File: reviewMode.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Entered Review Mode', () => {

it( 'Enters review mode', done => {
    d3.select('body div.hoot-confirm.overlay.confirm-overlay div div div.confirm-actions.flex.justify-end button.primary').dispatch('click');
    setTimeout(() => {
        done();
    }, 2000);
} );
it( 'Opens next available review', done => {
    d3.select('#conflicts-container > div > div.left-container.fillD > div.action-buttons > button:nth-child(5)').dispatch('click');
    setTimeout(() => {
        done();
    }, 1500);
} );

});