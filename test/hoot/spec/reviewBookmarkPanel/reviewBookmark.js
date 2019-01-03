/** ****************************************************************************************************
 * File: reviewBookmark.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/20/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe( 'Review Bookmark component rendered', () => {

    it( 'Review bookmark tab selected', done => {
        d3.select('div.menu-button').dispatch('click');
        var reveiwBookmarks = d3.select('#manage-sidebar-menu div.tab-header:nth-child(6)');
        reveiwBookmarks.dispatch('click');
        setTimeout(() => {
            var reviewComponent = d3.selectAll('#util-review-bookmarks').attr('class');
            expect(reviewComponent).to.include('active');
            done();
        }, 500);
    });
} );