/** ****************************************************************************************************
 * File: addFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/6/18
 *******************************************************************************************************/

const _find = require( 'lodash/find' );

module.exports = () => {
    describe( 'add folder', () => {
        let datasets,
            addModal;

        it( 'opens add folder modal', done => {
            d3.select( '.dataset-action-button:nth-child(3)' ).dispatch( 'click' );

            setTimeout( () => {
                expect( d3.select( '#add-folder-form' ).size() ).to.equal( 1 );
                done();
            }, 200 );
        } );

        it( 'validates form fields', () => {
            datasets = Hoot.ui.managePanel.datasets;
            addModal = datasets.addFolderModal;

            let folderNameInput = addModal.folderNameInput,
                submitButton    = addModal.submitButton;

            expect( folderNameInput.property( 'value' ) ).to.be.empty;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            folderNameInput
                .property( 'value', '!' )
                .dispatch( 'keyup' );

            expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            folderNameInput
                .property( 'value', '' )
                .dispatch( 'keyup' );

            expect( folderNameInput.classed( 'invalid' ) ).to.be.true;
            expect( submitButton.property( 'disabled' ) ).to.be.true;

            folderNameInput
                .property( 'value', 'UnitTestFolder' )
                .dispatch( 'keyup' );

            expect( folderNameInput.classed( 'invalid' ) ).to.be.false;
            expect( submitButton.property( 'disabled' ) ).to.be.false;
        } );

        it( 'adds a new folder', async () => {
            let submitButton = addModal.submitButton;

            submitButton.dispatch( 'click' );

            await addModal.processRequest;

            expect( datasets.addFolderModal ).to.be.undefined;
            expect( _find( Hoot.folders._folders, f => f.name === 'UnitTestFolder' ) ).to.be.ok;
            expect( d3.select( '#dataset-table' ).select( 'g[data-name="UnitTestFolder"]' ).size() ).to.equal( 1 );
        } );
    } );
};