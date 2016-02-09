Hoot.control.utilities.exportdataset = function(context) {
	var _events = d3.dispatch();
	var _instance = {};

	var _container;
	var _dataset;


	_instance.exportDataContainer = function(dataset, translations) {
		_createDialog(dataset, translations);  
	};

	var _createDialog = function(dataset, translations) {
		_dataset = dataset;
		var placeHolder = 'NSG Topographic Data Store (TDS) v6.1';//'Select Data Translation Schema'
		var transCombo = [];
		// filters for exportable translations
		_.each(translations, function(tr){
		  if(tr.CANEXPORT && tr.CANEXPORT == true){
		      transCombo.push(tr);
		  }
		});

		if(transCombo.length == 1){
		  var emptyObj = {};
		  emptyObj.NAME="";
		  emptyObj.DESCRIPTION="";
		  transCombo.push(emptyObj);
		}
		var d_form = [{
		    label: 'Translation',
		    id: 'fileExportTranslation',
		    combobox: {'data':transCombo, 'command': _populateTranslations },//transCombo,//exportResources,
		    placeholder: { 'default': placeHolder, 'command': _getTranslationComboPlaceHolder} ,//'LTDS 4.0'
		    inputtype:'combobox'
		}, {
		    label: 'Export Format',
		    id: 'fileExportFileType',
		    combobox: {'data': [{'DESCRIPTION': 'File Geodatabase'}, {'DESCRIPTION': 'Shapefile'}, 
		    			{'DESCRIPTION': 'Web Feature Service (WFS)'}, {'DESCRIPTION': 'Open Street Map (OSM)'}], 'command': _populateTranslations},
		    placeholder: 'File Geodatabase',
		    inputtype:'combobox',
		}, {
			label: 'Append to ESRI FGDB Template?',
			id: 'appendFGDBTemplate',
			inputtype:'checkbox',
			checkbox:'cboxAppendFGDBTemplate'
		}, {
		    label: 'Output Name',
		    id: 'fileExportOutputName',
		    placeholder: dataset.name || 'Output Name',
		    inputtype:'text',
		    onchange: _validateOutputName
		}];


		var d_btn = [
				        {
				        	text: 'Export',
				        	location: 'right',
				        	id: 'exportDatasetBtnContainer',
				        	onclick: _submitClickHandler
				        }
			        ];

        var meta = {};
        meta.title = (dataset.name || 'Export Dataset')
        meta.form = d_form;
        meta.button = d_btn;

		_container = context.hoot().ui.formfactory.create('body', meta);
	}

	var _submitClickHandler = function() {
		if(!d3.selectAll('.invalidName').empty()){
			return;
		}

		var submitExp = d3.select('#exportDatasetBtnContainer');
        var spin = submitExp.insert('div',':first-child').classed('_icon _loading row1 col1 fr',true);
        context.hoot().model.export.exportData(_container, _dataset, function(status){
         
            
            if(status == 'failed'){
            	iD.ui.Alert('Export has failed or partially failed. For detail please see Manage->Log.','warning');
                _container.remove();
            } else {
                var tblContainer = d3.select('#wfsdatasettable');
                context.hoot().view.utilities.wfsdataset.populateWFSDatasets(tblContainer);
                _container.remove();
            }
        });
	}
	var _validateOutputName = function() {
		//ensure output name is valid
        var resp = context.hoot().checkForUnallowedChar(this.value);
        if(resp != true){
            d3.select(this).classed('invalidName',true).attr('title',resp);
        } else {
            d3.select(this).classed('invalidName',false).attr('title',null);
        }
	}
	var _getTranslationComboPlaceHolder = function(field) {
		var defTrans = _.findWhere(field.combobox.data, {DESCRIPTION: field.placeholder['default']});
    	if(defTrans == undefined){
    		return field.combobox.data[0].DESCRIPTION
    	} else {
    		return defTrans.DESCRIPTION;
    	}
	}

	var _populateTranslations = function(a) {
		var combo = d3.combobox()
            .data(_.map(a.combobox.data, function (n) {
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                };
            }));
        d3.select(this)
            .style('width', '100%')
            .call(combo);
        
        d3.select(this)
        	.on('change',function(){
        		_checkForTemplate();
        	});
	}

	var _checkForTemplate = function(){
		var hidden=false;

		var exportType = d3.select('.fileExportFileType').value();
		var transType = d3.select('.fileExportTranslation').value();

		// Check if output type is File Geodatabase
		if (exportType==''){exportType=d3.select('.fileExportFileType').attr('placeholder');}
		if (transType==''){transType=d3.select('.fileExportTranslation').attr('placeholder');}

		if(exportType!='File Geodatabase'){
		 hidden=true;
		}

		var selTrans = _.findWhere(transCombo,{"DESCRIPTION":transType});
		if(selTrans){
		 if(selTrans.NAME.substring(0,3)!='TDS'){
			 hidden=true;
		 }
		} else {
		 hidden=true;
		}

		d3.select('.cboxAppendFGDBTemplate').classed('hidden',hidden);
		if(hidden){
		 d3.select('.cboxAppendFGDBTemplate').select('input').property('checked',false);
		}
	}   

	


	return d3.rebind(_instance, _events, 'on');
}