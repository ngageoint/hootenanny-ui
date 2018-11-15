/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/16/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe(" Translation Assistant Component ", () => {

    it(" Translations assistant component selected ", done => {

        d3.select("nav#navbar div.nav-item div.menu-button").dispatch("click");
        d3.select("#manage-sidebar-menu div.tab-header:nth-child(5)").dispatch("click");
        setTimeout(() => {
            var translationsTab = d3.select("#manage-translations-assistant").attr('id')
            expect(translationsTab).to.be.eql("manage-translations-assistant")
            done();
        }, 500)
    })

    it( " Component contains Tag Schema, and buttons ", done => {
        setTimeout(() => {
            expect(d3.selectAll("#manage-translations-assistant div form div").size() ).to.be.equal( 2 )
            done()
        }, 500)
    })

    it(" Upload Files and Upload Folder buttons rendered ", done => {

        setTimeout(() => {
            expect(d3.select("#manage-translations-assistant div form div.button-row.pad2 button:nth-child(1)").size() ).to.equal( 1 )
            expect(d3.select("#manage-translations-assistant div form div.button-row.pad2 button:nth-child(2)").size() ).to.equal( 1 )
            done();
        })
    })

    it(" Upload file button opens file manager ", done => {
        d3.select(" #manage-translations-assistant div form div.button-row.pad2 button:nth-child(1) ").dispatch("click")
        done();
    })
})