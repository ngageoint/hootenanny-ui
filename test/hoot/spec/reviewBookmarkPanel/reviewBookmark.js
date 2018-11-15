describe(" Review Bookmark component rendered ", () => {

    it(" Review bookmark tab selected", done => {
        d3.select("nav#navbar div.nav-item div.menu-button").dispatch("click");
      d3.select("#manage-sidebar-menu div.tab-header:nth-child(6)").dispatch("click");
      setTimeout(() => {
        var selectBasemap = d3.selectAll("#util-review-bookmarks").attr("id");
        expect(selectBasemap).to.be.eql("util-review-bookmarks");
        done();
      }, 500);
    });
    it( " Component contains all filters ", done => {

        setTimeout(() => {
            expect(d3.selectAll("#util-review-bookmarks div div.bookmark-filter-container div").size() ).to.be.equal( 9 )
            done();
        })
    })

    it(" Table rendered ", done => {
        setTimeout(() => {
            expect(d3.select("#util-review-bookmarks div  div.bookmark-table.keyline-all").size() ).to.be.equal( 1 )
            done()
        })
    })
})