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

        after( async () => {
            if ( Hoot.layers.findBy( 'name', 'LAP030' ) ) {
                console.log( 'Deleting layer: "LAP030"');
                await Hoot.api.deleteLayer( 'LAP030' );
            }
        } );

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
                submitButton      = importModal.submitButton,
                schemaInput      = importModal.schemaInput;

            expect( typeInput.property( 'value' ) ).to.be.empty;
            expect( fileInput.property( 'disabled' ) ).to.be.true;
            expect( customSuffixInput.property( 'disabled' ) ).to.be.false;

            typeInput
                .property( 'value', 'Shapefile' )
                .dispatch( 'change' );

            expect( fileInput.property( 'disabled' ) ).to.be.false;
            expect( customSuffixInput.property( 'disabled' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            let dT = new ClipboardEvent( '' ).clipboardData || new DataTransfer();

            let fileNames = [
                'base/test/data/LAP030.dbf',
                'base/test/data/LAP030.shp',
                'base/test/data/LAP030.shx',
            ];

            await Promise.all( _map( fileNames, async name => {
                let file = await retrieveFile( name );

                dT.items.add( file );

                fileIngest.node().files = dT.files;
            } ) );

            await fileIngest.dispatch( 'change' );

            expect( fileInput.property( 'value' ) ).to.have.string( 'LAP030.dbf' );
            expect( fileInput.property( 'value' ) ).to.have.string( 'LAP030.shp' );
            expect( fileInput.property( 'value' ) ).to.have.string( 'LAP030.shx' );
            expect( fileListInput.select( 'option' ).property( 'value' ) ).to.equal( 'LAP030' );
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

            let mgcp = 'Multinational Geospatial Co-production Program (MGCP) TRD3&4';
            schemaInput
                .property( 'value', mgcp )
                .dispatch( 'keyup' );

            expect( schemaInput.property( 'value' ) ).to.have.string( mgcp );


        } );

        it( 'imports a new layer from Shapefile', async () => {
            let importSubmit = importModal.submitButton;

            expect( importSubmit.select( 'span' ).text() ).to.equal( 'Import' );
            expect( Hoot.layers.findBy( 'name', 'LAP030' ) ).to.be.undefined;

            importSubmit.dispatch( 'click' );

            await importModal.processRequest;

            expect( datasets.importMultiModal ).to.be.undefined;
            expect( Hoot.layers.findBy( 'name', 'LAP030' ) ).to.be.ok;
            expect( d3.select( '#dataset-table' ).select( 'g[data-name="LAP030"]' ).size() ).to.equal( 1 );
        } ).timeout( 15000 );
    } );
};
