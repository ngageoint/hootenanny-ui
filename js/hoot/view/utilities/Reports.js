/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.reports is reports view in manage tab where it lists all reports generated during
// conflation/
//
//  NOTE: This feature has been disbaled till customer site setup issue has been resolved..
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.reports = function(context) {
	var hoot_view_utilities_reports = {};

    hoot_view_utilities_reports.createContent = function(form){

        hoot_view_utilities_reports.datasetcontainer = form.append('div')
            .classed('col12 fill-white small  row10 overflow keyline-all', true)
            .call(hoot_view_utilities_reports.populateReports);
    }
	hoot_view_utilities_reports.populateReports = function(container) {
            if(!container){
                container = hoot_view_utilities_reports.datasetcontainer;
            }
            Hoot.model.REST('getReports', function (d) {
                if(d.error){
                    context.hoot().view.utilities.errorlog.reportUIError(d.error);
                    return;
                }
                container.selectAll('div').remove();
                var tla = container.selectAll('div')
                    .data(d)
                    .enter();
                var tla2 = tla.append('div')
                    .classed('col12 fill-white small keyline-bottom', true);
                var tla3 = tla2.append('span')
                    .classed('text-left big col12 fill-white small hoverDiv2', true)
                    .append('a')
                    .text(function (d) {
                        if(d.DEFAULT == true){
                            return d.name + ': ' + d.description;
                        }
                        return d.name + ': ' + d.description;
                    })



                tla3.append('button')
                //.classed('keyline-left keyline-right fr _icon trash pad2 col1', true)
                .style('height', '100%')
                .on('click', function (n) {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    
                    var r = confirm("Are you sure you want to delete selected report?");
                    if (r == true) {

                    } else {
                        return;
                    }
                    

                    d3.select(this).classed('keyline-left fr _icon trash pad2 col1',false);
                    d3.select(this).classed('keyline-left keyline-right pad1 row1  col1 fr',true).call(iD.ui.Spinner(context));


                    var transTrashBtn = this;
                    
                    transTrashBtn.id = 'a' + n.id;

                    Hoot.model.REST('deleteReport', n.id, function (resp) {
                        if(resp.error){
                            context.hoot().view.utilities.errorlog.reportUIError(res.error);
                            hoot_view_utilities_reports.populateReports();
                            return;
                        }
                   
             
                        var curBtn = d3.select('#a' + resp.id)[0];
                        d3.select(curBtn[0].parentNode.parentNode)
                        .remove();
                        hoot_view_utilities_reports.populateReports();
                    });

                })
                .select(function (sel) {
                    d3.select(this).classed('keyline-left keyline-right fr _icon trash pad2 col1', true)

                });

                tla3.append('button')
                .classed('keyline-left fr _icon up pad2 col1', true)
                .style('height', '100%')
                .on('click', function (d) {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    context.hoot().control.utilities.reports.reportPopup(d);
                });



            });
        };


	return hoot_view_utilities_reports;
}