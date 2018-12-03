/*******************************************************************************************************
 * File: layerColor.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/26/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/



describe( 'Add Dataset', () => {
  it( 'Opens add layer form', done => {
    var referenceDataButton = d3.select('#reference a.toggle-button');
    referenceDataButton.dispatch('click');

    setTimeout(() => {
      expect(referenceDataButton.size() ).to.be.eql( 1 );
      done();
    }, 1000);
  } );
} );

describe( 'Active Color for New Layers', function() {
  it( 'Default layer color is active', function() {
    var dataColor = d3.selectAll('a.active._icon.check').attr('data-color');
    expect(dataColor).to.be.eql('violet');
  } );
  it( 'Layer color can be changed', done => {
    var newColor = d3.selectAll('a.block.float-left.keyline-right:nth-child(1)').attr('data-color');
    d3.selectAll('a.block.float-left.keyline-right:nth-child(1)').dispatch('click');
    setTimeout(() => {
      expect(newColor).to.be.eql('gold');
      done();
    }, 500);
  } );
} );

describe( 'Secondary Dataset Form Working', () => {
  it( 'Closes primary dataset layer form', done => {
    var referenceDataButton = d3.select('#reference a.toggle-button');
    referenceDataButton.dispatch('click');  
    setTimeout(() => {
      expect(referenceDataButton.size() ).to.be.eql( 1 );
      done();
    }, 1000);
  } );
  it( 'Opens secondary dataset layer form', done => {
    var secondaryDataButton = d3.select('#secondary a.toggle-button');
    secondaryDataButton.dispatch('click');

    setTimeout(() => {
      expect(secondaryDataButton.size() ).to.be.eql( 1 );
      done();
    }, 1000);
  } );
} );
