/** ****************************************************************************************************
 * File: reviewBookmark.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/20/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Review Bookmark component rendered', () => {

    it( 'Review bookmark tab selected', done => {
        d3.select('div.menu-button').dispatch('click');
        setTimeout(() => {
            var reviewBookmarks = d3.select('#manage-sidebar-menu div.tab-header:nth-child(6)');
            reviewBookmarks.dispatch('click');
            var reviewComponent = d3.selectAll('#util-review-bookmarks').attr('id');
            expect(reviewComponent).to.be.eql('util-review-bookmarks');
            done();
        }, 500);
    });
    it( 'Component contains all filters', done => {

        setTimeout(() => {
            expect(d3.selectAll('div.filter-control').size() ).to.be.equal( 4 );
            done();
        });
    } );
    it( 'Contains clear filters button', done => {
        setTimeout(() => {
            expect(d3.selectAll('button.bookmark-action-button').size() ).to.be.equal( 2 );
            done();
        });
    });

    it( 'Table rendered', done => {
        setTimeout(() => {
            expect(d3.select('div.bookmark-table').size() ).to.be.equal( 1 );
            done();
        });
    } );
} );
