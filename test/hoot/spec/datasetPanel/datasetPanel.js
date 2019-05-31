/** ****************************************************************************************************
 * File: datasetPanel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/1/18
 *******************************************************************************************************/

const { generateOsmLayerParams } = require( '../../helpers' );

describe( 'dataset panel', () => {
    before( async () => {

        let generateCount = 4,
            layerParams   = await generateOsmLayerParams( [ ...Array( generateCount ).keys() ] );

        const ingest1 = Hoot.api.uploadDataset( layerParams[ 0 ] );
        const ingest2 = Hoot.api.uploadDataset( layerParams[ 1 ] );
        const ingest3 = Hoot.api.uploadDataset( layerParams[ 2 ] );
        const ingest4 = Hoot.api.uploadDataset( layerParams[ 3 ] );

        await Promise.all( [ ingest1, ingest2, ingest3, ingest4 ] )
                    .then( () => Hoot.layers.refreshLayers() )
                    .then( () => Hoot.events.emit( 'render-dataset-table' ) );

        let menuButton = d3.select( '#navbar .menu-button' );

        if ( !menuButton.classed( 'active' ) ) {
            d3.select( '#navbar .menu-button' ).dispatch( 'click' );
        }

        d3.select( '[data-id="#manage-datasets"]' ).dispatch( 'click' );

    } );

    after( async () => {
        console.log( 'cleaning data...' );

        let layers = await Hoot.api.getLayers();
        let layerIds = layers.filter( d => d.name.startsWith( 'UnitTest' ) )
            .map( d => {console.log(d.name); return d.id } );
        let folders = await Hoot.api.getFolders();
        let folderIds = folders.folders.filter( d => d.name.startsWith( 'UnitTest' ) )
            .map( d => d.id );

        let deleteLayers  = Promise.all( _.map( layerIds, id => Hoot.api.deleteLayer( id ) ) ),
            deleteFolders = Promise.all( _.map( folderIds, id => Hoot.api.deleteFolder( id ) ) );

        await Promise.all( [ deleteLayers, deleteFolders ] );

        console.log( 'data cleaned!' );
    } );

    require( './importSingle' )();
    require( './importMulti' )();
    require( './addFolder' )();
    require( './tableBehavior' )();
} );
