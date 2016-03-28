/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.basemapdataset is basemap view in Manage tab where it shows all ingested basemap in
//  table format and allows CRUD opertion on each basemaps.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.basemapdataset = function(context)
{
	var hoot_view_utilities_basemapdataset = {};

    hoot_view_utilities_basemapdataset.createContent = function(form){
        var mbFieldset = form.append('div')
        .classed('pad1y col12', true)
        .append('a')
        .attr('href', '#')
        .text('New Basemap')
        .classed('dark fl button loud pad2x big _icon plus', true)
        .on('click', function () {
            var bm = context.hoot().control.utilities.basemapdataset.newBasemapPopup(function(jobs){
                // We need this timer due to
                // 1 . basemap popup issues request and returns right away
                // 2. Service take time to start the process and create control file
                // 3. We are calling getlist before service was able to create control file.
                setTimeout(function () {
                    var bmDataset = d3.select('#basemapsdatasettable');
                    hoot_view_utilities_basemapdataset.populateBaseMapsDatasets(bmDataset);
                }, 2000);

            });

        });

        baseMapsFieldset = form.append('div')
        .attr('id','basemapsdatasettable')
            .classed('col12 fill-white small strong row10 overflow keyline-all', true)
            .call(hoot_view_utilities_basemapdataset.populateBaseMapsDatasets);

    };

    hoot_view_utilities_basemapdataset.addBasemapItem = function(bm){
      var newRes = {};
      newRes.name = bm.name;
      newRes.type = 'tms';
      newRes.projection = "mercator";
      newRes.template = location.origin + "/static/BASEMAP/" + bm.name + "/{zoom}/{x}/{y}.png";
      newRes.default = true;
      newRes.nocache = true;
      newRes.extent = bm.extent;

      context.background().addNewBackgroundResource(newRes);
      context.map().updateBackground();
    };

    hoot_view_utilities_basemapdataset.renderBaseMapsDataset = function(container, d) {
      var nodes = d3.select('#basemapsdatasettable').node().childNodes;
      if(nodes && nodes.length > 0){
        var nodeCnt = nodes.length;
          while(nodeCnt > 0){
            nodes[0].remove();
            nodeCnt = nodes.length;
          }
      }

      var enabled = true;
        var la = container.selectAll('span')
            .data(d)
            .enter();
        var la2 = la.append('div')
            .classed('col12 fill-white small keyline-bottom', true);
        var la3 = la2.append('span')
            .classed('text-left big col12 fill-white small hoverDiv2', true)

            .text(function (d) {
                return d.name;
            });
        la3.append('button')
            .classed('keyline-left fr _icon trash pad2 col1', true)
            .style('height', '100%')
            .on('click', function () {
              d3.event.stopPropagation();
                d3.event.preventDefault();
                var bmId = d3.select(this.parentNode).datum().name;
                var r = confirm("Are you sure you want to delete: " + bmId + "?");
                    if (r == false) {
                       return;
                    } 
              

              var bmTrashBtn = this;
              d3.json('/hoot-services/ingest/basemap/delete?NAME=' + bmId,
                function (error, data) {
                      if(error){
                    	  iD.ui.Alert("Delete failed.",'error',new Error().stack);
                      } else {
                        var bm;

                            for (var i = 0; i < context.hoot().view.utilities.basemaplist.length; i++) {
                                bm = context.hoot().view.utilities.basemaplist[i];
                                if (bm.name == data.name) {
                                  context.hoot().view.utilities.basemaplist.splice(i, 1);
                                    break;
                                }
                            }

                        context.background().removeBackgroundResource(data.name);
                        context.map().updateBackground();
                        d3.select(bmTrashBtn.parentNode).node().remove();
                      }

                });
            });

        la3.append('button')
            .classed('keyline-left fr _icon openeye pad2 col1', true)
            .style('height', '100%')
            .on('click', function (d) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                var data = {};
                data.name = d.name;

                var bm = _.find(context.hoot().view.utilities.basemaplist, function(o){
                    return (o.name == d.name);
                });
                var bmToggleBtn = this;
                if(d.status == 'disabled'){
                    Hoot.model.REST('enableBaseMap', data, function(resp){
                        if(resp.status == 'failed'){
                            if(resp.error){
                                context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                                return;
                            }
                        }

                        d3.select(bmToggleBtn).classed('keyline-left fr _icon closedeye pad2 col1', false);
                        d3.select(bmToggleBtn).classed('keyline-left fr _icon openeye pad2 col1', true);
                        bm.status="enabled";
                        hoot_view_utilities_basemapdataset.addBasemapItem(bm);
                    });
                } else if(d.status == 'enabled'){
                    //
                    Hoot.model.REST('disableBaseMap', data, function(resp){
                        if(resp.status == 'failed'){
                            if(resp.error){
                                context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                                return;
                            }
                        }
                        d3.select(bmToggleBtn).classed('keyline-left fr _icon openeye pad2 col1', false);
                        d3.select(bmToggleBtn).classed('keyline-left fr _icon closedeye pad2 col1', true);

                        bm.status="disabled";

                        context.background().removeBackgroundResource(bm.name);
                        context.map().updateBackground();
                    });
                }


            })
            .select(function (sel) {
                if(sel.jobid){
                    if(sel.status == 'processing'){
                        var currentRow = d3.select(this);
                        d3.select(this).classed('keyline-left fr _icon openeye pad2 col1', false);
                        d3.select(this).classed('keyline-left keyline-right pad1 row1  col1 fr',true).call(iD.ui.Spinner(context));

                        var stat = function (curJobId) {
                            Hoot.model.REST('jobStatusLegacy', curJobId, function (a) {
                                if (a.status !== 'running' || !a.status) {
                                    Hoot.model.REST.WarningHandler(a);

                                    clearInterval(bmUploadJobStatusTimer);
                                    currentRow.classed('keyline-left fr _icon closedeye pad2 col1', true);
                                    currentRow.selectAll('img').remove();

                                    // default to disabled
                                    var curBm = _.find(context.hoot().view.utilities.basemaplist, function(o){
                                        return (o.name == sel.name);
                                    });
                                    if(curBm){
                                        curBm.status = 'disabled';
                                    }
                                }
                            });
                        };
                        var status = function () {
                            stat(sel.jobid);
                        };
                        var bmUploadJobStatusTimer = setInterval(function () {
                            status();
                        }, iD.data.hootConfig.JobStatusQueryInterval);
                    } else if(sel.status == 'failed') {
                        d3.select(this).classed('keyline-left fr _icon openeye pad2 col1', false);
                        d3.select(this).classed('keyline-left fr _icon x pad2 col1', true);
                    } else if(sel.status == 'disabled') {
                        d3.select(this).classed('keyline-left fr _icon openeye pad2 col1', false);
                        d3.select(this).classed('keyline-left fr _icon closedeye pad2 col1', true);
                    } else if(sel.status == 'enabled') {
                        hoot_view_utilities_basemapdataset.addBasemapItem(sel);
                    }

                }
            });
    };

    hoot_view_utilities_basemapdataset.populateBaseMapsDatasets = function(container) {

        Hoot.model.REST('getBaseMapsList',
            function (d) {
                if(d.error){
                    context.hoot().view.utilities.errorlog.reportUIError(d.error);
                }
                context.hoot().view.utilities.basemaplist = d;
                hoot_view_utilities_basemapdataset.renderBaseMapsDataset(container, d);
            }
        );
    };



	return hoot_view_utilities_basemapdataset;
}