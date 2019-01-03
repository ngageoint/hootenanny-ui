/** ****************************************************************************************************
 * File: addTranslation.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

 describe( 'Translation Component', () => {
    it( 'Create new translation window opens', done => {
        d3.select('.add-translation-button').dispatch('click');
        setTimeout( () => {
            var translationForm = d3.select('#translations-add-form').attr('class');
            expect(translationForm).to.include('visible');
            done();
        }, 1000);
    } );
    it ( 'Translations Modal active', done => {
        d3.select('#manage-sidebar-menu div.tab-header:nth-child(4)').dispatch('click');
        var translationsModal = d3.select('#util-translations').attr('class');
        setTimeout( () => {
            expect(translationsModal).to.include('active');
            done();
        }, 500 );
    } );
    it( 'Window closes', done => {
        var closeWindow = d3.select('div.fr._icon.close.pointer');
        closeWindow.dispatch('click');
        setTimeout( () => {
            var translationForm = d3.select('#translations-add-form');
            expect(translationForm.size() ).to.be.eql(0);
            done();
        });
    } );
 } );