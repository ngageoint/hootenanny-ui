/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Translation Assistant Component', () => {

    it( 'Translations assistant component selected', done => {

        d3.select('div.menu-button').dispatch('click');
        var translationAssistantNode = d3.select('#manage-sidebar-menu div.tab-header:nth-child(5)');
        translationAssistantNode.dispatch('click');
        setTimeout(() => {
            var translationsTab = d3.select('#manage-translations-assistant').attr('id');
            expect(translationsTab).to.be.eql('manage-translations-assistant');
            done();
        }, 500);
    });

    it( 'Component contains Tag Schema, and buttons', done => {
        setTimeout(() => {
            var translationAssistantForm = d3.selectAll('#manage-translations-assistant div form div');
            expect(translationAssistantForm.size() ).to.be.equal( 4 );
            done();
        }, 500);
    } );

    it( 'Upload Files and Upload Folder buttons rendered', done => {

        setTimeout(() => {
            var uploadButtons = d3.selectAll('div.button-row.pad2 button');
            expect(uploadButtons.size() ).to.be.eql( 2 );
            done();
        });
    } );
} );