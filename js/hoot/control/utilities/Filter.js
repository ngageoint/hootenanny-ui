/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.filter provides input dialog for Filter non-HGIS poi feature.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.filter = function(context) {
    var hoot_control_utilities_filter = {};

    hoot_control_utilities_filter.filterPopup = function(srcName, callback) {

        var source = srcName;
        var d_form = [{
            label: 'Output Name',
            placeholder: 'Save As',
            type: 'FilterName'
        }];

        var d_btn = {
            'label' : 'Run',
            'action' : function(formContainer, btnContainer, form){
                // spinner
                var spinDiv =  btnContainer.append('div')
                    .classed('form-field col1 center filspinner', true);
                spinDiv.call(iD.ui.Spinner(context));

                var output = form.select('.reset.FilterName').value();

                if(output){
                    var reqParam = {};
                    reqParam.source = source;
                    reqParam.output = output;

                    Hoot.model.REST('createFilteredMap', reqParam, function (resp) {
                        if(resp.status !== 'complete') {
                            iD.ui.Alert('Failed to create filtered layer. See log for detail.','warning',new Error().stack);
                        } else {
                            // refresh both folder and layer list
                            context.hoot().model.layers.refresh(function(){
                                context.hoot().model.folders.refreshLinks(function(){
                                    context.hoot().model.import.updateTrees();
                                });
                            });
                        }
                        formContainer.remove();

                    });
                } else {
                    iD.ui.Alert('Please specify valid Output Name!','warning',new Error().stack);
                    spinDiv.remove();
                }
            }
        };

        var d_container = {};
        d_container.label = 'Filtered POI';
        var modalbg = context.hoot().control.createModalDialog(context, d_container, d_form, d_btn);



        return modalbg;
    };



    return hoot_control_utilities_filter;
};
