Hoot.control.utilities.reports = function(context) {
	var hoot_control_utilities_reports = {};

    hoot_control_utilities_reports.reportPopup = function (dataset) {


        var d_form = [{
            label: 'Output Name',
            type: 'reportExportOutputName',
            placeholder: dataset.name + ".pdf"
        }];
        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        var formContainerDiv = modalbg.append('div')
            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        var _form = formContainerDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text(dataset.name)
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                modalbg.remove();
            });
        var fieldset = _form.append('fieldset')
            .selectAll('.form-field')
            .data(d_form)
            ;
        fieldset.enter()
            .append('div')
            .classed('form-field fill-white small keyline-all round space-bottom1', true)
            .append('label')
            .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
            .text(function (d) {
                return d.label;
            });
        fieldset.append('div')
            .classed('contain', true)
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', function (field) {
                return field.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) { });

        var submitExp = formContainerDiv.append('div')
        .classed('form-field col12 center ', true);
         submitExp.append('span')
        .classed('round strong big loud dark center col10 margin1 point', true)
        .classed('inline row1 fl col10 pad1y', true)
            .text('Download')
            .on('click', function () {
                var outname = _form.select('.reset.reportExportOutputName').value();
                var defaultName = _form.select('.reset.reportExportOutputName').attr('placeholder');
                if(!outname){
                    outname = defaultName;
                }
                var req = {};
                req.outputname = outname;
                req.id = dataset.id;
                Hoot.model.REST('downloadReport', req, function(){

                });
                modalbg.remove();
            });

        return modalbg;

    };



	return hoot_control_utilities_reports;
}