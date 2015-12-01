Hoot.view.utilities.wfsdataset = function(context)
{
	var hoot_view_utilities_wfsdataset = {};

    hoot_view_utilities_wfsdataset.createContent = function(container){
        var wfsFieldset = container.append('div')
        .attr('id','wfsdatasettable')
            .classed('col12 fill-white small strong row10 overflow keyline-all', true)
            .call(hoot_view_utilities_wfsdataset.populateWFSDatasets);
    }

    hoot_view_utilities_wfsdataset.populateWFSDatasets = function(container) {


      Hoot.model.REST('getWFSList',
        function (d) {
                if(d.error){
                    context.hoot().view.utilities.errorlog.reportUIError(d.error);
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
                        return d.id;
                    });
                la3.append('button')
                .classed('keyline-left fr _icon trash pad2 col1', true)
                .style('height', '100%')
                .on('click', function () {
                  d3.event.stopPropagation();
                    d3.event.preventDefault();
                    var wfsId = d3.select(this.parentNode).datum().id;
                    var r = confirm("Are you sure you want to delete :" + wfsId  + "?");
                    if (r == false) {
                       return;
                    } 
                    

                    var wfsTrashBtn = this;
                    d3.json('/hoot-services/job/export/wfs/remove/' + wfsId,
                            function (error, data) {
                                if(error){
                                	iD.ui.Alert(error.responseText,'error');
                                } else {
                                  d3.select(wfsTrashBtn.parentNode).node().remove();
                                }

                            }
                    );
                });
                la3.append('button')
                .classed('keyline-left fr _icon up pad2 col1', true)
                .style('height', '100%')
                .on('click', function (d) {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    context.hoot().control.utilities.wfsdataset.wfsDetailPopup(d);
                });
            });
    }


	return hoot_view_utilities_wfsdataset;
}