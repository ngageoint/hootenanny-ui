/** ****************************************************************************************************
 * File: addBasemap.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/
describe( 'Basemap component rendered', () => {
    it( ' Activates basemap selector ', done => {
        d3.select('div.menu-button').dispatch('click');
        var basemapNode = d3.select('#manage-sidebar-menu div.tab-header:nth-child(3)')
        basemapNode.dispatch('click');
        setTimeout(() => {
            var selectBasemap = d3.selectAll('#util-basemaps').attr('id');
            expect(selectBasemap).to.be.eql('util-basemaps');
            done();
        }, 1000);
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
        }, 1000);
    } );
    it( 'Basemap table contains buttons', done => {
        setTimeout(() => {
            var basemapFormButtons = d3.select('div.button-container.fr');
            expect(basemapFormButtons.size() ).to.equal( 1 );
            done();
        }, 1000);
    } );
  } );
