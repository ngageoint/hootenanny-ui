/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.wfsdataset provides dialog which contains detail information on ingested WFS layer.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*Hoot.control.utilities.wfsdataset = function() {
    var hoot_control_utilities_wfsdataset = {};

    hoot_control_utilities_wfsdataset.wfsDetailPopup = function (e) {

      var capaUrl = location.origin + '/hoot-services/ogc/' +
        e.id + '?service=WFS&version=1.1.0&request=GetCapabilities';

        var d_form = [{
            label: 'WFS Resources Url',
            type: 'wfsfileExportOutputName',
            value: capaUrl
        }];
        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        var ingestDiv = modalbg.append('div')
            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        var _form = ingestDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text(e.id)
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                modalbg.remove();
            });
        var fieldset = _form.append('fieldset')
            .selectAll('.form-field')
            .data(d_form);
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
            .attr('value', function (field) {
                return field.value;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            });

    };



    return hoot_control_utilities_wfsdataset;
};*/