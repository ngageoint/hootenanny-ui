/** ****************************************************************************************************
 * File: reviewMode.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 12/17/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

const { generateOsmLayerParams } = require( '../../helpers' );


describe( 'Entered Review Mode', () => {


    before( async function() { 

        this.timeout( 20000 );

        try {

            let generateCount = 2,
            layerOneParams = await generateOsmLayerParams( [ ...Array( generateCount ).keys() ] );
            
            await Promise.all( _.map( layerOneParams, params => Hoot.api.uploadDataset( params ) ) );
            
            d3.select('#manage-datasets div div.dataset-buttons.flex button:nth-child(4)').dispatch('click');
          
        } catch (e) {

             JSON.stringify( e );
        }

    } );

    after( async () => {
        if ( Hoot.layers.allLayers.length > 23 ) {
            console.log( 'Deleting layer(s): ConflationTestOne, ConflationTestTwo and Merged_ConflationTest ');

            await Hoot.api.deleteLayer( 'UnitTestLayer0' );
            await Hoot.api.deleteLayer( 'UnitTestLayer1' );
            var conflatedLayers = Hoot.layers.findBy( 'size', 311296 );
            await Hoot.api.deleteLayer( conflatedLayers.name, 0 );
        }
    } );

    it( 'Selects a Primary Layer', done => {

        d3.select('#reference a.toggle-button').dispatch('click');

        setTimeout(() => {
            var availableLayers = d3.select('div.inner-wrapper').attr('class');
            expect(availableLayers).to.include( 'visible' );
            done();
        }, 5000);
    } );
    it( 'Selects Primary dataset', done => {
        d3.select('#add-ref-table g[data-name="UnitTestLayer0"]').dispatch('click');
        d3.select('#add-ref-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var primaryData = d3.select('#reference').attr('data-name');
            expect(primaryData).to.be.eql('UnitTestLayer0');
            done();
        }, 25000);
    } );
    it( 'Selects Reference dataset', done => {
        d3.select('#secondary a.toggle-button').dispatch('click');
        d3.select('#add-secondary-table g[data-name="UnitTestLayer1"]').dispatch('click');
        d3.select('#add-secondary-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');
        setTimeout(() => {
            var secondaryData = d3.select('#secondary').attr('data-name');
            expect(secondaryData).to.be.eql('UnitTestLayer1');
            done();
        }, 15000);
    });
    it( 'Conflating layers', done => {
        d3.select('#conflate').dispatch('click');
        d3.select('button.button.dark').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#conflate').size() ).to.eql( 1 );
            done();
        }, 5000);
    } );
    it( 'Layers merged, alert window displayed', done => {
        d3.select('div.confirm-actions button.primary').dispatch('click');

        setTimeout(() => {
            var reviewWindow = d3.select('div.contain hoot-menu fill-white round modal');
            expect(reviewWindow.size() ).to.be.equal( 0 );
            var conflating = d3.select('#conflate').attr('data-name');
            expect(conflating).to.include('Merged');
            done();
        });
    }, 25000);
    it ( 'Selects next reivew without email', done => {
        var bookmarks = ['Review Test', 'Testing Reviews', ''];
        d3.selectAll('form input.text-input')
            .each(function( d, i ) {
                d3.select(this).property( 'value', bookmarks[i] );
            });
        d3.select('#bookmarkNote').property( 'value', 'Hey here are some fun notes' );
        d3.select('#bookmarkSubmitButton').property('disabled', false);
        d3.select('#bookmarkSubmitButton').dispatch('click');
        setTimeout(() => {
            expect(d3.select('#bookmark-review-form').size() ).to.be.eql( 0 );
            done();
        }, 5000);
    } );
});