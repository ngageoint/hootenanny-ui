/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/15/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

 describe('Translation Component', () => {
     it(' Translations component selected ', done => {

        d3.select('nav#navbar div.nav-item div.menu-button').dispatch('click');
        d3.select('#manage-sidebar-menu div.tab-header:nth-child(4)').dispatch('click');
        setTimeout(() => {
            var translationsTab = d3.select('#util-translations').attr('id');
            expect(translationsTab).to.be.eql('util-translations');
            done();
        }, 500);
         
     });
    it(' Create new translation window opens ', done => {
        d3.select('#util-translations  div  button').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#translations-add-form  div  div').size() ).to.equal( 1 );
            done();
        }, 1000);
    });
    it(' Window has name input ', done => {
        setTimeout(() => {
            var nameInput = d3.select('#translationSaveName').attr('id');
            expect(nameInput).to.be.eql('translationSaveName');
            done();
        });
    });
    it(' Window has description input ', done => {
        setTimeout(() => {
            var descriptionInput = d3.select('#translationSaveDescription').attr('id');
            expect(descriptionInput).to.be.eql('translationSaveDescription');
            done();
        });

    });
    it(' Window has new translation box ', done => {
        setTimeout(() => {
            var newTranslationInput = d3.select('#translationTemplate').attr('id');
            expect(newTranslationInput).to.be.eql('translationTemplate');
            done();
        });
    });
    it(' Window closes ', done => {
        d3.select('#translations-add-form  div  div  form  div  h3  div').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#translations-add-form  div  div').size() ).to.be.equal( 0 );
            done();
        });
    });
    it(' Translation table exits ', done => {
        setTimeout(() => {
            expect(d3.selectAll('#util-translations div  div  div').size() ).to.be.equal( 45 );
            done();
          });
    });
 } );