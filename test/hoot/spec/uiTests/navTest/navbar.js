/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/9/18 jack.grossman@radiantsolutions.com
 *******************************************************************************************************/

describe(" Hoot.navbar ", () => {
  it(" All navbar options are available ", done => {
    d3.select("nav#navbar div.nav-item div.menu-button").dispatch("click");
    setTimeout(() => {
      var datasets = d3
        .selectAll(
          "div#manage-panel div#manage-datasets.panel-body.fill-light.active"
        )
        .attr("id");
      var basemaps = d3
        .selectAll("div#manage-panel div#util-basemaps.panel-body.fill-light")
        .attr("id");
      var translations = d3
        .selectAll(
          "div#manage-panel div#util-translations.panel-body.fill-light"
        )
        .attr("id");
      var translationAsst = d3
        .selectAll(
          "div#manage-panel div#manage-translations-assistant.panel-body.fill-light"
        )
        .attr("id");
      var reviewBookMrk = d3
        .selectAll(
          " div#manage-panel div#util-review-bookmarks.panel-body.fill-light"
        )
        .attr("id");
      expect(datasets).to.be.eql("manage-datasets");
      expect(basemaps).to.be.eql("util-basemaps");
      expect(translations).to.be.eql("util-translations");
      expect(translationAsst).to.be.eql("manage-translations-assistant");
      expect(reviewBookMrk).to.be.eql("util-review-bookmarks");
      done();
    }, 500);
  });
});

describe(" Dataset component working ", () => {
  it(" Import Single ", done => {
    var importSingle = d3
      .selectAll("#manage-datasets  div  div.dataset-buttons.flex  button")
      .text();
    expect(importSingle).to.be.eql("play_for_workImport Single");
    done();
  });

  it(" Import Multiple ", done => {
    var importMultiple = d3
      .selectAll(
        "#manage-datasets  div  div.dataset-buttons.flex  button:nth-child(2)"
      )
      .text();
    expect(importMultiple).to.be.eql("move_to_inboxImport Multiple");
    done();
  });

  it(" Add Folder ", done => {
    var addFolder = d3
      .selectAll(
        "#manage-datasets  div  div.dataset-buttons.flex  button:nth-child(3)"
      )
      .text();
    expect(addFolder).to.be.eql("create_new_folderAdd Folder");
    done();
  });

  it(" Refresh Dataset ", done => {
    var refreshDataset = d3
      .selectAll(
        "#manage-datasets  div  div.dataset-buttons.flex  button:nth-child(4)"
      )
      .text();
    expect(refreshDataset).to.be.eql("refreshRefresh Datasets");
    done();
  });
});

describe(" Basemap component rendered ", () => {
  it(" Activates basemap selector ", done => {
    d3.select("#manage-sidebar-menu div.tab-header:nth-child(3)").dispatch(
      "click"
    );
    setTimeout(() => {
      var selectBasemap = d3.selectAll("#util-basemaps  div  button").text();
      expect(selectBasemap).to.be.eql("Add New Basemaps");
      done();
    }, 500);
  });
});

describe(" Translation component rendered ", () => {
  it(" Activates translations selector ", done => {
    d3.select("#manage-sidebar-menu div.tab-header:nth-child(4)").dispatch(
      "click"
    );
    setTimeout(() => {
      var selectTranslations = d3
        .selectAll("#util-translations  div  button")
        .text();
      expect(selectTranslations).to.be.eql("Add New Translations");
      done();
    }, 500);
  });
});

describe(" Translation Assistant rendered ", () => {
  it(" Can upload files ", done => {
    d3.select("#manage-sidebar-menu div.tab-header:nth-child(5)").dispatch(
      "click"
    );
    setTimeout(() => {
      var selectTranslationsFiles = d3
        .selectAll(
          "#manage-translations-assistant  div  form div.button-row.pad2 button:nth-child(1)"
        )
        .text();
      expect(selectTranslationsFiles).to.be.eql("play_for_workUpload File(s)");
      done();
    }, 500);
  });
  it(" Can upload folder ", done => {
    setTimeout(() => {
      var selectTranslationsFolder = d3
        .selectAll(
          "#manage-translations-assistant  div  form div.button-row.pad2 button:nth-child(2)"
        )
        .text();
      expect(selectTranslationsFolder).to.be.eql("move_to_inboxUpload Folder");
      done();
    }, 500);
  });
});

describe(" Review Bookmarks ", () => {
  it(" Items per page tab ", done => {
    d3.select("#manage-sidebar-menu div.tab-header:nth-child(6)").dispatch(
      "click"
    );
    setTimeout(() => {
      var itemsPerPage = d3
        .selectAll(
          "#util-review-bookmarks  div  div.bookmark-filter-container  div:nth-child(1)"
        )
        .text();
      expect(itemsPerPage).to.be.eql("Items Per Page");
      done();
    }, 500);
  });
  it(" Sort by tab ", done => {
    setTimeout(() => {
      var sortByTab = d3
        .selectAll(
          "#util-review-bookmarks  div  div.bookmark-filter-container  div:nth-child(2)"
        )
        .text();
      expect(sortByTab).to.be.eql("Sort By");
      done();
    }, 500);
  });
  it(" Filter by creator tab ", done => {
    setTimeout(() => {
      var sortCreators = d3
        .selectAll(
          "#util-review-bookmarks  div  div.bookmark-filter-container  div:nth-child(3)"
        )
        .text();
      expect(sortCreators).to.be.eql("");
      done();
    }, 500);
  });
  it(" Filter by layer name tab ", done => {
    setTimeout(() => {
      var sortLayers = d3
        .selectAll(
          "#util-review-bookmarks  div  div.bookmark-filter-container  div:nth-child(4)"
        )
        .text();
      expect(sortLayers).to.be.eql("Filter By Layer Name");
      done();
    }, 500);
  });
});
