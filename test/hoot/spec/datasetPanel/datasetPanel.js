/** ****************************************************************************************************
 * File: datasetPanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/1/18
 *******************************************************************************************************/

describe( 'dataset panel', () => {
    before( () => {
        let menuButton = d3.select( '#navbar .menu-button' );

        if ( !menuButton.classed( 'active' ) ) {
            d3.select( '#navbar .menu-button' ).dispatch( 'click' );
        }

        d3.select( '[data-id="#manage-datasets"]' ).dispatch( 'click' );
    } );

    // after( async () => {
    //     console.log( 'cleaning data...' );
    //
    //     let layerNames = [],
    //         folderIds  = [];
    //
    //     d3.selectAll( '#dataset-table g.node' )
    //         .filter( d => d.data && d.data.name.startsWith( 'UnitTest' ) )
    //         .each( d => {
    //             if ( d.data.type === 'dataset' ) {
    //                 layerNames.push( d.data.name );
    //             } else {
    //                 folderIds.push( d.data.id );
    //             }
    //         } );
    //
    //     let deleteLayers  = Promise.all( _.map( layerNames, name => Hoot.api.deleteLayer( name ) ) ),
    //         deleteFolders = Promise.all( _.map( folderIds, id => Hoot.api.deleteFolder( id ) ) );
    //
    //     await Promise.all( [ deleteLayers, deleteFolders ] );
    //
    //     console.log( 'data cleaned!' );
    // } );

    require( './importSingle' )();
    require( './importMulti' )();
    require( './addFolder' )();
    require( './tableBehavior' )();
} );
