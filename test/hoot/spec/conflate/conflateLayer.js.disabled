/** ****************************************************************************************************
 * File: conflateLayer.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/22/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Layers successfully conflated', () => {

    it( 'Selects a Primary Layer', done => {
        d3.select('#reference a.toggle-button').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#reference').size() ).to.be.equal( 1 );
            done();
        }, 1000);
    } );
    it( 'Selects Primary dataset dataset', done => {
        d3.select('#add-ref-table g[data-name="UndividedHighway"]').dispatch('click');
        d3.select('#add-ref-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var primaryData = d3.select('#reference').attr('data-name');
            expect(primaryData).to.be.eql('UndividedHighway');
            done();
        }, 2500);
    } );
    it( 'Selects Reference dataset', done => {
        d3.select('#secondary a.toggle-button').dispatch('click');
        d3.select('#add-secondary-table g[data-name="UnitTestImportMulti"]').dispatch('click');
        d3.select('#add-secondary-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var secondaryData = d3.select('#secondary').attr('data-name');
            expect(secondaryData).to.be.eql('UnitTestImportMulti');
            done();
        }, 2500);
    });
    it( 'Conflating layers', done => {
        d3.select('#conflate').dispatch('click');
        d3.select('button.button.dark').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#conflate').size() ).to.eql( 1 );
            done();
        }, 15000);
    } );
    it( 'Layers merged, alert window displayed', done => {
        d3.select('button.secondary').dispatch('click');
        setTimeout(() => {
            var conflating = d3.select('#conflate').attr('data-name');
            expect(conflating).to.include('Merged');
            var reviewModeAlert = d3.select('div.contain.hoot-menu');
            expect(reviewModeAlert.size() ).to.eql( 1 ); 
            done();
        });
    }, 2500);
    it( 'Closed alert window', done => {

        // avoiding review mode
        d3.select('button.primary').dispatch('click');

        // accepting changes
        d3.select('button.secondary').dispatch('click');

        var confirmActions = d3.select('div.confirm-actions button.primary');
        
        // accepting all changes
        confirmActions.dispatch('click');
        confirmActions.dispatch('click');
        confirmActions.dispatch('click');
        setTimeout(() => {
            var mergedFiles = d3.select('#conflate').attr('data-name');
            expect(mergedFiles).to.include('Merged');
            done();
        }, 2500);
    } );
} );