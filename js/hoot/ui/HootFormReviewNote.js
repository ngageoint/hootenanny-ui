Hoot.ui.hootformreviewnote = function () 
{
    var _events = d3.dispatch();
    var _instance = {};


    _instance.createForm = function(containerId, formMetaData) {
        var form;
        try{

            var btnMeta = formMetaData['button'];
            var formMeta = formMetaData['form'];
            var formTitle = formMetaData['title'];
            if(!formMeta) {
                throw 'Failed to create UI. Invalid form meta data.';
            }

            if(!formTitle){
                formTitle = 'Hootenanny Form';
            }

            var container = d3.select('#' + containerId);
            var formDiv = _createFormDiv(container);
            form =  _createForm(container, formDiv, formTitle)
            var fieldset = _createFieldSet(form, formMeta);
            _createButtons(btnMeta, formDiv); 

        } catch (error) {
            console.error(error);
        }
    
        return form;
    }



    var _createFormDiv = function(container) {
        var bufferForDiv = container.append('div')
                .classed('pad1y col12', true);
        return bufferForDiv.append('div')
                .classed('fill-white round keyline-all col12', true);
    }

    var _createForm = function(container, formDiv, formTitle) { 

        var form = formDiv.append('form');
        form.classed('round importableLayer', true)
                .append('div')
                .classed('big pad0y keyline-bottom', true)
                .append('h4')
                .text(formTitle)
                .append('div')
                .classed('fr _icon x point', true)
                .on('click', function () {
                    container.remove();
                });
        return form;
    }

    var _createFieldSet = function(form, formMeta) {
        var fieldset = form.append('fieldset')
                .selectAll('.form-field')
                .data(formMeta);


        fieldset.enter()
                .append('div')
                
                .select(function(a){
                

                    var field = d3.select(this);

                    // add header and label
                    field
                    .classed('form-field fill-white small keyline-all round space-bottom1', true)
                    .style('height','120px');


                    if(a.inputtype == 'textarea') {

                        var fieldDiv = field
                        .append('div')
                        .classed('contain', true);

                        var inputField = fieldDiv
                        .append('textarea')
                        .attr('placeholder', function (field) {
                            return field.placeholder;
                        })
                        .classed('col12 overflow', true)
                        .style('display','block')
                        .style('height','120px')
                        .text(a.inputText);

                        if(a.readonly === true){
                            inputField.attr('readonly','readonly');
                        }
                        if(a.id) {
                            inputField.attr('id', a.id);
                        }
                    }
                    

                });


        return fieldset;
    }

    var _createButtons = function(btnMeta, formDiv) {
        _.each(btnMeta, function(m){

                
                var onClick = function(){};
                if(m.onclick){
                    onClick = m.onclick;
                }
                var btnContainer = formDiv.append('div')
                .classed('form-field col12 pad1y pad1x ', true);
                 btnContainer.append('span')
                .classed('round strong big loud dark center col2 margin1 point', true)
                .classed('inline row1 fr pad1y', true)
                .text(m.text)
                .on('click', onClick);


            });       
    }


    return d3.rebind(_instance, _events, 'on');
}