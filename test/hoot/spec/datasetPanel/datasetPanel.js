/** ****************************************************************************************************
 * File: datasetPanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/1/18
 *******************************************************************************************************/

describe( 'dataset panel', () => {
    before( () => {
        d3.select( '#navbar .menu-button' ).dispatch( 'click' );
    } );

    require( './importSingle' )();
    require( './importMulti' )();
    require( './addFolder' )();
    require( './tableBehavior' )();
} );
