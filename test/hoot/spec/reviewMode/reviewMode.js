/** ****************************************************************************************************
 * File: reviewMode.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

// let iD        = require( '../../../../modules/index' ),
//     Hoot      = require( '../../../../modules/Hoot/hoot' ).default;

describe( 'Entered Review Mode', () => {
    before( () => {

        
        { { '-1'; }}
    });
    it( 'Selects a Primary Layer', done => {
        d3.select('#reference a.toggle-button').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#reference').size() ).to.be.equal( 1 );
            done();
        }, 1000);
    } );
    it( 'Selects Primary dataset', done => {
        d3.select('#add-ref-table g[data-name="BostonSubsetRoadBuilding_FromOsm"]').dispatch('click');
        d3.select('#add-ref-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var primaryData = d3.select('#reference').attr('data-name');
            expect(primaryData).to.be.eql('BostonSubsetRoadBuilding_FromOsm');
            done();
        }, 2500);
    } );
    it( 'Selects Reference dataset', done => {
        d3.select('#secondary a.toggle-button').dispatch('click');
        d3.select('#add-secondary-table g[data-name="BostonSubsetRoadBuilding_FromShp"]').dispatch('click');
        d3.select('#add-secondary-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var secondaryData = d3.select('#secondary').attr('data-name');
            expect(secondaryData).to.be.eql('BostonSubsetRoadBuilding_FromShp');
            done();
        }, 2500);
    });
    it( 'Conflating layers', done => {
        d3.select('#conflate').dispatch('click');
        d3.select('button.button.dark').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#conflate').size() ).to.eql( 1 );
            done();
        }, 35000);
    } );
    it( 'Layers merged, alert window displayed', done => {
        d3.select('div.confirm-actions button.primary').dispatch('click');

        setTimeout(() => {
            var reviewWindow = d3.select('div.contain hoot-menu fill-white round modal');
            expect(reviewWindow.size() ).to.be.equal( 0 );
            var conflating = d3.select('#conflate').attr('data-name');
            expect(conflating).to.include('Merged');
            done();
        });
    }, 20000);
    it ( 'Opens Bookmark Review dialogue', done => {
        var openReview = d3.select('button._icon.plus.fill-grey.button.round.pad0y.pad1x.small.strong');
        openReview.dispatch('click');
        setTimeout(() => {
            var bookmarkReview = d3.select('#bookmark-review-form');
            expect(bookmarkReview.size() ).to.be.eql( 1 );
            done();
        });
    }, 15000);
    it ( 'Selects next reivew without email', done => {
        var bookmarks = ['Review Test', 'Testing Reviews', ''];
        d3.selectAll('form input.text-input')
            .each(function( d, i ) {
                d3.select(this).property( 'value', bookmarks[i] );
            });
        d3.select('#bookmarkNote').property( 'value', 'Hey here are some fun notes' );
        d3.select('#bookmarkSubmitButton').property('disabled', false);
        d3.select('#bookmarkSubmitButton').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#bookmark-review-form').size() ).to.be.eql( 0 );
            done();
        }, 5000);
    } );
});