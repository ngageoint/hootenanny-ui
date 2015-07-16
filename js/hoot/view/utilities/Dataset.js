Hoot.view.utilities.dataset = function(context)
{
    var hoot_view_utilities_dataset = {};
    
    hoot_view_utilities_dataset.createContent = function(form){

        fieldset = form.append('div')
            .classed('pad1y pad2x keyline-bottom col12', true)
            .append('a')
            .attr('href', '#')
            .text('Add Dataset')
            .classed('dark fr button loud pad2x big _icon plus', true)
            .on('click', function () {
                //importData.classed('hidden', false);
                 Hoot.model.REST('getTranslations', function (d) {
                     if(d.error){
                         context.hoot().view.utilities.errorlog.reportUIError(d.error);
                         return;
                     }
                    context.hoot().control.utilities.dataset.importDataContainer(d);
                 });

            });
        fieldset = form.append('div')
        .attr('id','datasettable')
            .classed('col12 fill-white small strong row10 overflow', true)
            //.call(hoot_view_utilities_dataset.populateDatasets);
            .call(hoot_view_utilities_dataset.populateDatasetsSVG);

    };

    hoot_view_utilities_dataset.populateDatasetsSVG = function(container) {
    	context.hoot().control.utilities.folder.createFolderTree(container);
    }
    
    hoot_view_utilities_dataset.populateDatasets = function(container) {
        context.hoot().model.layers
            .refresh(function (d) {
              var enabled = true;
              container.selectAll('div').remove();
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
                // to reenable trash buttons remove quiet
                    .classed('keyline-left keyline-right fr _icon trash pad2 col1', true)
                    .style('height', '100%')
                    .on('click', function () {
                        d3.event.stopPropagation();
                        d3.event.preventDefault();
                       
                        if(!window.confirm("Are you sure you want to remove selected data?")){
                            return;
                        }
                        
                        var mapId = d3.select(this.parentNode).datum().name;
                        var exists = context.hoot().model.layers.getLayers()[mapId];
                        if(exists){
                            alert('Can not remove the layer in use.');
                            return;
                        }
                        this.disabled = true;

                      var mapId = d3.select(this.parentNode).datum().name;
                      var exists = context.hoot().model.layers.getLayers()[mapId];
                      if(exists){
                        alert('Can not remove the layer in use.');
                        return;
                      }
                      this.disabled = true;

                      d3.select(this).classed('keyline-left keyline-right fr _icon trash pad2 col1',false);
                      d3.select(this).classed('keyline-left keyline-right pad1 row1  col1 fr',true).call(iD.ui.Spinner(context));


                      var trashBtn = this;
                      d3.json('/hoot-services/osm/api/0.6/map/delete?mapId=' + mapId)
                        .header('Content-Type', 'text/plain')
                        .post("", function (error, data) {

                          var exportJobId = data.jobId;
                          trashBtn.id = 'a' + exportJobId;

                            var statusUrl = '/hoot-services/job/status/' + exportJobId;
                            var statusTimer = setInterval(function () {
                                d3.json(statusUrl, function (error, result) {
                                    if (result.status !== 'running') {
                                        Hoot.model.REST.WarningHandler(result);
                                        clearInterval(statusTimer);
                                        var btnId = result.jobId;
                                        var curBtn = d3.select('#a' + btnId)[0];
                                        d3.select(curBtn[0].parentNode.parentNode)
                                        .remove();
                                        context.hoot().model.layers.RefreshLayers();
                                    }
                                });
                            }, iD.data.hootConfig.JobStatusQueryInterval);

                        });
                    });
                la3.append('button')
                    .classed('keyline-left fr _icon export pad2 col1', true)
                    .style('height', '100%')
                    .on('click', function (d) {

                        d3.event.stopPropagation();
                        d3.event.preventDefault();

                        var mapid = context.hoot().model.layers.getmapIdByName(d.name);
                        Hoot.model.REST('getMapSize', mapid,function (sizeInfo) {
                //
                            if(sizeInfo.error){
                                return;
                            }
                            var expThreshold = 1*iD.data.hootConfig.export_size_threshold;
                            var totalSize = 1*sizeInfo.size_byte;

                            if(totalSize > expThreshold)
                            {
                                var thresholdInMb = Math.floor((1*expThreshold)/1000000);
                                var res = window.confirm("Export data size is greater than " + thresholdInMb 
                                    +"MB and export may encounter problem." +
                                    " Do you wish to continue?");
                                if(res === false) {
                                    
                                    return;
                                }
                            }

                            Hoot.model.REST('getTranslations', function (trans) {
                                if(trans.error){
                                    context.hoot().view.utilities.errorlog.reportUIError(trans.error);
                                    return;
                                }
                                exportData = context.hoot().control.utilities.dataset.exportDataContainer(d, trans);
                            });
                        });


                        

                    });
            });
    }




    return hoot_view_utilities_dataset;
}


