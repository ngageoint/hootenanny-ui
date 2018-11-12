/*******************************************************************************************************
 * File: layerColor.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/7/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe(" Add Dataset ", () => {
  it(" opens add layer form ", done => {
    d3.select("form#reference a.toggle-button").dispatch("click");

    setTimeout(() => {
      done();
    }, 1000);
  });
});

describe(" Active Color for New Layers ", function() {
  it(" default layer color is active ", function() {
    var dataColor = d3.selectAll("a.active._icon.check").attr("data-color");
    expect(dataColor).to.be.eql("violet");
  });

  it(" layer color can be changed ", done => {
    var newColor = d3
      .selectAll("a.block.float-left.keyline-right:nth-child(1)")
      .attr("data-color");
    d3.selectAll("a.block.float-left.keyline-right:nth-child(1)").dispatch(
      "click"
    );

    setTimeout(() => {
      expect(newColor).to.be.eql("gold");
      done();
    }, 500);
  });
});

describe(" Secondary Dataset Form Working ", () => {
  it(" closes primary dataset layer form ", done => {
    d3.select("form#reference a.toggle-button").dispatch("click");

    setTimeout(() => {
      done();
    }, 1000);
  });
  it(" opens secondary dataset layer form ", done => {
    d3.select("form#secondary a.toggle-button").dispatch("click");

    setTimeout(() => {
      done();
    }, 1000);
  });
});
