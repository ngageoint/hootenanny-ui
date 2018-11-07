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

        describe( 'table refresh', () => {
            it( 'calls refreshAll method and re-renders dataset table', done => {
                let spyRefresh = sinon.spy( Hoot.folders, 'refreshAll' ),
                    spyRender  = sinon.spy( Hoot.ui.managePanel.datasets, 'renderFolderTree' );

                d3.select( '.dataset-action-button:nth-child(4)' ).dispatch( 'click' );

                setTimeout( () => {
                    expect( spyRefresh.calledOnce ).to.be.true;
                    expect( spyRender.calledOnce ).to.be.true;
                    spyRefresh.restore();
                    spyRender.restore();
                    done();
                }, 100 );
            } );
        } );

        describe( 'item selection', () => {
            it( 'selects a single layer', () => {
                let dataset = table.select( 'g[data-type="dataset"]' ); // use select instead of selectAll to get first element

                dataset.dispatch( 'click' );

                let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );

                expect( rect.classed( 'sel' ) ).to.be.true;
            } );

            it( 'deselects a single layer', () => {
                let dataset = table.select( 'g[data-type="dataset"]' );

                dataset.dispatch( 'click' );

                let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );

                expect( rect.classed( 'sel' ) ).to.be.false;
            } );

            it( 'selects multiple layers while holding META key', () => {
                let datasets = table.selectAll( 'g[data-type="dataset"]' );

                datasets.each( function() {
                    let e = new MouseEvent( 'click', { metaKey: true } );

                    d3.select( this ).node().dispatchEvent( e );
                } );

                selected = table.selectAll( 'g[data-type="dataset"] .sel' );

                expect( selected.size() ).to.equal( datasets.size() );
            } );

            it( 'selects single layer after selecting multiple datasets', () => {
                let datasets = table.selectAll( 'g[data-type="dataset"]' );

                // use selected datsets from previous test
                expect( selected.size() ).to.equal( datasets.size() );

                table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );

                selected = table.selectAll( 'g[data-type="dataset"] .sel' );

                expect( selected.size() ).to.equal( 1 );
            } );

            it( 'selects groups of layers while holding META and SHIFT keys', () => {
                let datasets = table.selectAll( 'g[data-type="dataset"]' );

                // use selected datsets from previous test
                expect( selected.size() ).to.equal( 1 );

                datasets
                    .filter( ( d, i ) => i === 3 )
                    .each( function() {
                        let e = new MouseEvent( 'click', { shiftKey: true } );

                        d3.select( this ).node().dispatchEvent( e );
                    } );

                selected = table.selectAll( 'g[data-type="dataset"] .sel' );
                expect( selected.size() ).to.equal( 4 );

                datasets
                    .filter( ( d, i ) => i === 5 )
                    .each( function() {
                        let e = new MouseEvent( 'click', { shiftKey: true } );

                        d3.select( this ).node().dispatchEvent( e );
                    } );

                selected = table.selectAll( 'g[data-type="dataset"] .sel' );
                expect( selected.size() ).to.equal( 6 );

                datasets
                    .filter( ( d, i ) => i === 7 )
                    .each( function() {
                        let e = new MouseEvent( 'click', { metaKey: true } );

                        d3.select( this ).node().dispatchEvent( e );
                    } );

                selected = table.selectAll( 'g[data-type="dataset"] .sel' );
                expect( selected.size() ).to.equal( 7 );
            } );

            it( 'opens context menu for single selected layer', done => {
                deselectAll();
                let dataset = table.select( 'g[data-type="dataset"]' );


                let e = new MouseEvent( 'contextmenu' );

                dataset.node().dispatchEvent( e );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 7 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );

            it( 'opens context menu for multiple selected layers', done => {
                deselectAll();
                let dataset  = table.select( 'g[data-type="dataset"]' ),
                    datasets = table.selectAll( 'g[data-type="dataset"]' );

                dataset.dispatch( 'click' ); // make sure only one dataset is selected

                datasets
                    .filter( ( d, i ) => i === 3 )
                    .each( function() {
                        let e = new MouseEvent( 'click', { shiftKey: true } );

                        d3.select( this ).node().dispatchEvent( e );
                    } );

                let e = new MouseEvent( 'contextmenu' );

                dataset.node().dispatchEvent( e );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 3 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );

            it( 'opens context menu when clicking and holding CTRL key', done => {
                deselectAll();
                let dataset = table.select( 'g[data-type="dataset"]' );

                dataset.dispatch( 'click' ); // make sure only one dataset is selected

                let e = new MouseEvent( 'contextmenu' );

                dataset.node().dispatchEvent( e );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( table.selectAll( 'g[data-type="dataset"] .sel' ).size() ).to.equal( 1 );
                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 7 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );

            it( 'opens folder with children', () => {
                let isChild = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 );

                folderId = isChild[ 0 ].folderId;

                let childrenCount = _.filter( isChild, child => child.folderId === folderId ).length,
                    nodesCount    = table.selectAll( 'g.node' ).size();

                let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );

                folder.dispatch( 'click' );

                let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
                    newNodesCount = table.selectAll( 'g.node' ).size();

                expect( folderIcon.classed( 'open-folder' ) ).to.be.true;
                expect( newNodesCount ).to.equal( nodesCount + childrenCount );
            } );

            it( 'closes folder with children', () => {
                let isChild       = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 ),
                    childrenCount = _.filter( isChild, child => child.folderId === folderId ).length, // use folder ID from previous test
                    nodesCount    = table.selectAll( 'g.node' ).size();

                let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );

                folder.dispatch( 'click' );

                let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
                    newNodesCount = table.selectAll( 'g.node' ).size();

                expect( folderIcon.classed( 'open-folder' ) ).to.be.false;
                expect( newNodesCount ).to.equal( nodesCount - childrenCount );
            } );

            it( 'opens folder context menu', done => {
                let folder = table.select( 'g[data-type="folder"]' );

                let e = new MouseEvent( 'contextmenu' );

                folder.node().dispatchEvent( e );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 5 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );
        } );

        describe( 'item modify/rename', () => {
            let datasetsPanel,
                modifyModal;

            before( async function() {
                this.timeout( 10000 );

                datasetsPanel = Hoot.ui.managePanel.datasets;

                let generateCount = 5,
                    layerParams   = await generateOsmLayerParams( [ ...Array( generateCount ).keys() ] ),
                    folderParams  = {
                        parentId: 0,
                        folderName: 'UnitTestFolder1'
                    };

                await Promise.all( _.map( layerParams, params => Hoot.api.uploadDataset( params ) ) ); // generate test layer
                await Hoot.api.addFolder( folderParams ); // generate test folder
                await Hoot.folders.refreshAll();
                await Hoot.events.emit( 'render-dataset-table' );

                // await setTimeout( () => {}, 200 ); // delay to make sure table has finished refreshing
            } );

            it( 'opens modify modal for single layer', () => {
                let layer = table.select( 'g[data-name="UnitTestLayer0"]' ),
                    e     = new MouseEvent( 'contextmenu' );

                layer.node().dispatchEvent( e );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(4)' )
                    .dispatch( 'click' );

                d3.select( 'body' )
                    .dispatch( 'click' );

                modifyModal = datasetsPanel.modifyLayerModal;

                let form           = d3.select( '#modify-dataset-form' ),
                    layerNameInput = modifyModal.layerNameInput,
                    pathNameInput  = modifyModal.pathNameInput;

                expect( form.size() ).to.equal( 1 );
                expect( form.select( '.modal-header h3' ).text() ).to.equal( 'Modify Dataset' );
                expect( form.selectAll( '.hoot-form-field' ).size() ).to.equal( 3 );
                expect( layerNameInput.property( 'value' ) ).to.equal( 'UnitTestLayer0' );
                expect( pathNameInput.property( 'value' ) ).to.equal( 'root' );
            } );

            it( 'validates form fields', () => {
                let layerNameInput     = modifyModal.layerNameInput,
                    newFolderNameInput = modifyModal.newFolderNameInput,
                    submitButton       = modifyModal.submitButton;

                layerNameInput
                    .property( 'value', '' )
                    .dispatch( 'keyup' );

                expect( layerNameInput.classed( 'invalid' ) ).to.be.true;
                expect( newFolderNameInput.classed( 'invalid' ) ).to.be.false;
                expect( submitButton.property( 'disabled' ) ).to.be.true;

                layerNameInput
                    .property( 'value', '!' )
                    .dispatch( 'keyup' );

                expect( layerNameInput.classed( 'invalid' ) ).to.be.true;
                expect( submitButton.property( 'disabled' ) ).to.be.true;

                layerNameInput
                    .property( 'value', '' )
                    .dispatch( 'keyup' );

                newFolderNameInput
                    .property( 'value', '!' )
                    .dispatch( 'keyup' );

                expect( layerNameInput.classed( 'invalid' ) ).to.be.true;
                expect( newFolderNameInput.classed( 'invalid' ) ).to.be.true;
                expect( submitButton.property( 'disabled' ) ).to.be.true;

                layerNameInput
                    .property( 'value', 'UnitTestLayer0' )
                    .dispatch( 'keyup' );

                newFolderNameInput
                    .property( 'value', '' )
                    .dispatch( 'keyup' );

                expect( layerNameInput.classed( 'invalid' ) ).to.be.false;
                expect( newFolderNameInput.classed( 'invalid' ) ).to.be.false;
                expect( submitButton.property( 'disabled' ) ).to.be.false;
            } );

            it( 'moves a layer to a different folder', async () => {
                let pathNameInput = modifyModal.pathNameInput,
                    submitButton  = modifyModal.submitButton;

                pathNameInput
                    .property( 'value', 'UnitTestFolder' )
                    .dispatch( 'change' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

                let folderId   = _.get( Hoot.layers.findBy( 'name', 'UnitTestLayer0' ), 'folderId' ),
                    folderName = _.get( Hoot.folders.findBy( 'id', folderId ), 'name' );

                expect( d3.select( '#modify-dataset-form' ).size() ).to.equal( 0 );
                expect( datasetsPanel.modifyLayerModal ).to.be.undefined;
                expect( folderName ).to.equal( 'UnitTestFolder' );
            } );

            it( 'opens modify modal for multiple layers', () => {
                let startLayer = table.select( 'g[data-name="UnitTestLayer1"]' ),
                    endLayer   = table.select( 'g[data-name="UnitTestLayer4"]' );

                startLayer.dispatch( 'click' );
                endLayer.node().dispatchEvent( new MouseEvent( 'click', { shiftKey: true } ) );
                endLayer.node().dispatchEvent( new MouseEvent( 'contextmenu' ) );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(2)' )
                    .dispatch( 'click' );

                d3.select( 'body' )
                    .dispatch( 'click' );

                modifyModal = datasetsPanel.modifyLayerModal;

                let form = d3.select( '#modify-dataset-form' );

                expect( form.size() ).to.equal( 1 );
                expect( form.select( '.modal-header h3' ).text() ).to.equal( 'Move Datasets' );
                expect( form.selectAll( '.hoot-form-field' ).size() ).to.equal( 2 );
            } );

            it( 'moves multiple layers to a different folder', async () => {
                let pathNameInput = modifyModal.pathNameInput,
                    submitButton  = modifyModal.submitButton,
                    layerNames = [
                        'UnitTestLayer1',
                        'UnitTestLayer2',
                        'UnitTestLayer3',
                        'UnitTestLayer4',
                    ];

                pathNameInput
                    .property( 'value', 'UnitTestFolder' )
                    .dispatch( 'change' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

                expect( d3.select( '#modify-dataset-form' ).size() ).to.equal( 0 );
                expect( datasetsPanel.modifyLayerModal ).to.be.undefined;

                await Promise.all( _.map( layerNames, name => {
                    let folderId   = _.get( Hoot.layers.findBy( 'name', name ), 'folderId' ),
                        folderName = _.get( Hoot.folders.findBy( 'id', folderId ), 'name' );

                    expect( folderName ).to.equal( 'UnitTestFolder' );
                } ) );
            } );

            it( 'opens modify folder modal', () => {
                table.select( 'g[data-name="UnitTestFolder1"]' ).node().dispatchEvent( new MouseEvent( 'contextmenu' ) );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(2)' )
                    .dispatch( 'click' );

                d3.select( 'body' )
                    .dispatch( 'click' );

                modifyModal = datasetsPanel.modifyFolderModal;

                let form            = d3.select( '#modify-folder-form' ),
                    folderNameInput = modifyModal.folderNameInput,
                    pathNameInput   = modifyModal.pathNameInput;

                expect( form.size() ).to.equal( 1 );
                expect( form.select( '.modal-header h3' ).text() ).to.equal( 'Modify Folder' );
                expect( form.selectAll( '.hoot-form-field' ).size() ).to.equal( 2 );
                expect( folderNameInput.property( 'value' ) ).to.equal( 'UnitTestFolder1' );
                expect( pathNameInput.property( 'value' ) ).to.equal( 'root' );
            } );

            it( 'validates form field', () => {
                let folderNameInput = modifyModal.folderNameInput,
                    submitButton    = modifyModal.submitButton;

                folderNameInput
                    .property( 'value', '' )
                    .dispatch( 'keyup' );

                expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
                expect( submitButton.property( 'disabled' ) ).to.be.true;

                folderNameInput
                    .property( 'value', '!' )
                    .dispatch( 'keyup' );

                expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
                expect( submitButton.property( 'disabled' ) ).to.be.true;

                folderNameInput
                    .property( 'value', 'UnitTestFolder1' )
                    .dispatch( 'keyup' );

                expect( folderNameInput.classed( 'invalid' ) ).to.be.false;
                expect( submitButton.property( 'disabled' ) ).to.be.false;
            } );

            it( 'moves a folder to a different folder', async () => {
                let pathNameInput = modifyModal.pathNameInput,
                    submitButton  = modifyModal.submitButton;

                pathNameInput
                    .property( 'value', 'UnitTestFolder' )
                    .dispatch( 'change' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

                let parentId   = Hoot.folders.findBy( 'name', 'UnitTestFolder1' ).parentId, // of child folder
                    parentName = Hoot.folders.findBy( 'id', parentId ).name; // of parent folder

                expect( d3.select( '#modify-folder-form' ).size() ).to.equal( 0 );
                expect( datasetsPanel.modifyFolderModal ).to.be.undefined;
                expect( parentName ).to.equal( 'UnitTestFolder' );
            } );
        } );
    } );
};
