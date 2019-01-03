/** ****************************************************************************************************
 * File: addBasemap.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 1/3/19 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

const { retrieveFile } = require( '../../helpers' );

describe( 'Basemap component rendered', () => {

    before( async function() { 

        try {

            d3.select('.add-basemap-button').dispatch('click');


            let rasterImport = Hoot.ui.managePanel.basemaps.addBasemapModal;
            let fileIngest = rasterImport.fileIngest;
            let dT   = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
            file = await retrieveFile( 'base/test/data/RomanColosseum_WV2naturalcolor_clip.tif' );
            
            dT.items.add( file );

            fileIngest.node().files = dT.files;

            await fileIngest.dispatch('change');

            var rasterName = d3.select('#basemapName');

            rasterName.property('value',  'UnitTestImportBasemap')
                .dispatch('keyup');

            d3.select('#basemapAddBtn').dispatch('click');
          
        } catch (e) {

              JSON.stringify( e );
        }

    } );

    after( async () => {

        var basemaps = Hoot.ui.managePanel.basemaps.basemapTable.size();

        if ( basemaps >  0 ) {
            console.log( 'Deleting basemap: "UnitTestImportBasemap" ' );
            await Hoot.api.deleteBasemap('UnitTestImportBasemap');
        }
    } );  

    it( 'New basemap added to basemap table', done => {
        setTimeout( () => {
            var newBasemap = d3.select( '#util-basemaps span' );
            expect(newBasemap.text() ).to.be.eql( 'UnitTestImportBasemap' );
            done(); 
        }, 10000 );

    } );
    
  } );
