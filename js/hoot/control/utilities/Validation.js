/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.validation provide input dialog for HGIS prepare validation feature.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.validation = function(context) {
    var hoot_control_utilities_validation = {};

    hoot_control_utilities_validation.validationPopup = function(srcName) {

        var source = srcName;
        var d_form = [{
            label: 'Output Name',
            placeholder: 'Save As',
            type: 'ValidationName'
        }];



        var d_btn = {
            'label' : 'Run',
            'action' : function(formContainer, btnContainer, form){
                var output = form.select('.reset.ValidationName').value();

                //Check output validation name for special characters
                try{
                    if(output !==''){
                        var resp = context.hoot().checkForUnallowedChar(output);
                        if(resp !== true){
                            iD.ui.Alert(resp,'warning',new Error().stack);
                            return;
                        }
                    }
                } catch (e) {
                    // NOTE: handle exception
                }

             // spinner
                var spinDiv =  btnContainer.append('div')
                    .classed('form-field col1 center valspinner', true);
                spinDiv.call(iD.ui.Spinner(context));

                if(output){
                    var reqParam = {};
                    reqParam.sourceMap = source;
                    reqParam.outputMap = output;

                    Hoot.model.REST('createValidationMap', reqParam, function (resp) {
                        if(resp.status !== 'complete') {
                            iD.ui.Alert('Failed to create validation. See log for detail.','warning',new Error().stack);
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
        d_container.label = 'Prepare For Validation';
        var modalbg = context.hoot().control.createModalDialog(context, d_container, d_form, d_btn);



        return modalbg;
    };



    return hoot_control_utilities_validation;
};
