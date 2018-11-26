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
            var newBasemapWindow = d3.select('.contain hoot-menu');
            expect(d3.select(newBasemapWindow).size() ).to.equal( 1 );
            done();
        }, 2000);
    } );
    it( 'Raster input window closes', done => {
        var windowClose = d3.select('.fr _icon close pointer');
        windowClose.dispatch('click');

        setTimeout(() => {
            expect(d3.select('#basemaps-add-form  div  div  form  div  h3  div').size() ).to.equal( 0 );
            done();
        }, 1000);
    } );
    it( 'File added to table', done => {
        var newBasemapWindow = d3.select('.contain hoot-menu');
        setTimeout(() => {
            expect(newBasemapWindow.size() ).to.equal( 1 );
            done();
        },1000);
    }); 
    it( 'Basemap table contains buttons', done => {
        setTimeout(() => {
            var tableButtons = d3.select('.button-container');
            expect(tableButtons.size() ).to.be.equal( 1 );
            done();
        }, 1000);
    } );
  } );