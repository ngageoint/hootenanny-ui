/** ****************************************************************************************************
 * File: translationAssistant.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Translation Assistant Component', () => {

    it( 'Translations assistant selected properly', done => {
        
        
        d3.select('div.menu-button').dispatch('click');
        d3.select('#util-translations').dispatch('click');
        var translationAssistantNode = d3.select('#manage-sidebar-menu div.tab-header:nth-child(5)');
        translationAssistantNode.dispatch('click');
        setTimeout(() => {
            var translationsTab = d3.select('#manage-translations-assistant').attr('class');
            expect(translationsTab).to.include('active');
            done();
        }, 500);
    });

    it( 'Translational assitant modal active', done => {
        var manageTranslations = d3.select('#manage-translations-assistant').attr('class');
        setTimeout( () => {
            expect(manageTranslations).to.include('active');
            done();
        }, 100 );
    } );
} );