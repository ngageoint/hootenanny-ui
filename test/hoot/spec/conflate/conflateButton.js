/*******************************************************************************************************
 * File: conflateLayer.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 12/17/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

const _ = require( 'lodash' );

const { generateOsmLayerParams } = require( '../../helpers' );

describe( 'Conflate button interaction', () => {

    before( async function() { 

        this.timeout( 10000 );

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
        if ( Hoot.layers.findBy( 'name', 'UnitTestLayer0' ) && Hoot.layers.findBy( 'name', 'UnitTestLayer1') ) {
            console.log( 'Deleting layer: "UnitTestLayer0" & "UnitTestLayer1" ');
            await Hoot.api.deleteLayer( 'UnitTestLayer0' );
            await Hoot.api.deleteLayer( 'UnitTestLayer1' );
        }
    } );

    it( 'Selects a Primary Layer', done => {

        d3.select('#reference a.toggle-button').dispatch('click');

        setTimeout(() => {
            var availableLayers = d3.select('div.inner-wrapper').attr('class');
            expect(availableLayers).to.include( 'visible' );
            done();
        }, 2000);
    } );
    it( 'Selects Primary dataset', done => {

        d3.select('#add-ref-table g[data-name="UnitTestLayer0"]').dispatch('click');
        d3.select('#add-ref-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');

        setTimeout(() => {
            var primaryData = d3.select('#reference').attr('data-name');
            expect(primaryData).to.be.eql('UnitTestLayer0');
            done();
        }, 2500);
    } );
    it ( 'Conflate button IS NOT visible ' , done => {

        setTimeout( () => {
            expect( d3.select('#conflate').size() ).to.be.eql( 0 );
            done();
        }, 1000 );
    } );
    it( 'Selects Reference dataset', done => {

        d3.select('#secondary a.toggle-button').dispatch('click');
        d3.select('#add-secondary-table g[data-name="UnitTestLayer1"]').dispatch('click');
        d3.select('#add-secondary-table').dispatch('click');
        d3.select('button.add-layer').dispatch('click');

        setTimeout( () => {
            var secondaryData = d3.select('#secondary').attr('data-name');
            expect(secondaryData).to.be.eql('UnitTestLayer1');
            done();
        }, 3000);
    });
    it ( 'Conflate button IS visible ' , done => {

        setTimeout( () => {
            expect( d3.select('#conflate').size() ).to.be.eql( 1 );
            done();
        }, 3000 );

    } );
    it ( 'Deletes a layer', done => {

        d3.select( '#secondary button.delete-button' ).dispatch( 'click' );
        d3.select( 'div.confirm-actions button.primary' ).dispatch( 'click' );

        setTimeout( () => {
            expect(d3.select( '#secondary' ).text() ).to.include( 'Add Secondary Datasets' );
            done();
        }, 1000 );
    } );
    it ( 'Conflate button IS NOT visible ' , done => {

        setTimeout( () => {
            expect( d3.select('#conflate').size() ).to.be.eql( 0 );
            done();
        }, 1000 );
    } );
} );