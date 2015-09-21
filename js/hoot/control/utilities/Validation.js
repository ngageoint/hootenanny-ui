Hoot.control.utilities.validation = function(context) {
	var hoot_control_utilities_validation = {};

    hoot_control_utilities_validation.validationPopup = function(srcName, callback) {

        var source = srcName;
        var d_form = [{
            label: 'Output Name',
            placeholder: 'Save As',
            type: 'ValidationName'
        }];

        // Replace this block of code with dialog template like 
        //var modalbg = context.hoot().control.createModalDialog(d_form); which still need to be 
        // implemented.
        
        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        var modalDiv = modalbg.append('div')
            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        var _form = modalDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Prepare For Validation')
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
            .attr('type', 'text')
            .attr('placeholder', function (field) {
                return field.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) {

            });

        var submitExp = modalDiv.append('div')
            .classed('form-field col12 center ', true);
        

        var btn = submitExp.append('span')
            .classed('round strong big loud dark center col10 margin1 point', true)
            .classed('inline row1 fl col10 pad1y', true)
            .text('Run')
            .on('click', function () {
                var spinDiv =  submitExp.append('div')
                    .classed('form-field col1 center valspinner', true);
                spinDiv.call(iD.ui.Spinner(context));
          
                var output = _form.select('.reset.ValidationName').value();

                if(output){
                    var reqParam = {};
                    reqParam.sourceMap = source;
                    reqParam.outputMap = output;

                    Hoot.model.REST('createValidationMap', reqParam, function (resp) {   
                        if(resp.status != 'complete') {
                            alert("Failed to create validation. See log for detail.");
                        } else {

                            context.hoot().model.layers.refresh(function(){
                                context.hoot().model.folders.refreshLinks(function(){
                                    context.hoot().model.import.updateTrees();
                                })
                            })
                        }                                  
                        modalbg.remove();
                        
                    });
                } else {
                    alert('Please specify valid Output Name!');
                    spinDiv.remove();
                }
     

            });

            
        
        return modalbg;
    };



	return hoot_control_utilities_validation;
}
