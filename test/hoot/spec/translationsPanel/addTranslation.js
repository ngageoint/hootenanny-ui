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