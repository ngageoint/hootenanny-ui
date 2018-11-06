/** ****************************************************************************************************
 * File: addFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/6/18
 *******************************************************************************************************/

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
        } );
    } );
};
