/** ****************************************************************************************************
 * File: addBasemap.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

const { retrieveFile } = require( '../../helpers' );

describe( 'Basemap component rendered', () => {

    let raster,
        rasterImport;
    
    it( 'opens import single basemap layer', done => {

        d3.select( '.add-basemap-button' ).dispatch( 'click' );

        setTimeout( () => {
            var newForm = d3.select( '#basemaps-add-form' ).attr( 'class' );
            expect(newForm).to.include( 'visible' );
            done(); 
        }, 2000 );

    } );

    it( 'adds a new raster file to the basemap table', async () => {
        raster    = Hoot.ui.managePanel.basemaps;
        rasterImport = Hoot.ui.managePanel.basemaps.addBasemapModal;

        let fileInput       = rasterImport.fileInput,
            nameInput       = rasterImport.nameInput,
            fileIngest      = rasterImport.fileIngest,
            submitButton    = rasterImport.submitButton;

        expect( fileInput.property( 'disabled' ) ).to.be.false;
        expect( submitButton.property( 'disabled' ) ).to.be.true;

        let dT   = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
            file = await retrieveFile( 'base/test/data/RomanColosseum_WV2naturalcolor_clip.tif' );

        dT.items.add( file );

        fileIngest.node().files = dT.files;
        console.log( 'Adding basemap' );

        await fileIngest.dispatch( 'change' );

        expect( fileInput.property( 'value' ) ).to.equal( 'RomanColosseum_WV2naturalcolor_clip' );
        expect( nameInput.property( 'value' ) ).to.equal( 'RomanColosseum_WV2naturalcolor_clip' );
        expect( submitButton.property( 'disabled' ) ).to.be.false;

        // check for empty value in specific fields
        nameInput
            .property( 'value', '' )
            .dispatch( 'keyup' );

        expect( nameInput.classed( 'invalid' ) ).to.be.true;
        expect( submitButton.property( 'disabled' ) ).to.be.true;

        // update layer name to signify that this layer was created during unit tests &
        // check for correct values in all fields
        nameInput
            .property( 'value', 'UnitTestImportBasemap' )
            .dispatch( 'keyup' );

        expect( nameInput.classed( 'invalid' ) ).to.be.false;
        expect( submitButton.property( 'disabled' ) ).to.be.false;
    } );
    it( 'imports a new raster ', async () => {

        let importSubmit = rasterImport.submitButton;

        expect( importSubmit.select( 'span' ).text() ).to.include( 'Publish' );
        expect( Hoot.layers.findBy( 'name', 'UnitTestImportBasemap' ) ).to.be.undefined;

        importSubmit.dispatch( 'click' );

        expect( importSubmit.select( 'span' ).text() ).to.include( 'Uploading...' );

        setTimeout( () => {

            var newBasemap = d3.select( '.basemap-table' ).select( 'span' );
            expect( newBasemap.text() ).to.be.eql( 'UnitTestImportBasemap' );

            d3.select('button.keyline-left._icon.closedeye').dispatch('click');

            var addedToBackgroundList = d3.selectAll('ul.layer-list.layer-background-list li label span')
            .filter( function(d) { return d3.select(this).text() === 'UnitTestImportBasemap'; } );
            
            expect( addedToBackgroundList.text().to.eql( 'UnitTestImportBasemap') );
            
        }, 20000 );

        after( async () => {
            var basemaps = await Hoot.api.getBasemaps();
            if ( basemaps.findIndex( function(d) { return d.name === 'UnitTestImportBasemap'; } ) > -1 ) {
                console.log( 'Deleting basemap: "UnitTestImportBasemap"');
                await Hoot.api.deleteBasemap('UnitTestImportBasemap')
                    .then( () => Hoot.ui.managePanel.basemaps.loadBasemaps());
            }
        } );    
        
    } );

  } );
