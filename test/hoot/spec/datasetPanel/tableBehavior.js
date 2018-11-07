/** ****************************************************************************************************
 * File: tableBehavior.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/5/18
 *******************************************************************************************************/

const _                          = require( 'lodash' );
const sinon                      = require( 'sinon' );
const { generateOsmLayerParams } = require( '../../helpers' );

const CONTEXT_TIMEOUT = 300;

function deselectAll() {
    let selected = d3.selectAll( 'g[data-type="dataset"] .sel' );

    if ( !selected.size() ) return;

    selected.each( function() {
        d3.select( this.parentNode ).dispatch( 'click' );
    } );
}

module.exports = () => {
    describe( 'table behavior', () => {
        let table,
            selected,
            folderId;

        before( () => {
            table = d3.select( '#dataset-table' );
        } );

        // describe( 'table refresh', () => {
        //     it( 'calls refreshAll method and re-renders dataset table', done => {
        //         let spyRefresh = sinon.spy( Hoot.folders, 'refreshAll' ),
        //             spyRender  = sinon.spy( Hoot.ui.managePanel.datasets, 'renderFolderTree' );
        //
        //         d3.select( '.dataset-action-button:nth-child(4)' ).dispatch( 'click' );
        //
        //         setTimeout( () => {
        //             expect( spyRefresh.calledOnce ).to.be.true;
        //             expect( spyRender.calledOnce ).to.be.true;
        //             spyRefresh.restore();
        //             spyRender.restore();
        //             done();
        //         }, 100 );
        //     } );
        // } );
        //
        // describe( 'item selection', () => {
        //     it( 'selects a single layer', () => {
        //         let dataset = table.select( 'g[data-type="dataset"]' ); // use select instead of selectAll to get first element
        //
        //         dataset.dispatch( 'click' );
        //
        //         let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );
        //
        //         expect( rect.classed( 'sel' ) ).to.be.true;
        //     } );
        //
        //     it( 'deselects a single layer', () => {
        //         let dataset = table.select( 'g[data-type="dataset"]' );
        //
        //         dataset.dispatch( 'click' );
        //
        //         let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );
        //
        //         expect( rect.classed( 'sel' ) ).to.be.false;
        //     } );
        //
        //     it( 'selects multiple layers while holding META key', () => {
        //         let datasets = table.selectAll( 'g[data-type="dataset"]' );
        //
        //         datasets.each( function() {
        //             let e = new MouseEvent( 'click', { metaKey: true } );
        //
        //             d3.select( this ).node().dispatchEvent( e );
        //         } );
        //
        //         selected = table.selectAll( 'g[data-type="dataset"] .sel' );
        //
        //         expect( selected.size() ).to.equal( datasets.size() );
        //     } );
        //
        //     it( 'selects single layer after selecting multiple datasets', () => {
        //         let datasets = table.selectAll( 'g[data-type="dataset"]' );
        //
        //         // use selected datsets from previous test
        //         expect( selected.size() ).to.equal( datasets.size() );
        //
        //         table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );
        //
        //         selected = table.selectAll( 'g[data-type="dataset"] .sel' );
        //
        //         expect( selected.size() ).to.equal( 1 );
        //     } );
        //
        //     it( 'selects groups of layers while holding META and SHIFT keys', () => {
        //         let datasets = table.selectAll( 'g[data-type="dataset"]' );
        //
        //         // use selected datsets from previous test
        //         expect( selected.size() ).to.equal( 1 );
        //
        //         datasets
        //             .filter( ( d, i ) => i === 3 )
        //             .each( function() {
        //                 let e = new MouseEvent( 'click', { shiftKey: true } );
        //
        //                 d3.select( this ).node().dispatchEvent( e );
        //             } );
        //
        //         selected = table.selectAll( 'g[data-type="dataset"] .sel' );
        //         expect( selected.size() ).to.equal( 4 );
        //
        //         datasets
        //             .filter( ( d, i ) => i === 5 )
        //             .each( function() {
        //                 let e = new MouseEvent( 'click', { shiftKey: true } );
        //
        //                 d3.select( this ).node().dispatchEvent( e );
        //             } );
        //
        //         selected = table.selectAll( 'g[data-type="dataset"] .sel' );
        //         expect( selected.size() ).to.equal( 6 );
        //
        //         datasets
        //             .filter( ( d, i ) => i === 7 )
        //             .each( function() {
        //                 let e = new MouseEvent( 'click', { metaKey: true } );
        //
        //                 d3.select( this ).node().dispatchEvent( e );
        //             } );
        //
        //         selected = table.selectAll( 'g[data-type="dataset"] .sel' );
        //         expect( selected.size() ).to.equal( 7 );
        //     } );
        //
        //     it( 'opens context menu for single selected layer', done => {
        //         deselectAll();
        //         let dataset = table.select( 'g[data-type="dataset"]' );
        //
        //
        //         let e = new MouseEvent( 'contextmenu' );
        //
        //         dataset.node().dispatchEvent( e );
        //
        //         let contextMenu = d3.select( '.context-menu' ),
        //             items       = contextMenu.selectAll( 'li' );
        //
        //         expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
        //         expect( items.size() ).to.equal( 7 );
        //
        //         setTimeout( () => {
        //             d3.select( 'body' ).dispatch( 'click' );
        //             done();
        //         }, CONTEXT_TIMEOUT );
        //     } );
        //
        //     it( 'opens context menu for multiple selected layers', done => {
        //         deselectAll();
        //         let dataset  = table.select( 'g[data-type="dataset"]' ),
        //             datasets = table.selectAll( 'g[data-type="dataset"]' );
        //
        //         dataset.dispatch( 'click' ); // make sure only one dataset is selected
        //
        //         datasets
        //             .filter( ( d, i ) => i === 3 )
        //             .each( function() {
        //                 let e = new MouseEvent( 'click', { shiftKey: true } );
        //
        //                 d3.select( this ).node().dispatchEvent( e );
        //             } );
        //
        //         let e = new MouseEvent( 'contextmenu' );
        //
        //         dataset.node().dispatchEvent( e );
        //
        //         let contextMenu = d3.select( '.context-menu' ),
        //             items       = contextMenu.selectAll( 'li' );
        //
        //         expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
        //         expect( items.size() ).to.equal( 3 );
        //
        //         setTimeout( () => {
        //             d3.select( 'body' ).dispatch( 'click' );
        //             done();
        //         }, CONTEXT_TIMEOUT );
        //     } );
        //
        //     it( 'opens context menu when clicking and holding CTRL key', done => {
        //         deselectAll();
        //         let dataset = table.select( 'g[data-type="dataset"]' );
        //
        //         dataset.dispatch( 'click' ); // make sure only one dataset is selected
        //
        //         let e = new MouseEvent( 'contextmenu' );
        //
        //         dataset.node().dispatchEvent( e );
        //
        //         let contextMenu = d3.select( '.context-menu' ),
        //             items       = contextMenu.selectAll( 'li' );
        //
        //         expect( table.selectAll( 'g[data-type="dataset"] .sel' ).size() ).to.equal( 1 );
        //         expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
        //         expect( items.size() ).to.equal( 7 );
        //
        //         setTimeout( () => {
        //             d3.select( 'body' ).dispatch( 'click' );
        //             done();
        //         }, CONTEXT_TIMEOUT );
        //     } );
        //
        //     it( 'opens folder with children', () => {
        //         let isChild = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 );
        //
        //         folderId = isChild[ 0 ].folderId;
        //
        //         let childrenCount = _.filter( isChild, child => child.folderId === folderId ).length,
        //             nodesCount    = table.selectAll( 'g.node' ).size();
        //
        //         let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );
        //
        //         folder.dispatch( 'click' );
        //
        //         let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
        //             newNodesCount = table.selectAll( 'g.node' ).size();
        //
        //         expect( folderIcon.classed( 'open-folder' ) ).to.be.true;
        //         expect( newNodesCount ).to.equal( nodesCount + childrenCount );
        //     } );
        //
        //     it( 'closes folder with children', () => {
        //         let isChild       = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 ),
        //             childrenCount = _.filter( isChild, child => child.folderId === folderId ).length, // use folder ID from previous test
        //             nodesCount    = table.selectAll( 'g.node' ).size();
        //
        //         let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );
        //
        //         folder.dispatch( 'click' );
        //
        //         let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
        //             newNodesCount = table.selectAll( 'g.node' ).size();
        //
        //         expect( folderIcon.classed( 'open-folder' ) ).to.be.false;
        //         expect( newNodesCount ).to.equal( nodesCount - childrenCount );
        //     } );
        //
        //     it( 'opens folder context menu', done => {
        //         let folder = table.select( 'g[data-type="folder"]' );
        //
        //         let e = new MouseEvent( 'contextmenu' );
        //
        //         folder.node().dispatchEvent( e );
        //
        //         let contextMenu = d3.select( '.context-menu' ),
        //             items       = contextMenu.selectAll( 'li' );
        //
        //         expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
        //         expect( items.size() ).to.equal( 5 );
        //
        //         setTimeout( () => {
        //             d3.select( 'body' ).dispatch( 'click' );
        //             done();
        //         }, CONTEXT_TIMEOUT );
        //     } );
        // } );

        describe( 'modify dataset', () => {
            let modifyModal;
            // before( async function() {
            //     this.timeout( 10000 );
            //
            //     let generateCount = 5,
            //         layerParams   = await generateOsmLayerParams( [ ...Array( generateCount ).keys() ] ),
            //         folderParams  = {
            //             parentId: 0,
            //             folderName: 'UnitTestFolder1'
            //         };
            //
            //     await Promise.all( _.map( layerParams, params => Hoot.api.uploadDataset( params ) ) ); // generate test layers
            //     await Hoot.api.addFolder( folderParams ); // generate test folder
            // } );

            it( 'opens modify dataset modal', () => {
                let layer = table.select( 'g[data-name="UnitTestLayer0"]' ),
                    e     = new MouseEvent( 'contextmenu' );

                layer.node().dispatchEvent( e );

                let contextMenu = d3.select( '.context-menu' );

                contextMenu.select( 'li:nth-child(4)' ).dispatch( 'click' );
                modifyModal = d3.select( '#modify-dataset-form' );

                // let

                // expect( modifyModal.size() ).to.equal( 1 );
                // expect( )
            } );
        } );
    } );
};
