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

// describe(" loading display working ", async () => {
//   it(" checks visible loading interaction ", function() {
//     var loading = d3.selectAll("span.strong.padx1").text("Loading");
//     console.log(loading);
//     expect(loading).to.be.eql("Loading");
//   });
// });

// describe(" checks for layer added to map ", function() {
//   it(" confirms layer was added to map ", {});
// });

//   it("checks for style color change", done => {
//     expect(d3.select(".block").size()).to.equal(0);

//     d3.select(".dataset-action-button:first-child").dispatch("click");

//     setTimeout(() => {
//       expect(d3.select("#datasets-import-form").size()).to.equal(1);
//       done();
//     }, 200);
//   });
