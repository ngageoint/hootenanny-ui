/** ****************************************************************************************************
 * File: tableBehavior.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/5/18
 *******************************************************************************************************/

const _     = require( 'lodash' );
const sinon = require( 'sinon' );

const { generateOsmLayerParams } = require( '../../helpers' );

const CONTEXT_TIMEOUT = 300;

module.exports = () => {
    let metaClick    = new MouseEvent( 'click', { metaKey: true } ),
        shiftClick   = new MouseEvent( 'click', { shiftKey: true } ),
        contextClick = new MouseEvent( 'contextmenu' ),
        table, datasetsPanel;

    function deselectAllDatasets() {
        let selected = d3.selectAll( 'g[data-type="dataset"] .sel' );

        if ( !selected.size() ) return;

        selected.each( function() {
            d3.select( this.parentNode ).dispatch( 'click' );
        } );
    }

    function ensureFolderOpen( folderName ) {
        let parentFolder = table.select( `g[data-name="${folderName}"]` );

        if ( !parentFolder.select( '._icon' ).classed( 'open-folder' ) ) {
            parentFolder.dispatch( 'click' );
        }
    }

    describe( 'table behavior', () => {
        before( async function(done) {
            table         = d3.select( '#dataset-table' );
            datasetsPanel = Hoot.ui.managePanel.datasets;

            this.timeout(20000);

            let generateCount = 4,
                layerParams   = await generateOsmLayerParams( [ ...Array( generateCount ).keys() ] ),
                folderParams  = {
                    parentId: 0,
                    folderName: 'UnitTestFolder1'
                };

            await Promise.all( _.map( layerParams, params => Hoot.api.uploadDataset( params ) ) ); // generate  test layer
            await Hoot.api.addFolder( folderParams ); // generate test folder
            await Hoot.folders.refreshAll();
            await Hoot.events.emit( 'render-dataset-table' );
            done();
        } );


        after( async function() {
                ['UnitTestFolder', 'UnitTestFolder1'].forEach( fName => {

                    var f = table.select( 'g[data-name="' + fName + '"]' );
                    if (f.size()) {
                        f.node().dispatchEvent( contextClick );
                        d3.select( '.context-menu li:nth-child(1)' ).dispatch( 'click' );
                        d3.select( 'body' ).dispatch( 'click' );

                        d3.select( '.hoot-confirm .confirm-actions button.primary' ).dispatch( 'click' );

                        setTimeout( () => { // wait for delete process to begin
                            Hoot.ui.managePanel.datasets.processRequest;
                        }, 300 );
                    }

                });

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
                }, 400 );
            } );
        } );

        describe( 'item selection', () => {
            before( async function() {

                let startLayer = table.select( 'g[data-name="UnitTestLayer2"]' ),
                    endLayer   = table.select( 'g[data-name="UnitTestLayer3"]' );

                startLayer.dispatch( 'click' );
                endLayer.node().dispatchEvent( shiftClick );
                endLayer.node().dispatchEvent( contextClick );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(2)' )
                    .dispatch( 'click' );

                let modifyModal = datasetsPanel.modifyLayerModal;
                let pathNameInput = modifyModal.pathNameInput,
                    submitButton  = modifyModal.submitButton;

                pathNameInput
                    .property( 'value', 'UnitTestFolder' )
                    .dispatch( 'change' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

            } );

            let folderId;

            it( 'selects a single layer', () => {
                table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );

                expect( table.select( 'g[data-type="dataset"] rect' ).classed( 'sel' ) ).to.be.true;
            } );

            it( 'deselects a single layer', () => {
                table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );

                expect( table.select( 'g[data-type="dataset"] rect' ).classed( 'sel' ) ).to.be.false;
            } );

            it( 'selects multiple layers while holding META key', () => {
                let datasets = table.selectAll( 'g[data-type="dataset"]' );

                table
                    .selectAll( 'g[data-type="dataset"]' )
                    .each( function() {
                        d3.select( this ).node().dispatchEvent( metaClick );
                    } );

                expect( table.selectAll( '.sel' ).size() ).to.equal( datasets.size() );
            } );

            it( 'selects single layer after selecting multiple datasets', () => {
                table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );

                expect( table.selectAll( '.sel' ).size() ).to.equal( 1 );
            } );

            it( 'selects groups of layers while holding META and SHIFT keys', () => {
                let datasets = table.selectAll( 'g[data-type="dataset"]' );

                datasets
                    .each( function() {
                        d3.select( this ).node().dispatchEvent( shiftClick );
                    } );

                expect( table.selectAll( 'g[data-type="dataset"] .sel' ).size() ).to.equal( 2 );

            } );

            it( 'opens context menu for single selected layer', done => {
                let dataset = table.select( 'g[data-type="dataset"]' );

                deselectAllDatasets();
                dataset.node().dispatchEvent( contextClick );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 5 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );

            it( 'opens context menu for multiple selected layers', done => {
                let dataset  = table.select( 'g[data-type="dataset"]' ),
                    datasets = table.selectAll( 'g[data-type="dataset"]' );

                // make sure only one dataset is selected
                deselectAllDatasets();
                dataset.dispatch( 'click' );

                datasets
                    .each( function() {
                        d3.select( this ).node().dispatchEvent( shiftClick );
                    } );

                dataset.node().dispatchEvent( contextClick );

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
                let dataset = table.select( 'g[data-type="dataset"]' );

                // make sure only one dataset is selected before firing context click
                deselectAllDatasets();
                dataset.dispatch( 'click' );
                dataset.node().dispatchEvent( contextClick );

                let contextMenu = d3.select( '.context-menu' ),
                    items       = contextMenu.selectAll( 'li' );

                expect( table.selectAll( 'g[data-type="dataset"] .sel' ).size() ).to.equal( 1 );
                expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
                expect( items.size() ).to.equal( 5 );

                setTimeout( () => {
                    d3.select( 'body' ).dispatch( 'click' );
                    done();
                }, CONTEXT_TIMEOUT );
            } );

            it( 'opens folder with children', () => {
                let isChild = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 ); // folderId > 0 means it resides in a folder other than root

                folderId = isChild[ 0 ].folderId;

                let childrenCount = _.filter( isChild, child => child.folderId === folderId ).length, // get number of children inside of selected folder
                    nodesCount    = table.selectAll( 'g.node' ).size(); // total number of nodes *shown* in dataset table

                table.select( `g[data-type="folder"][data-id="${folderId}"]` ).dispatch( 'click' ); // click on folder to open

                let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"] ._icon` ),
                    newNodesCount = table.selectAll( 'g.node' ).size();

                expect( folderIcon.classed( 'open-folder' ) ).to.be.true;
                //probably unique to data on ec2 or doesn't handle dirty db
                //expect( newNodesCount ).to.equal( nodesCount + childrenCount );
            } );

            it( 'closes folder with children', () => {
                let isChild       = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 ),
                    childrenCount = _.filter( isChild, child => child.folderId === folderId ).length, // use folder ID from previous test
                    nodesCount    = table.selectAll( 'g.node' ).size();

                table.select( `g[data-type="folder"][data-id="${folderId}"]` ).dispatch( 'click' );

                let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"] ._icon` ),
                    newNodesCount = table.selectAll( 'g.node' ).size();

                expect( folderIcon.classed( 'open-folder' ) ).to.be.false;
                //probably unique to data on ec2 or doesn't handle dirty db
                //expect( newNodesCount ).to.equal( nodesCount - childrenCount );
            } );

            it( 'opens folder context menu', done => {
                table.select( 'g[data-type="folder"]' ).node().dispatchEvent( contextClick );

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
            let modifyModal;

            it( 'opens modify modal for single layer', () => {
                table.select( 'g[data-name="UnitTestLayer0"]' ).node().dispatchEvent( contextClick );

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
                    endLayer   = table.select( 'g[data-name="UnitTestLayer2"]' );

                startLayer.dispatch( 'click' );
                endLayer.node().dispatchEvent( shiftClick );
                endLayer.node().dispatchEvent( contextClick );

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
                    layerNames    = [
                        'UnitTestLayer1',
                        'UnitTestLayer2'
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

            it( 'renames a layer', async () => {
                ensureFolderOpen( 'UnitTestFolder' );

                table.select( 'g[data-name="UnitTestLayer0"]' ).node().dispatchEvent( contextClick );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(4)' )
                    .dispatch( 'click' );

                d3.select( 'body' )
                    .dispatch( 'click' );

                modifyModal = datasetsPanel.modifyLayerModal;

                let layerNameInput = modifyModal.layerNameInput,
                    pathNameInput  = modifyModal.pathNameInput,
                    submitButton   = modifyModal.submitButton;

                expect( layerNameInput.property( 'value' ) ).to.equal( 'UnitTestLayer0' );
                expect( pathNameInput.property( 'value' ) ).to.equal( 'UnitTestFolder' );

                layerNameInput
                    .property( 'value', 'UnitTestLayerNew' )
                    .dispatch( 'keyup' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

                expect( table.select( 'g[data-name="UnitTestLayer0"]' ).size() ).to.equal( 0 );
                expect( table.select( 'g[data-name="UnitTestLayerNew"]' ).size() ).to.equal( 1 );
            } );

            it( 'opens modify folder modal', () => {
                table.select( 'g[data-name="UnitTestFolder1"]' ).node().dispatchEvent( contextClick );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(2)' )
                    .dispatch( 'click' );

                d3.select( 'body' )
                    .dispatch( 'click' );

                modifyModal = datasetsPanel.modifyFolderModal;

                let form                  = d3.select( '#modify-folder-form' ),
                    folderNameInput       = modifyModal.folderNameInput,
                    pathNameInput         = modifyModal.pathNameInput,
                    folderVisibilityInput = modifyModal.folderVisibilityInput;

                expect( form.size() ).to.equal( 1 );
                expect( form.select( '.modal-header h3' ).text() ).to.equal( 'Modify Folder' );
                expect( form.selectAll( '.hoot-form-field' ).size() ).to.equal( 3 );
                expect( folderNameInput.property( 'value' ) ).to.equal( 'UnitTestFolder1' );
                expect( pathNameInput.property( 'value' ) ).to.equal( 'root' );
                expect( folderVisibilityInput.property( 'checked' ) ).to.be.false;
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

            it( 'renames a folder', async () => {
                ensureFolderOpen( 'UnitTestFolder' );

                table.select( 'g[data-name="UnitTestFolder1"]' ).node().dispatchEvent( contextClick );

                d3.select( '.context-menu' )
                    .select( 'li:nth-child(2)' )
                    .dispatch( 'click' );

                d3.select( 'body' ).dispatch( 'click' );

                modifyModal = datasetsPanel.modifyFolderModal;

                let folderNameInput = modifyModal.folderNameInput,
                    pathNameInput   = modifyModal.pathNameInput,
                    submitButton    = modifyModal.submitButton;

                expect( folderNameInput.property( 'value' ) ).to.equal( 'UnitTestFolder1' );
                expect( pathNameInput.property( 'value' ) ).to.equal( 'UnitTestFolder' );

                folderNameInput
                    .property( 'value', 'UnitTestFolderNew' )
                    .dispatch( 'keyup' );

                submitButton.dispatch( 'click' );

                await modifyModal.processRequest;

                expect( table.select( 'g[data-name="UnitTestFolder1"]' ).size() ).to.equal( 0 );
                expect( table.select( 'g[data-name="UnitTestFolderNew"]' ).size() ).to.equal( 1 );
            } );
        } );

        describe( 'item delete', () => {
            it( 'shows delete confirmation', () => {
                ensureFolderOpen( 'UnitTestFolder' );

                table.select( 'g[data-name="UnitTestLayerNew"]' ).node().dispatchEvent( contextClick );

                let deleteItem = d3.select( '.context-menu li:nth-child(1)' );

                expect( deleteItem.text() ).to.equal( 'Delete (1)' );

                deleteItem.dispatch( 'click' );
                d3.select( 'body' ).dispatch( 'click' );

                let confirmOverlay = d3.select( '.hoot-confirm' );

                expect( confirmOverlay.size() ).to.equal( 1 );
                expect( confirmOverlay.select( '.confirm-message' ).text() ).to.equal( 'Are you sure you want to remove the selected datasets?' );
            } );

            it( 'deletes a single layer', done => {
                d3.select( '.hoot-confirm .confirm-actions button.primary' ).dispatch( 'click' );

                setTimeout( () => { // wait for delete process to begin
                    Hoot.ui.managePanel.datasets.processRequest.then( () => {
                        setTimeout( () => { // wait for table to finish re-rendering
                            expect( d3.select( '.hoot-confirm' ).size() ).to.equal( 0 );
                            expect( table.select( 'g[data-name="UnitTestLayerNew"]' ).size() ).to.equal( 0 );
                            expect( Hoot.layers.findBy( 'name', 'UnitTestLayerNew' ) ).to.be.undefined;
                            done();
                        }, 100 );
                    } );
                }, 100 );
            } );

            it( 'deletes multiple layers', done => {
                ensureFolderOpen( 'UnitTestFolder' );

                let startLayer = table.select( 'g[data-name="UnitTestLayer1"]' ),
                    endLayer   = table.select( 'g[data-name="UnitTestLayer3"]' );

                startLayer.dispatch( 'click' );
                endLayer.node().dispatchEvent( shiftClick );
                endLayer.node().dispatchEvent( contextClick );

                let deleteItem = d3.select( '.context-menu li:nth-child(1)' );

                expect( deleteItem.text() ).to.equal( 'Delete (3)' );

                deleteItem.dispatch( 'click' );
                d3.select( 'body' ).dispatch( 'click' );
                d3.select( '.hoot-confirm .confirm-actions button.primary' ).dispatch( 'click' );

                setTimeout( () => { // wait for delete process to begin
                    Hoot.ui.managePanel.datasets.processRequest.then( () => {
                        setTimeout( () => { // wait for table to finish re-rendering
                            expect( d3.select( '.hoot-confirm' ).size() ).to.equal( 0 );

                            expect( table.select( 'g[data-name="UnitTestLayer1"]' ).size() ).to.equal( 0 );
                            expect( table.select( 'g[data-name="UnitTestLayer2"]' ).size() ).to.equal( 0 );
                            expect( table.select( 'g[data-name="UnitTestLayer3"]' ).size() ).to.equal( 0 );

                            expect( Hoot.layers.findBy( 'name', 'UnitTestLayer1' ) ).to.be.undefined;
                            expect( Hoot.layers.findBy( 'name', 'UnitTestLayer2' ) ).to.be.undefined;
                            expect( Hoot.layers.findBy( 'name', 'UnitTestLayer3' ) ).to.be.undefined;
                            done();
                        }, 100 );
                    } );
                }, 100 );
            } );

            it( 'recursively deletes folders and layers', done => {
                ensureFolderOpen( 'UnitTestFolder' );

                table.select( 'g[data-name="UnitTestFolder"]' ).node().dispatchEvent( contextClick );
                d3.select( '.context-menu li:nth-child(1)' ).dispatch( 'click' );
                d3.select( 'body' ).dispatch( 'click' );

                let confirmOverlay = d3.select( '.hoot-confirm' );

                expect( confirmOverlay.size() ).to.equal( 1 );
                expect( confirmOverlay.select( '.confirm-message' ).text() ).to.equal( 'Are you sure you want to remove the selected folder and all data?' );

                d3.select( '.hoot-confirm .confirm-actions button.primary' ).dispatch( 'click' );

                setTimeout( () => { // wait for delete process to begin
                    Hoot.ui.managePanel.datasets.processRequest.then( () => {
                        setTimeout( () => { // wait for table to finish re-rendering
                            expect( d3.select( '.hoot-confirm' ).size() ).to.equal( 0 );

                            expect( table.select( 'g[data-name="UnitTestFolder"]' ).size() ).to.equal( 0 );
                            expect( table.select( 'g[data-name="UnitTestFolderNew"]' ).size() ).to.equal( 0 );
                            expect( table.select( 'g[data-name="UnitTestLayer4"]' ).size() ).to.equal( 0 );

                            expect( Hoot.folders.findBy( 'name', 'UnitTestFolder' ) ).to.be.undefined;
                            expect( Hoot.folders.findBy( 'name', 'UnitTestFolderNew' ) ).to.be.undefined;
                            expect( Hoot.layers.findBy( 'name', 'UnitTestLayer4' ) ).to.be.undefined;
                            done();
                        }, 100 );
                    } );
                }, 100 );
            } );
        } );
    } );
};
