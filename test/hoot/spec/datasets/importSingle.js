/** ****************************************************************************************************
 * File: importSingle.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/2/18
 *******************************************************************************************************/

const { retrieveFile } = require( '../../helpers' );

module.exports = () => {
    describe( 'import single', () => {
        let datasets,
            importModal;

        it( 'opens import single modal', done => {
            expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 0 );

            d3.select( '.dataset-action-button:first-child' ).dispatch( 'click' );

            setTimeout( () => {
                expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 1 );
                done();
            }, 200 );
        } );

        it( 'performs validation on form fields', async () => {
            datasets    = Hoot.ui.managePanel.datasets;
            importModal = datasets.importSingleModal;

            let typeInput       = importModal.typeInput,
                fileInput       = importModal.fileInput,
                layerNameInput  = importModal.layerNameInput,
                folderNameInput = importModal.newFolderNameInput,
                schemaInput     = importModal.schemaInput,
                fileIngest      = importModal.fileIngest,
                submitButton    = importModal.submitButton;

            expect( typeInput.property( 'value' ) ).to.be.empty;
            expect( fileInput.property( 'disabled' ) ).to.be.true;
            expect( schemaInput.property( 'disabled' ) ).to.be.true;

            typeInput
                .property( 'value', 'File (osm, osm.zip, pbf)' )
                .dispatch( 'change' );

            expect( fileInput.property( 'disabled' ) ).to.be.false;
            expect( schemaInput.property( 'disabled' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            let dT   = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
                file = await retrieveFile( 'base/test/data/UndividedHighway.osm' );

            dT.items.add( file );

            fileIngest.node().files = dT.files;

            await fileIngest.dispatch( 'change' );

            expect( fileInput.property( 'value' ) ).to.equal( 'UndividedHighway.osm' );
            expect( layerNameInput.property( 'value' ) ).to.equal( 'UndividedHighway' );
            expect( submitButton.property( 'disabled' ) ).to.be.false;

            // check for invalid character in text field
            folderNameInput
                .property( 'value', '!' )
                .dispatch( 'keyup' );

            expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
            expect( submitButton.property( 'disabled' ) ).to.be.true;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            // check for empty value in specific fields
            layerNameInput
                .property( 'value', '' )
                .dispatch( 'keyup' );

            folderNameInput // new folder name is allowed to be empty
                .property( 'value', '' )
                .dispatch( 'keyup' );

            expect( layerNameInput.classed( 'invalid' ) ).to.be.true;
            expect( folderNameInput.classed( 'invalid' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            // update layer name to signify that this layer was created during unit tests &
            // check for correct values in all fields
            layerNameInput
                .property( 'value', 'UnitTestSingle' )
                .dispatch( 'keyup' );

            expect( layerNameInput.classed( 'invalid' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.false;
        } );

        it( 'imports a new layer from OSM file', async () => {
            let importSubmit = importModal.submitButton;

            expect( importSubmit.select( 'span' ).text() ).to.equal( 'Import' );
            expect( Hoot.layers.findBy( 'name', 'UnitTestSingle' ) ).to.be.undefined;

            importSubmit.dispatch( 'click' );

            expect( importSubmit.select( 'span' ).text() ).to.equal( 'Uploading...' );

            await importModal.processRequest;

            expect( datasets.importSingleModal ).to.be.undefined;
            expect( Hoot.layers.findBy( 'name', 'UnitTestSingle' ) ).to.be.ok;
            expect( d3.select( '#dataset-table' ).select( 'g[data-name="UnitTestSingle"]' ).size() ).to.equal( 1 );
        } );

        it( 'closes import single modal', done => {
            expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 0 );

            d3.select( '.dataset-action-button:first-child' ).dispatch( 'click' );

            setTimeout( () => {
                expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 1 );

                d3.select( '#datasets-import-form ._icon.close' ).dispatch( 'click' );

                expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 0 );
                done();
            }, 200 );
        } );
    } );
};
