////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.advancedoptions provides advanced options dialog using external rules file.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//      15 Apr. 2016 eslint updates -- Sisskind
//      17 June 2016 replaced Advanced Conflation with Custom (ref type)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////



Hoot.control.conflate.advancedoptions = function (context, parent) {

    var _events = d3.dispatch();
    var _instance = {};
    var _modalBackground;
    var containerDiv;


    _instance.fieldsgenerator = Hoot.control.conflate.advancedoptions.fieldsgenerator();
    _instance.fieldsretriever = Hoot.control.conflate.advancedoptions.fieldsretriever();
    _instance.selectiondisplay = Hoot.control.conflate.advancedoptions.selectiondisplay();
    _instance.selectionretriever = Hoot.control.conflate.advancedoptions.selectionretriever();
    _instance.fieldsetlogic = Hoot.control.conflate.advancedoptions.fieldsetlogic();

    _instance.reset = function(){
        _instance.fieldsgenerator = Hoot.control.conflate.advancedoptions.fieldsgenerator();
        _instance.fieldsretriever = Hoot.control.conflate.advancedoptions.fieldsretriever();
        _instance.selectiondisplay = Hoot.control.conflate.advancedoptions.selectiondisplay();
        _instance.selectionretriever = Hoot.control.conflate.advancedoptions.selectionretriever();
        _instance.fieldsetlogic = Hoot.control.conflate.advancedoptions.fieldsetlogic();
    };


    /**
    * @desc Creates advanced options dialog
    **/
    _instance.activate = function () {
        try{
            var advancedOptionsEvents = d3.dispatch('exitadvopts');

            if(parent.confAdvOptionsFields==null){
                if(d3.selectAll('.reset.ConfType').value()===parent.lastAdvSettingsText){
                    parent.confAdvOptionsFields = parent.lastAdvFields;
                } else {
                    parent.confAdvOptionsFields = _instance.fieldsretriever.getDefaultFields();
                }
            }

            var fieldsMeta = _instance.fieldsgenerator.generateFields(parent.confAdvOptionsFields);

            var containerForm = _createContainerForm(advancedOptionsEvents);

            var fieldset = _createFieldSets(containerForm, fieldsMeta);

            _markDefaultFields(fieldset);

            _createApplyBtn(containerForm);

            _createCancelBtn(containerForm);

             _createViewValuesLnkBtn(containerForm);

             return d3.rebind(containerDiv, advancedOptionsEvents, 'on');
        } catch(err){
            context.hoot().view.utilities.errorlog.reportUIError(err,null);
            return null;
        }
    };




    /**
    * @desc Logic for opening/closing advanced options form
    * @param frmVis - visibility switch
    **/
    _instance.advOpsFormEvent = function(frmVis){
        if(frmVis){
            d3.select('#confAdvOptsLnk').text('◄');
        } else {
            d3.select('#confAdvOptsLnk').text('►');
        }
        d3.select('#sidebar2').selectAll('input').property('disabled',frmVis);
    };


    /**
    * @desc Logic for opening/closing advanced options form
    * @param frmVis - visibility switch
    **/
    _instance.onCustomConflationFormError = function(){
        iD.ui.Alert('An error occurred while trying to open a custom conflation window. If this problem persists, default values will be used for conflation based on selected type.','error');
        parent.confAdvOptsDlg = null;
        parent.confAdvValsDlg = null;
        d3.select('#content').selectAll('div .custom-conflation').remove();
        d3.select('#content').selectAll('div .fill-darken3').remove();
        _instance.advOpsFormEvent(false);
    };


    /**
    * @desc Handler for multilist item click event
    * @param selField - Selected field
    **/
    _instance.onChangeMultiList = function(selField){
        var enableField = null;
         _.each(selField.node().children, function(c){
            var isSel = d3.select(c).node().selected;
            if(isSel === true){
                var sel = d3.select(c).value();

                _.each(iD.data.hootConfAdvOps, function(mt){
                    if(('ml' + mt.name) === selField.node().id){
                        if(mt.dependents){
                            _.each(mt.dependents, function(dep){
                                if(sel === dep.value){
                                    enableField = dep.name;
                                   // d3.select('#' + dep.name + '_container').classed('hidden', false);
                                   // d3.select('.reset.' + dep.name).classed('hidden', false);
                                } else {
                                    d3.select('#' + dep.name + '_container').classed('hidden', true);
                                    d3.select('.reset.' + dep.name).classed('hidden', true);
                                }
                            });
                        }
                    }
                });
            }
         });

        if(enableField){
            d3.select('#' + enableField + '_container').classed('hidden', false);
            d3.select('.reset.' + enableField).classed('hidden', false);
        }
    };



    /**
    * @desc Creates advanced options dialog container
    * @param advancedOptionsEvents - Events object
    **/
    var _createContainerForm = function(advancedOptionsEvents) {
        _modalBackground = d3.select('#content') //body
            .append('div')
            .attr('id', 'modalBackground')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true)
            .style('z-index','1');
        containerDiv = d3.select('#sidebar').append('div')
            .attr('id','CustomConflationForm')
            .classed('fillL map-overlay col4 custom-conflation',true)
            .style('margin-left', function(){
                return d3.select('#sidebar').node().getBoundingClientRect().width + 'px';
            }); //'contain col4 pad1 fill-white round modal'
        var containerForm = containerDiv.append('form');
        containerForm.classed('round space-bottom1', true)
            .append('div')
            .classed('big pad1y pad1x keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Advanced Conflation Options')
            .append('div')
            .classed('fr _icon x point', true)
            .attr('id','CloseCustomConflationFormBtn')
            .on('click', function () {
                //modalbg.remove();
                //modalbg.classed('hidden', true);

                if (window.confirm('Exit will remove any previously selected advanced options. Are you sure you want to exit?')){
                    advancedOptionsEvents.exitadvopts();
                }

            });

        return containerForm;
    };

    /**
    * @desc Creates advanced options dialog fieldset
    * @param containerForm - Container element
    * @param fieldsMeta - fieldset meta data
    **/
    var _createFieldSets = function(containerForm, fieldsMeta) {
        var fieldsContainer = containerForm.append('div')
            .classed('keyline-all round space-bottom1 fields-container', true);

        var fieldset = fieldsContainer.append('fieldset')
            //Added for testing purposes
            .on('change', _instance.fieldsetlogic.toggleFields)
            .selectAll('.form-field')
            .data(fieldsMeta);
        fieldset.enter()
            .append('div')
            //create collapsable div for each header
            .select(_instance.fieldsetlogic.populateFields);


        return fieldset;
    };

    /**
    * @desc This will go through the multilist fields and select the field marked isDefault
    * @param fieldset - fieldset
    **/
    var _markDefaultFields = function(fieldset) {
        //
        fieldset.select(function(s1){
            _.each(s1.children,function(ss){
                if(ss.multilist){
                    var mlist = ss.multilist;
                    var listField = d3.select('#ml' + ss.type);
                     _.each(listField.node().children, function(c){
                        var opt = d3.select(c).node();
                        _.each(mlist, function(ml){
                            if(ml.hoot_val === opt.value && ml.isDefault === 'true'){
                                opt.selected = true;
                            }
                            if(ml.hoot_val === opt.value && ml.required){
                                if(ml.required==='true'){
                                    opt.style.display='none';
                                }
                            }
                        });
                     });
                     // Manually send out on change event
                     _instance.onChangeMultiList(listField);
                }
            });
        });
    };

    /**
    * @desc Create apply button
    * @param containerForm - container
    **/
    var _createApplyBtn = function(containerForm) {
        var submitExp = containerForm.append('div')
        .classed('form-field col12 left ', true);
         submitExp.append('span')
        .classed('round strong big loud dark center col10 margin1 point', true)
        .classed('inline row1 fl col10 pad1y', true)
        .text('Apply')
        .on('click', function () {
            if(d3.select('#CustomConflationForm').selectAll('.invalid-input')[0].length===0){
                //Capture current values
                parent.confLastSetVals = [];
                _.each(d3.select('#CustomConflationForm').selectAll('form').selectAll('input')[0],function(ai){
                    var selAI = d3.select('#'+ai.id);
                    parent.confLastSetVals.push({id:ai.id,type:ai.type, checked:ai.checked, value:ai.value,
                        disabled:selAI.property('disabled'),hidden:d3.select(selAI.node().parentNode).style('display')});
                });

                parent.confAdvOptionsSelectedVal = _instance.selectionretriever.getSelectedValues(containerForm,
                    parent.confAdvOptionsFields);
                //modalbg.remove();
                containerDiv.classed('hidden', true);
                _instance.advOpsFormEvent(false);
                var refType = d3.select('.ConfType').value().replace('Custom ','');
                d3.select('.ConfType').value('Custom ' + refType);
                d3.select('#modalBackground').remove();
            } else{
                //notify that some values are invalid and leave window open
                iD.ui.Alert('Some values in the form are invalid and must be adjusted before completing custom conflation.',
                    'warning',new Error().stack);
            }
        });
    };

    /**
    * @desc Create cancel button
    * @param containerForm - container
    **/
    var _createCancelBtn = function(containerForm) {
         //Cancel button
        var cancelExp = containerForm.append('div')
        .classed('form-field col12 left ', true);
        cancelExp.append('span')
        .classed('round strong big loud-red dark center col10 margin1 point', true)
        .classed('inline row1 fl col10 pad1y', true)
        .text('Cancel')
        .on('click', function () {
            //Reset to most recent values
            if (parent.confLastSetVals != null){
                //replace current inputs with parent.confLastSetVals
                _.each(parent.confLastSetVals,function(ai){
                    var selAI = d3.select('#'+ai.id);
                    if(ai.type==='checkbox'){
                        selAI.property('checked',ai.checked);
                    } else {
                        selAI.value(ai.value);
                    }

                    selAI.property('disabled',ai.disabled);
                    if(ai.hidden.length>0){d3.select(selAI.node().parentNode).style('display',ai.hidden);}
                });
            } else {
                parent.confLastSetVals = null;
                parent.confAdvOptionsSelectedVal = null;
                if(parent.confAdvOptsDlg){parent.confAdvOptsDlg.remove();}
                parent.confAdvOptsDlg = null;
                d3.select('#modalBackground').remove();
             }

            containerDiv.classed('hidden', true);
            _instance.advOpsFormEvent(false);
        });
    };


    /**
    * @desc Create view values button
    * @param containerForm - container
    **/
    var _createViewValuesLnkBtn = function(containerForm) {
         //view values - testing only
         var valuesExp = containerForm.append('div')
        .classed('form-field col12 left',true);
         valuesExp.append('span')
         .classed('round strong center col10 margin1 point', true)
         .classed('inline row1 fl col10 pad1y', true)
         .style('display',function(){
            if(d3.select('#enable_test_mode').property('checked')){
                return 'inline-block';
            } else {
                return 'none';
            }
         })
         .text('View Values')
         .attr('id','confViewValuesSpan')
         .on('click', function () {
             d3.event.stopPropagation();
             d3.event.preventDefault();

             if(d3.select('#CustomConflationValues')[0][0]==null){
                 parent.confAdvValsDlg = _instance.selectiondisplay.advancedValuesDlg(parent.confAdvOptsDlg,
                     parent.confAdvOptionsFields, _instance.fieldsretriever.gatherFieldValues(parent.confAdvOptionsFields));
                 if(!parent.confAdvValsDlg){_instance.onCustomConflationFormError();}
                 else{
                    //exitadvvals
                     parent.confAdvValsDlg.on('exitadvvals', function(){
                         if(parent.confAdvValsDlg){parent.confAdvValsDlg.remove();}
                         parent.confAdvValsDlg = null;
                     });
                 }
             }
         });
    };


    return d3.rebind(_instance, _events, 'on');

};