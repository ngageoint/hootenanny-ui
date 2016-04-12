/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.basemapdataset provides popup dialog for creating new basemap. It is invoked from
//  Hoot.view.utilities.basemapdataset view.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.basemapdataset = function(context) {
    var hoot_control_utilities_basemapdataset = {};

    hoot_control_utilities_basemapdataset.newBasemapPopup = function(callback) {
        var saveName = null;
        var d_form = [{
            label: 'Basemap Raster File',
            type: 'basemapfileImport',
            placeholder: 'Select File',
            icon: 'folder',
            readonly:'readonly'
        }, {
            label: 'Basemap Name',
            placeholder: 'Save As',
            type: 'BasemapName'
        }];
        // Modal background (Dark back ground)
        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);

        // Create form div
        var ingestDiv = modalbg.append('div')
            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        var _form = ingestDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Publish Basemap')
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                //modalbg.classed('hidden', true);
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
            .each(function(d){
                if(d.readonly){d3.select(this).attr('readonly',true);}
            })
            .attr('type', 'text')
            .attr('placeholder', function (field) {
                return field.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) {
                if (a.icon) {
                    d3.select(this.parentNode)
                        .append('span')
                        .classed('point keyline-left _icon folder pin-right pad0x pad0y', true)
                        .append('input')
                        .attr('id', 'basemapfileuploader')
                        .attr('type', 'file')
                        .attr('multiple', 'true')
                        .classed('point pin-top', true)
                        .style({
                            'text-indent': '-9999px',
                            'width': '31px'
                        })
                        .on('change', function () {
                            var fileNames = [];
                            for (var l = 0; l < document.getElementById('basemapfileuploader')
                                .files.length; l++) {
                                var curFile = document.getElementById('basemapfileuploader')
                                    .files[l];
                                var curFileName = curFile.name;

                                fileNames.push(curFileName);
                            }
                            _form.select('.reset.basemapfileImport').value(fileNames.join('; '));
                            var first = fileNames[0];
                            saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;

                        });
                }

            });

            var submitExp = ingestDiv.append('div')
            .classed('form-field col12 center ', true);
             submitExp.append('span')
            .classed('round strong big loud dark center col10 margin1 point', true)
            .classed('inline row1 fl col10 pad1y', true)
                .text('Publish')
                .on('click', function () {
                    var name = _form.select('.reset.BasemapName').value();
                    if(!name){
                        var files = document.getElementById('basemapfileuploader').files;
                        if(files.length > 0){
                            var fName = files[0].name;
                            var parts = fName.split(".");

                            for(var p=0; p<parts.length-1; p++){
                                if(name.length > 0){
                                    name += ".";
                                }
                                name += parts[p];
                            }



                        }
                    }

                    var found = _.find(context.hoot().view.utilities.basemaplist, function(o){
                        return (o.name == name);
                    });

                    if(found){
                        iD.ui.Alert('Base map with name "' + name + '" already exists. '
                                 + 'If no name is assigned please specify a name or'+
                                 ' if already specified please use different name.','warning',new Error().stack);
                    } else {
                        d3.select(this).text('Publishing...');
                        d3.select(this).style('pointer-events','none');
                        var spin = submitExp.insert('div',':first-child').classed('_icon _loading row1 col1 fr',true).attr('id', 'basemapimportspin');
                        context.hoot().model.basemapdataset.publishBasemap(_form,function(d){
                            callback(d);
                            modalbg.remove();
                        });
                    }



                });
        return modalbg;
    };



    return hoot_control_utilities_basemapdataset;
}