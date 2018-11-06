/** ****************************************************************************************************
 * File: importMulti.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/5/18
 *******************************************************************************************************/

const _map = require( 'lodash/map' );

const { retrieveFile } = require( '../../helpers' );

module.exports = () => {
    describe( 'import multiple', () => {
        let datasets,
            importModal;

        it( 'opens import multi modal', done => {
            d3.select( '.dataset-action-button:nth-child(2)' ).dispatch( 'click' );

            setTimeout( () => {
                expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 1 );
                done();
            }, 200 );
        } );

        it( 'validates form fields', async () => {
            datasets    = Hoot.ui.managePanel.datasets;
            importModal = datasets.importMultiModal;

            let typeInput         = importModal.typeInput,
                fileInput         = importModal.fileInput,
                fileListInput     = importModal.fileListInput,
                folderNameInput   = importModal.newFolderNameInput,
                customSuffixInput = importModal.customSuffixInput,
                fileIngest        = importModal.fileIngest,
                submitButton      = importModal.submitButton;

            expect( typeInput.property( 'value' ) ).to.be.empty;
            expect( fileInput.property( 'disabled' ) ).to.be.true;
            expect( customSuffixInput.property( 'disabled' ) ).to.be.false;

            typeInput
                .property( 'value', 'Shapefile' )
                .dispatch( 'change' );

            expect( fileInput.property( 'disabled' ) ).to.be.false;
            expect( customSuffixInput.property( 'disabled' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            let dT        = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
                fileNames = [
                    'base/test/data/SplitLongWaysTest.dbf',
                    'base/test/data/SplitLongWaysTest.shp',
                    'base/test/data/SplitLongWaysTest.shx',
                ];

            await Promise.all( _map( fileNames, async name => {
                let file = await retrieveFile( name );

                dT.items.add( file );

                fileIngest.node().files = dT.files;
            } ) );

            await fileIngest.dispatch( 'change' );

            expect( fileInput.property( 'value' ) ).to.have.string( 'SplitLongWaysTest.dbf' );
            expect( fileInput.property( 'value' ) ).to.have.string( 'SplitLongWaysTest.shp' );
            expect( fileInput.property( 'value' ) ).to.have.string( 'SplitLongWaysTest.shx' );
            expect( fileListInput.select( 'option' ).property( 'value' ) ).to.equal( 'SplitLongWaysTest' );
            expect( submitButton.property( 'disabled' ) ).to.be.false;

            // check for invalid character in text field
            folderNameInput
                .property( 'value', '!' )
                .dispatch( 'keyup' );

            expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            // check for proper values in all fields
            folderNameInput
                .property( 'value', '' )
                .dispatch( 'keyup' );

            expect( customSuffixInput.classed( 'invalid' ) ).to.be.false;
            expect( folderNameInput.classed( 'invalid' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.false;
        } );

        it( 'imports a new layer from Shapefile', async () => {
            let importSubmit = importModal.submitButton;

            expect( importSubmit.select( 'span' ).text() ).to.equal( 'Import' );
            expect( Hoot.layers.findBy( 'name', 'SplitLongWaysTest' ) ).to.be.undefined;

            importSubmit.dispatch( 'click' );

            expect( importSubmit.select( 'span' ).text() ).to.equal( 'Uploading...' );

            await importModal.processRequest;

            expect( datasets.importMultiModal ).to.be.undefined;
            expect( Hoot.layers.findBy( 'name', 'SplitLongWaysTest' ) ).to.be.ok;
            expect( d3.select( '#dataset-table' ).select( 'g[data-name="SplitLongWaysTest"]' ).size() ).to.equal( 1 );
        } ).timeout( 15000 );
    } );
};
