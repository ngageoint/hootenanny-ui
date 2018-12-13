/** ****************************************************************************************************
 * File: addTranslation.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

 describe( 'Translation Component', () => {
     it( 'Translations component selected', done => {

        d3.select('div.menu-button').dispatch('click');
        var translationNode = d3.select('#manage-sidebar-menu div.tab-header:nth-child(4)');
        translationNode.dispatch('click');
        setTimeout(() => {
            var translationsTab = d3.select('#util-translations').attr('id');
            expect(translationsTab).to.be.eql('util-translations');
            done();
        }, 500);

     } );
    it( 'Create new translation window opens', done => {
        d3.select('.add-translation-button').dispatch('click');
        setTimeout(() => {
            var translationForm = d3.select('#translations-add-form  div  div');
            expect(translationForm.size() ).to.equal( 1 );
            done();
        }, 1000);
    } );
    it( 'Window has name input', done => {
        setTimeout(() => {
            var nameInput = d3.select('#translationSaveName').attr('id');
            expect(nameInput).to.be.eql('translationSaveName');
            done();
        });
    } );
    it( 'Window has description input', done => {
        setTimeout(() => {
            var descriptionInput = d3.select('#translationSaveDescription').attr('id');
            expect(descriptionInput).to.be.eql('translationSaveDescription');
            done();
        });

    } );
    it( 'Window has new translation box', done => {
        setTimeout(() => {
            var newTranslationInput = d3.select('#translationTemplate').attr('id');
            expect(newTranslationInput).to.be.eql('translationTemplate');
            done();
        });
    } );
    it( 'Window closes', done => {
        var closeWindow = d3.select('#translations-add-form  div  div  form  div  h3  div')
        closeWindow.dispatch('click');
        setTimeout(() => {
            var translationForm = d3.select('#translations-add-form  div  div');
            expect(translationForm.size() ).to.be.equal( 0 );
            done();
        });
    } );
    // it( 'Translation table exits', done => {
    //     setTimeout(() => {
    //         expect(d3.selectAll('#util-translations div  div  div').size() ).to.be.equal( 45 );
    //         done();
    //       });
    // } );
 } );