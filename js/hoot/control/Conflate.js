/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate provides the user control for initiating Hootenannny conflation job with various
// configurable options. Conflation control consists of
// 1. Conflation control group header where it toggles the visibility of conflation control body.
// 2. Reference layers thumbnails which matches the layer symbology color of primary and secondary layers.
// 3. Save As input field where user specifies conflation output name.
// 4. Path where user can select available Hootenanny folder path.
// 5. New Folder Name where user can specify the new folder where conflation result we reside.
// 6. Type where user specifies the conflation type [Reference | Average | Cookie Cutter & Horizontal]
// 7. Attribute Reference Layer field where user specifies the reference conflation layer
// 8. Generate Report field user enables/disables the report generation during conflation. (Currently hidden)
// 9. Cancel button which clears advanced options dlg and hides conflation control.
// 10. Conflate button which initiates conflation job.
// 11. Advanced (small triable button right of Type field header) options button which allows user to set
//      advanced conflation options.
// 12. Get Values button which is a hidden button enabled when user selects Enable Test Mode checkbox in Help menu.
//
// Supporting submodules are grouped into
// 1. AdvancedOptions class creates advanced options dialog.
// 2. advanced_options group which provides the subclasses for advanced options related functionalities
//      a. FieldsGenerator create advance options fields
//      b. FieldsRetriever gets advanced options fields meta data and the values
//      c. FieldsetLogic implements logic for the relationship between each fields and group
//      d. SelectionDisplay creates dialog for showing selected values
//      e. SelectionRetriever iterate through meta value and get user selected values
// 3. Symbolog class which provides conflated layer symbology control mechanism.
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//      14 Apr. 2016 eslint changes -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflate = function (sidebar,context) {
    var _event = d3.dispatch('merge');
    var _container;
    var _confData;
    var _newName;


    var _instance = {};


    _instance.advancedoptions = Hoot.control.conflate.advancedoptions(context,_instance);//, sidebar);
    _instance.symbology = Hoot.control.conflate.symbology(_instance, sidebar);

    _instance.lastAdvSettingsText = 'Last Advanced Settings';

    _instance.jobid = '';


    /**
    * @desc Creates conflate control in sidebar
    * @param data - input parameters object needed for conflation
    **/
    _instance.activate = function (data) {


        // Capture previous values if they exist
        _restorePrevValues();

        // Remove any previousely running advanced opt dlg
        _removeLastAdvanceOptDlg();

        _confData = data;

        _newName = _getSaveAsOutputName(data);

        context.hoot().model.folders.listFolders(context.hoot().model.folders.getAvailFolders());


        var formMeta = _getFormMeta();

        _createHeaderToggleBtn(data);

        _createLayerRefThumbnails(data);

        _createFieldSets(formMeta);


        var actions = _createActionContainer();

        _createCancelBtn(actions);
        _createConflationSubmitBtn(actions);
        _createGetValuesBtn(actions);


        d3.select('#confAdvOptsLnk').on('click',_advanceOptionsLnkHandler);

    };

   /**
    * @desc Getter for the conflation parameter data set in activate
    **/
    _instance.getConflationData = function() {
        return _confData;
    };


    /**
    * @desc Removes conflate control and resets global variables
    **/
    _instance.deactivate = function () {
        d3.selectAll('.hootConflate').remove();
        _container = null;
        _confData = null;
        _newName = null;
        _instance.lastAdvSettingsText = 'Last Advanced Settings';
        _instance.jobid = '';
    };


    /**
    * @desc Creates combobox and populates when data consists of array
    * @param a item in fieldset meta data list.
    **/
    var _populateDefaultCombo = function(a) {
        var combo = d3.combobox()
            .data(_.map(a.combobox, function (n) {
                return {
                    value: n,
                    title: n
                };
            }));
        var comboCnt = d3.select(this);
        comboCnt.style('width', '100%')
            .call(combo);

        if(a.onchange){
            comboCnt.on('change', a.onchange);
        }
    };


    /**
    * @desc Creates a specialized combobox for Folder list
    * @param a item in fieldset meta data list.
    **/
    var _populateFolderListCombo = function(a) {
        var comboPathName = d3.combobox()
        .data(_.map(a.combobox.data, function (n) {
            return {
                value: n.folderPath,
                title: n.folderPath
            };
        }));

        comboPathName.data().sort(function(a,b){
            var textA = a.value.toUpperCase();
            var textB=b.value.toUpperCase();
            return (textA<textB)?-1 : (textA>textB)?1:0;
        });

        comboPathName.data().unshift({value:'root',title:0});

        var commonId = 0;

        //get common path between lyrA and lyrB using folderID
        context.hoot().model.layers.setLayerLinks(function(){
          var sels = d3.select('#sidebar2').selectAll('form')[0];
          var lyrA, lyrB;
          if(sels && sels.length > 1){
              lyrA = d3.select(sels[0]).datum().name;
              lyrB = d3.select(sels[1]).datum().name;
            }

          context.hoot().model.folders.listFolders(context.hoot().model.folders.getAvailFolders());
          var folderList = _.map(context.hoot().model.folders.getAvailFolders(),_.clone);

          //build the path array for lyrA
          var lyrApath = [];
          lyrA = _.find(context.hoot().model.layers.getAvailLayers(),{'name':lyrA});
          if(lyrA){
              lyrApath.push(lyrA.folderId);

              var folderId = lyrA.folderId;
              while (folderId!==0){
                  var fldr = _.find(folderList,{'id':folderId});
                  if(fldr){
                      lyrApath.push(fldr.parentId);
                      folderId = fldr.parentId;
                  }
              }
          }

          //if(lyrApath) is only 0, keep as root and move on

          lyrB = _.find(context.hoot().model.layers.getAvailLayers(),{'name':lyrB});
          if(lyrB){
              folderId = lyrB.folderId;
              if(lyrApath.indexOf(folderId)>-1){
                  commonId = folderId;
                  return;
              } else {
                  while (folderId!==0){
                      fldr = _.find(folderList,{'id':folderId});
                      if(fldr){
                          if(lyrApath.indexOf(fldr.parentId)>-1){
                              commonId = fldr.parentId;
                              return;
                          }
                          folderId = fldr.parentId;
                      }
                  }
              }
          }
        });

        if(commonId!==0){
          var match = _.find(a.combobox.data,{id:commonId});
          if(match){
              if(match){
                  d3.select(this).value(match.folderPath);
                  d3.select(this).attr('placeholder',match.folderPath);
              }
          }
        }

        d3.select(this)
        .style('width', '100%')
        .call(comboPathName);
    };

    /**
    * @desc Creates a specialized combobox for conflation reference list
    * @param a item in fieldset meta data list.
    **/
    var _populateReferenceCombo = function(a) {

        if(_instance.lastAdvDlg){
            a.combobox.data.push(_instance.lastAdvSettingsText);
        }

        var combo = d3.combobox()
            .data(_.map(a.combobox.data, function (n) {
                return {
                    value: n,
                    title: n
                };
            }));
        var comboCnt = d3.select(this);
        comboCnt.style('width', '100%')
            .call(combo);

        if(a.onchange){
            comboCnt.on('change', a.onchange);
        }


    };

    /**
    * @desc Creates conflation field item
    * @param a item in fieldset meta data list.
    **/
    var _populateFields = function (a) {
        if (a.readonly){
            d3.select(this).attr('readonly',true);
        }

        if (a.testmode){
            if(!d3.select('#enable_test_mode').property('checked'))
            {d3.select(this.parentNode).style('display','none');}
        }

        if(a.type==='newfoldername' || a.type==='saveAs'){
            d3.select(this).on('change',function(){
                //ensure output name is valid
                var resp = context.hoot().checkForUnallowedChar(this.value);
                if(resp !== true){
                    d3.select(this).classed('invalidName',true).attr('title',resp);
                } else {
                    d3.select(this).classed('invalidName',false).attr('title',null);
                }
            });
        }

        if (a.combobox) {
            if(a.combobox.data && a.combobox.command) {
                a.combobox.command.call(this, a);
            }  else {
                _populateDefaultCombo.call(this, a);
            }
        }

    };

    /**
    * @desc Clears adavnced options dlg related data and removes the dialog
    **/
    var _removeAdvancedOptionsDlg = function(){
        _instance.confLastSetVals = null;
        _instance.confAdvOptionsSelectedVal = null;

        if(_instance.confAdvOptsDlg){
            _instance.confAdvOptsDlg.remove();
            d3.select('#modalBackground').remove();
        }
        _instance.confAdvOptsDlg = null;
        _instance.advancedoptions.advOpsFormEvent(false);
    };

    /**
    * @desc Provides advanced optons toggle
    **/
    var _advanceOptionsLnkHandler = function(){
        d3.event.stopPropagation();
        d3.event.preventDefault();

        function displayHandler(ai){
            var selAI = d3.select('#'+ai.id);
            if(ai.type==='checkbox'){
                selAI.property('checked',ai.checked);
            } else {
                selAI.value(ai.value);
            }

            selAI.property('disabled',ai.disabled);
            if(ai.hidden.length>0){d3.select(selAI.node().parentNode).style('display',ai.hidden);}
        }
        // show Advanced dialog
        if(!_instance.confAdvOptsDlg)
        {
            _instance.advancedoptions.advOpsFormEvent(true);
            _instance.confAdvOptsDlg = _instance.advancedoptions.activate();

            if(d3.selectAll('.reset.ConfType').value()===_instance.lastAdvSettingsText && _instance.lastAdvDlg){
                _.each(_instance.lastAdvDlg, displayHandler);
            } else {
                //replace current inputs with Last advanced options if required...
                _.each(_instance.confLastSetVals, displayHandler);
            }

            if(!_instance.confAdvOptsDlg){
                _instance.advancedoptions.onCustomConflationFormError();
            } else {
                //exitadvopts
                _instance.confAdvOptsDlg.on('exitadvopts', function(){
                    _removeAdvancedOptionsDlg();
                });
            }
        }
        else
        {
            if(_instance.confAdvOptsDlg.classed('hidden')){
                _instance.confAdvOptsDlg.classed('hidden', false);
                _instance.confAdvOptsDlg.classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
                _instance.advancedoptions.advOpsFormEvent(true);
            } else {
                if (window.confirm('Exit will remove any previously selected advanced options. Are you sure you want to exit?')){
                    _removeAdvancedOptionsDlg();
                }
            }
        }
    };

    /**
    * @desc Validate conflation field values before submitting job
    **/
    var _isFieldsValuesValid = function() {
        if(!d3.selectAll('.invalidName').empty()){
            return false;
        }

      //check if layer with same name already exists...
        if(_container.selectAll('.saveAs').value()===''){
            iD.ui.Alert('Please enter an output layer name.','warning',new Error().stack);
            return false;
        }

        if(!_.isEmpty(_.filter(_.map(_.pluck(context.hoot().model.layers.getAvailLayers(),'name'),function(l){
                return l.substring(l.lastIndexOf('|')+1);
            }),function(f){
                return f === _container.selectAll('.saveAs').value();
            }
        )))
        {
            iD.ui.Alert('A layer already exists with this name.' +
                ' Please remove the current layer or select a new name for this layer.','warning',new Error().stack);
            return false;
        }

        var resp = context.hoot().checkForUnallowedChar(_container.selectAll('.saveAs').value());
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return false;
        }

        resp = context.hoot().checkForUnallowedChar(_container.selectAll('.newfoldername').value());
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return false;
        }

        var parId = context.hoot().model.folders.getfolderIdByName(_container.selectAll('.pathname').value()) || 0;
        resp = context.hoot().model.folders.duplicateFolderCheck({name:_container.selectAll('.newfoldername').value(),parentId:parId});
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return false;
        }

        return true;
    };

    /**
    * @desc Handler for conflate button click event
    **/
    var _conflateBtnClickHandler = function () {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        if(!_isFieldsValuesValid()) {
            return;
        }


        var thisConfType = d3.selectAll('.reset.ConfType');
        var selVal = thisConfType.value();

        if(selVal===_instance.lastAdvSettingsText){
            _instance.confAdvOptionsFields = _instance.lastAdvFields;
            _instance.confAdvOptionsSelectedVal = _instance.lastAdvValues;
        }

        if(!_instance.confAdvOptionsSelectedVal){
            //set _instance.confAdvOptionsSelectedVal equal to defaults for default values
            _instance.confAdvOptionsFields = _instance.advancedoptions.fieldsretriever.getDefaultFields();
            _instance.confAdvOptionsSelectedVal = _instance.advancedoptions.selectionretriever.getSelectedValues(null,_instance.confAdvOptionsFields);
        }

        if(d3.selectAll('.reset.ConfType').value().startsWith('Custom')){
            _instance.lastAdvFields = _.map(_instance.confAdvOptionsFields,_.clone);
            _instance.lastAdvValues = _.map(_instance.confAdvOptionsSelectedVal,_.clone);
            _instance.lastAdvDlg = [];
            _.each(d3.select('#CustomConflationForm').selectAll('form').selectAll('input')[0],function(ai){
                var selAI = d3.select('#'+ai.id);
                _instance.lastAdvDlg.push({id:ai.id,type:ai.type, checked:ai.checked, value:ai.value, disabled:selAI.property('disabled'),hidden:d3.select(selAI.node().parentNode).style('display')});
            });
        }

        _submitLayer(_container);
        _event.merge(_container, _newName, _instance.confAdvOptionsSelectedVal);
    };


    /**
    * @desc Creates conflation processing button and sends request to service
    * @param a - container div
    **/
    var _submitLayer = function (a) {
        var self = a;
        var color = 'green';
        self
            .attr('class', function () {
                return 'round space-bottom1 loadingLayer ' + color;
            })
            .select('a')
            .remove();
        self.append('div')
            .attr('id', 'hootconflatecontrol')
            .classed('contain keyline-all round controller', true)
            .html('<div class="pad1 inline _loading"><span></span></div>' +
                '<span class="strong pad1x">Conflating &#8230;</span>' +
                '<button class="keyline-left action round-right inline _icon trash"></button>')
            .select('button')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (window.confirm('Are you sure you want to cancel conflation job?')) {

                    d3.select('#hootconflatecontrol').html('<div class="pad1 inline _loading"><span></span></div>' +
                            '<span class="strong pad1x">Cancelling &#8230;</span>');

                    var jobId = _instance.jobid;
                    var saveAsCntrl = d3.selectAll('.reset.saveAs');
                    var mapId = saveAsCntrl.value();

                    var data = {};
                    data.jobid = jobId;
                    data.mapid = mapId;
                    Hoot.model.REST('cancel', data, function () {
                        iD.ui.Alert('Job ID: ' + jobId + ' has been cancelled. ','notice');

                    });
                    //resetForm(self);
                    return;
                }
            });

    };


    /**
    * @desc Restores privous advanced options values
    **/
    var _restorePrevValues = function() {
        _instance.lastAdvFields = _instance.lastAdvFields ? _instance.lastAdvFields : null;
        _instance.lastAdvValues = _instance.lastAdvValues ? _instance.lastAdvValues : null;
        _instance.lastAdvDlg = _instance.lastAdvDlg ? _instance.lastAdvDlg : null;
    };

    /**
    * @desc Removes any data and dialog of previously ran advanced options session
    **/
    var _removeLastAdvanceOptDlg = function() {
        if(_instance.confAdvOptsDlg){_instance.confAdvOptsDlg.remove();}
        if(_instance.confAdvValsDlg){_instance.confAdvValsDlg.remove();}
        _instance.confAdvOptionsFields = null;
        _instance.confAdvOptionsSelectedVal = null;
        _instance.confAdvOptsDlg = null;
        _instance.confAdvValsDlg = null;
        _instance.confLastSetVals = null;
    };

    /**
    * @desc Toggles conflation form when conflation header button is pressed
    * @param context - container which is conflation header button
    **/
    var _toggleForm = function(context) {
        if (/active/g.test(context.className)) {
            sidebar.selectAll('.js-toggle')
                .classed('active', false);
        }
        else {
            sidebar.selectAll('.js-toggle')
                .classed('active', false);
            d3.select(context)
                .classed('active', true);
        }
    };


    /**
    * @desc Returns conflation form fieldset meta data
    **/
    var _getFormMeta = function() {
        var refLayers = [];
        var primaryLayerName = '';
        var secondaryLayerName = '';

        var folderList = _.map(context.hoot().model.folders.getAvailFolders(),_.clone);

        var sels = d3.select('#sidebar2').selectAll('form')[0];
        if(sels && sels.length > 1){
            primaryLayerName = d3.select(sels[0]).datum().name;
            secondaryLayerName = d3.select(sels[1]).datum().name;
            refLayers.push(primaryLayerName);
            refLayers.push(secondaryLayerName);
        }
        return [
            {
                label: 'Save As',
                type: 'saveAs',
                placeholder: _newName
            },
            {
                label: 'Path',
                type: 'pathname',
                placeholder:'root',
                combobox:{'data':folderList, 'command': _populateFolderListCombo},
                readonly:'readonly'
            },
            {
                label: 'New Folder Name (leave blank otherwise)',
                type: 'newfoldername',
                placeholder:''
            },
            {
                label: 'Type',
                type: 'ConfType',
                placeholder: 'Reference',
                combobox: {'data':['Reference', 'Average', 'Cookie Cutter & Horizontal'],
                            'command': _populateReferenceCombo},
                onchange: function(){
                    //reset form
                    _instance.confAdvOptionsFields = null;
                    _removeAdvancedOptionsDlg();
                },
                readonly:'readonly'
            },
            {
                label: 'Attribute Reference Layer',
                type: 'referenceLayer',
                placeholder: primaryLayerName,
                combobox: refLayers,
                readonly:'readonly'
            },
            {
                label: 'Collect Statistics?',
                type: 'isCollectStats',
                placeholder: 'false',
                combobox: ['true','false'],
                onchange: function(){
                    var selVal = d3.selectAll('.reset.isCollectStats').value();
                    return selVal;
                },
                readonly:'readonly'
            },
            {
                label: 'Generate Report?',
                type: 'isGenerateReport',
                placeholder: 'false',
                combobox: ['true','false'],
                onchange: function(){
                    var selVal = d3.selectAll('.reset.isGenerateReport').value();
                    return selVal;
                },
                readonly:'readonly',
                testmode:true
            }
        ];

    };

    /**
    * @desc Help function for new name generation
    * @param words -
    * @param min_substring_length -
    **/
    var _subCompare = function(words, min_substring_length) {
        var needle = words[0].name;
        var haystack = words[1].name;
        min_substring_length = min_substring_length || 1;
        for (var i = needle.length; i >= min_substring_length; i--) {
            for (var j = 0; j <= (needle.length - i); j++) {
                var substring = needle.substr(j, i);
                var k = haystack.indexOf(substring);
                if (k !== -1) {
                    return {
                        found: 1,
                        substring: substring,
                        needleIndex: j,
                        haystackIndex: k
                    };
                }
            }
        }
        return {
            found: 0
        };
    };

    /**
    * @desc Generates unique output name
    * @param data - parameter that contains source names
    **/
    var _getSaveAsOutputName = function(data) {
        var newName;
        if (data[0].name.indexOf('OSM_API_DB') > -1)
        {
          //this change is mostly here b/c I couldn't get the "fill input" ruby step definition
          //to consistently work when pressing the second conflate button...if that can be resolved,
          //this check could go away
          newName = data[0].name.replace('OSM_API_DB_', '') + '_' + data[1].name;
        }
        else
        {
            newName = _subCompare(data, 4);
            if (!newName.found) {
                newName = 'Merged_' + Math.random().toString(16).substring(7);
            }
            else {
                newName = 'Merged_' + newName.substring + '_' + Math.random().toString(16).substring(7);
            }
        }

        return newName;
    };


    /**
    * @desc Creates conflate header button
    * @param data - conflation parameters
    **/
    var _createHeaderToggleBtn = function(data) {
        _container = sidebar
            .append('form')
            .classed('hootConflate round space-bottom1', true);

        _container.data(data)
            .append('a')
            .classed('button dark animate strong block _icon big conflate conflation pad2x pad1y js-toggle', true)
            .attr('href', '#')
            .text('Conflate')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if(d3.select('#sidebar2').selectAll('input').property('disabled')){return;}

                _toggleForm(this);
            });
    };

    /**
    * @desc Creates conflate sources thumbnnails which matches source layers symbology
    * @param data - conflation parameters
    **/
    var _createLayerRefThumbnails = function(data) {
        var layerRef = _container
            .append('fieldset')
            .classed('hidden pad1 keyline-all', true)
            .append('div')
            .classed('conflate-heading center contain space-bottom1 pad0x', true);




        layerRef
            .selectAll('.thumb')
            .data(data)
            .enter()
            .append('div')
            .attr('class', function (d) {
                return 'thumb round _icon data contain dark inline pad1 fill-' + d.color;
            })
            .attr('id', function(d) {
                var modifiedId = d.mapId.toString();
                return 'conflatethumbicon-' + modifiedId;
            });

    };

    /**
    * @desc Creates conflate fieldset
    * @param formMeta - The fieldset meta data
    **/
    var _createFieldSets = function(formMeta) {
        var fieldset = _container.select('fieldset');
        fieldset.selectAll('.form-field')
            .data(formMeta)
            .enter()
            .append('div')
             .attr('id', function (field) {
                return 'containerof' + field.type;
            })
            .classed('form-field fill-white small keyline-all round space-bottom1', true)
            .html(function (field) {
                if(field.type==='ConfType'){
                    var retval = '';
                    retval += '<div style="opacity: 1;"><label class="pad1x pad0y strong fill-light round-top keyline-bottom" style="opacity: 1; max-width: 90%; display: inline-block; width: 90%;">';
                    retval += field.label;
                    retval += '</label><a id="confAdvOptsLnk" class="button pad1x pad0y strong fill-light round-top keyline-bottom" href="#" style="opacity: 1; max-width: 10%; display: inline-block;">►</a></div>';
                    return retval;
                } else {
                    return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + field.label + '</label>';
                }
            })
            .append('input')
            .attr('type', 'text')
            .attr('value', function (a) {
                return a.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(_populateFields);
    };

    /**
    * @desc Creates buttons container
    **/
    var _createActionContainer = function() {
         var actions = _container
            .select('fieldset')
            .append('div')
            .classed('form-field pill col12', true);

        return actions;
    };

    /**
    * @desc Creates cancel button
    * @param actions - buttons container
    **/
    var _createCancelBtn = function(actions) {
        actions
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Cancel')
            .classed('fill-darken0 button round pad0y pad2x small strong', true)
            .attr('border-radius','4px')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if (window.confirm('Cancel will remove any previously selected advanced options. Are you sure you want to cancel?')){
                    _removeAdvancedOptionsDlg();
                    sidebar.selectAll('.js-toggle')
                        .classed('active', false);
                }

            });
    };

    /**
    * @desc Creates conflate button
    * @param actions - buttons container
    **/
    var _createConflationSubmitBtn = function(actions) {
        actions
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Conflate')
            .attr('id', 'conflate2')
            .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
            .attr('border-radius','4px')
            .on('click', _conflateBtnClickHandler);
    };

    /**
    * @desc Creates Get Values button which is hidden initially.(For debugging)
    * @param actions - buttons container
    **/
    var _createGetValuesBtn = function(actions) {

        //NOTE: Remove once change has been approved.  This button is for testing only.
        actions
        .append('input')
        .attr('type', 'submit')
        .attr('value', 'Get Values')
        .attr('id','confGetValuesBtn')
        .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
        .style('display','none')
        .style('display',function(){
            if(d3.select('#enable_test_mode').property('checked')){return 'inline-block';} else {return 'none';}
         })
        .attr('border-radius','4px')
        .on('click', function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();

            if(d3.selectAll('.reset.ConfType').value()===_instance.lastAdvSettingsText){
                _instance.confAdvOptionsFields = _instance.lastAdvFields;
                _instance.confAdvOptionsSelectedVal = _instance.lastAdvValues;
            } else {
                if(_instance.confAdvOptionsSelectedVal == null){
                    _instance.confAdvOptionsFields = _instance.advancedoptions.fieldsretriever.getDefaultFields();
                    _instance.confAdvOptionsSelectedVal = _instance.advancedoptions.selectionretriever.getSelectedValues(null,_instance.confAdvOptionsFields);
                }
            }

            iD.ui.Alert(JSON.stringify(_instance.confAdvOptionsSelectedVal),'notice',null);
        });


    };


    return d3.rebind(_instance, _event, 'on');
};
