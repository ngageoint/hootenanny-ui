/** ****************************************************************************************************
 * File: addBasemap.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/
 describe( 'Basemap component rendered', () => {
    after(done => {
        d3.select( '.menu-button' ).dispatch( 'click' );
        setTimeout(() => { done(); }, 500);
    });
    it( 'Activates basemap selector ', done => {
        d3.select('div.menu-button').dispatch('click');
        var basemapNode = d3.select('#manage-sidebar-menu div.tab-header:nth-child(3)');
        setTimeout(() => {
        basemapNode.dispatch('click');
        setTimeout(() => {
            var selectBasemap = d3.selectAll('#util-basemaps').attr('id');
            expect(selectBasemap).to.be.eql('util-basemaps');
            done();
        }, 500);
        },200);
    } );
    it( 'Raster input window opens', done => {
        d3.select('.add-basemap-button').dispatch('click');
        setTimeout(() => {
            var newBasemapWindow = d3.select('.contain');
            expect(d3.select(newBasemapWindow).size() ).to.be.eql( 1 );
            done();
        }, 2000);
    } );
    it( 'Raster input window closes', done => {
        var closeFormButton = d3.select('div.fr._icon.close.pointer');
        closeFormButton.dispatch('click');
        setTimeout(() => {
            var newBasemapWindow = d3.select('.contain.hoot-menu');
            expect(newBasemapWindow.size() ).to.equal( 0 );
            done();
        }, 500);
    } );
    it( 'Basemap table contains buttons', done => {
        setTimeout(() => {
            var basemapFormButtons = d3.select('button.add-basemap-button');
            expect(basemapFormButtons.size() ).to.equal( 1 );
            done();
        }, 500);
    } );
  } );
