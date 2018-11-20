/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/14/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/
describe( 'Basemap component rendered', () => {
    it( ' Activates basemap selector ', done => {
        d3.select('nav#navbar div.nav-item div.menu-button').dispatch('click');
      d3.select('#manage-sidebar-menu div.tab-header:nth-child(3)').dispatch('click');
      setTimeout(() => {
        var selectBasemap = d3.selectAll('#util-basemaps').attr('id');
        expect(selectBasemap).to.be.eql('util-basemaps');
        done();
      }, 1000);
    } );
    it( 'Raster input window opens', done => {
        d3.select('#util-basemaps  div  button').dispatch('click');      
        setTimeout(() => {
            expect(d3.select('#basemaps-add-form > div > div').size() ).to.equal( 1 );
            done();
        }, 2000);
    } );
    it( 'Raster input window closes', done => {
        d3.select('#basemaps-add-form  div  div  form  div  h3  div').dispatch('click');

        setTimeout(() => {
            expect(d3.select('#basemaps-add-form  div  div  form  div  h3  div').size() ).to.equal( 0 );
            done();
        }, 1000);
    } );
    it( 'File added to table', done => {
        setTimeout(() => {
            expect(d3.select('#util-basemaps  div  div').size() ).to.equal( 1 );
            done();
        },1000);
    }); 
    it( 'Basemap table contains buttons', done => {
        setTimeout(() => {
            expect(d3.select('#util-basemaps  div  div  div  div').size() ).to.equal( 1 );
            done();
        }, 1000);
    } );
  } );