Hoot.control.utilities.dataset = function(context) {

	var hoot_control_utilities_dataset = {};
    var importTranslations;
    var importTranslationsGeonames;
    var importTranslationsOsm;

    hoot_control_utilities_dataset.exportDataContainer = function(dataset, translations) {

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
            type: 'fileExportTranslation',
            transcombo: transCombo,//exportResources,
            placeholder: placeHolder,//'LTDS 4.0'
            inputtype:'text'
        }, {
            label: 'Export Format',
            type: 'fileExportFileType',
            combobox: ['File Geodatabase', 'Shapefile', 'Web Feature Service (WFS)', 'Open Street Map (OSM)'],
            placeholder: 'File Geodatabase',
            inputtype:'text',
        }, {
        	label: 'Append to ESRI FGDB Template?',
        	type: 'appendFGDBTemplate',
        	inputtype:'checkbox',
        	checkbox:'cboxAppendFGDBTemplate'
        }, {
            label: 'Output Name',
            type: 'fileExportOutputName',
            placeholder: dataset.name || 'Output Name',
            inputtype:'text'
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
            .text(dataset.name || 'Export Dataset')
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
            .each(function(d){
            	if(d.checkbox){d3.select(this).classed('keyline-all',false);}
            })
            .html(function (d) {
            	if(d.checkbox){
            		var retval = '<label class="pad1x pad0y round-top ' + d.checkbox + '" style="opacity: 1;">';
               		retval += '<input type="checkbox" class="reset checkbox" style="opacity: 1;">'+d.label+'</label>';
                	return retval;
                } else {
                	return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + d.label; // + '</label><input type="text" class="reset ' + field.type + '" />';
                }
            });
        fieldset.append('div')
            .classed('contain', true)
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', function (field) {
                if(field.transcombo){
                	var defTrans = _.findWhere(field.transcombo, {DESCRIPTION: field.placeholder});
                	if(defTrans == undefined){return field.transcombo[0].DESCRIPTION}
                	else{return defTrans.DESCRIPTION;}
                }
                else{return field.placeholder;}
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) {
            	if (a.checkbox){
             	   d3.selectAll('input.reset.appendFGDBTemplate').remove();
              	   d3.select('.cboxAppendFGDBTemplate').select('input').property('checked',false);
             	}
            	if (a.combobox) {
                    var combo = d3.combobox()
                        .data(_.map(a.combobox, function (n) {
                            return {
                                value: n,
                                title: n
                            };
                        }));
                    d3.select(this)
                        .style('width', '100%')
                        .call(combo);
                    
                    d3.select(this)
	                	.on('change',function(){
	                		checkForTemplate();
	                	});
                }

                if (a.transcombo) {
                    var combotrans = d3.combobox()
                        .data(_.map(a.transcombo, function (n) {
                            return {
                                value: n.DESCRIPTION,
                                title: n.DESCRIPTION
                            };
                        }));
                    d3.select(this)
                        .style('width', '100%')
                        .call(combotrans);
                    
                    d3.select(this)
                    	.on('change',function(){
                    		checkForTemplate();
                    	});
                }

                if(a.label=='Output Name'){
                    d3.select(this).on('change',function(){
                        //ensure output name is valid
                        var resp = context.hoot().checkForUnallowedChar(this.value);
                        if(resp != true){
                            d3.select(this).classed('invalidName',true).attr('title',resp);
                        } else {
                            d3.select(this).classed('invalidName',false).attr('title',null);
                        }
                    });
                }
            });;

        var submitExp = ingestDiv.append('div')
        .classed('form-field col12 center ', true);
         submitExp.append('span')
        .classed('round strong big loud dark center col10 margin1 point', true)
        .classed('inline row1 fl col10 pad1y', true)
            .text('Export')
            .on('click', function () {
                if(!d3.selectAll('.invalidName').empty()){return;}


                var spin = submitExp.insert('div',':first-child').classed('_icon _loading row1 col1 fr',true);
                context.hoot().model.export.exportData(_form, dataset, function(status){
                 
                    
                    if(status == 'failed'){
                    	iD.ui.Alert('Export has failed or partially failed. For detail please see Manage->Log.','warning');
                        modalbg.remove();
                    } else {
                        var tblContainer = d3.select('#wfsdatasettable');
                        context.hoot().view.utilities.wfsdataset.populateWFSDatasets(tblContainer);
                        modalbg.remove();
                    }
                });
            });
         
         function checkForTemplate(){
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
	};

	hoot_control_utilities_dataset.bulkModifyContainer = function(datasets) {
		hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
	    var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
	    var folderId = 0;
	    var placeholder = 'root';
	    
		 var d_form = [{
         	label: 'Path',
         	type: 'pathname',
         	placeholder:placeholder,
         	combobox:folderList
         },
         {
         	label: 'New Folder Name (leave blank otherwise)',
         	type: 'newfoldername',
         	placeholder:''
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
            .text('Move Datasets')
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
            .html(function (d) {
                	return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + d.label; // + '</label><input type="text" class="reset ' + field.type + '" />';
                });
        fieldset.append('div')
            .classed('contain', true)
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', function (field) {return field.placeholder;})
            .attr('class', function (field) {return 'reset ' + field.type;})
            .select(function(a){
                if (a.combobox){
                    var comboPathName = d3.combobox()
                        .data(_.map(a.combobox, function (n) {
                            return {
                            	value: n.folderPath,
                                title: n.folderPath
                            };
                        }));

                    comboPathName.data().sort(function(a,b){
            		  	var textA = a.value.toUpperCase();
            		  	var textB=b.value.toUpperCase();
            		  	return(textA<textB)?-1 : (textA>textB)?1:0;
            		  });
                    
                    comboPathName.data().unshift({value:'root',title:0});
                    
                    d3.select(this)
                    	.style('width', '100%')
                    	.call(comboPathName);
                    
                    d3.select(this).attr('readonly',true); 
                }
            });

        var submitExp = ingestDiv.append('div')
	        .classed('form-field col12 center ', true);
	         submitExp.append('span')
	        .classed('round strong big loud dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	        .text('Update')
	        .on('click', function () {
	        	//TODO: ADD WARNING MESSAGE, REQUIRE CONFIRMATION

	        	var pathname = _form.select('.pathname').value();
	            if(pathname==''){pathname=_form.select('.pathname').attr('placeholder');}
                if(pathname=='root'){pathname='';}
                var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
                 
                //Add folder if necessary
                var newfoldername = _form.select('.newfoldername').value();
     			resp = context.hoot().checkForUnallowedChar(newfoldername);
	            if(resp != true){
	            	iD.ui.Alert(resp,'warning');
	             	return;
	            }

                resp = hoot.model.folders.duplicateFolderCheck({name:newfoldername,parentId:pathId});
                if(resp != true){
                    iD.ui.Alert(resp,'warning');
                    return;
                }
	            
	            var folderData = {};
                 folderData.folderName = newfoldername;
                 folderData.parentId = pathId;
                 hoot.model.folders.addFolder(folderData,function(a){
                	 //refresh when done
                	 context.hoot().model.layers.refresh(function(){
                	 
                		 //Now that our folder has been created, loop through datasets and update the link 
                		 _.each(datasets,function(dataset){
                			 var lyrId = parseInt(dataset),
                			 outputname = hoot.model.layers.getNameBymapId(lyrId);
                			 if(outputname==null){return;}
                			 
                			 var link = {};
                			 link.folderId = a;
                			 link.mapid = lyrId;
                			 link.updateType="update";
	                         hoot.model.folders.updateLink(link);
	                         link = {}; 
                		 });
                		 
                		 modalbg.remove();	
                		 
                	 });
                 }); 
	            });

	        return modalbg;
		};	
	
	 hoot_control_utilities_dataset.modifyNameContainer = function(dataset) {
			hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
		    var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
		    var folderId = dataset.folderId || 0;
		      
		    var placeholder = 'root';
			if(folderId > 0){
				if( _.findWhere(folderList,{id:folderId})){
					var match = _.findWhere(folderList,{id:folderId});
					if(match){placeholder = match.folderPath};
				}
			 }
		    
		 var d_form = [{
	            label: 'Output Name',
	            type: 'fileOutputName',
	            placeholder: dataset.name,
	            inputtype:'text'
	        },{
            	label: 'Path',
            	type: 'pathname',
            	placeholder:placeholder,
            	combobox:folderList
            },
            {
            	label: 'New Folder Name (leave blank otherwise)',
            	type: 'newfoldername',
            	placeholder:''
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
	            .text('Modify ' + dataset.type.charAt(0).toUpperCase() + dataset.type.slice(1).toLowerCase())
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
	            .html(function (d) {
	                	return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + d.label; // + '</label><input type="text" class="reset ' + field.type + '" />';
	                });
	        fieldset.append('div')
	            .classed('contain', true)
	            .append('input')
	            .attr('type', 'text')
	            .attr('placeholder', function (field) {return field.placeholder;})
	            .attr('class', function (field) {return 'reset ' + field.type;})
	            .select(function(a){
	                if (a.combobox){
	                    var comboPathName = d3.combobox()
	                        .data(_.map(a.combobox, function (n) {
	                            return {
	                            	value: n.folderPath,
	                                title: n.folderPath
	                            };
	                        }));

	                    comboPathName.data().sort(function(a,b){
	            		  	var textA = a.value.toUpperCase();
	            		  	var textB=b.value.toUpperCase();
	            		  	return(textA<textB)?-1 : (textA>textB)?1:0;
	            		  });
	                    
	                    comboPathName.data().unshift({value:'root',title:0});
	                    
	                    d3.select(this)
	                    	.style('width', '100%')
	                    	.call(comboPathName);
	                    
	                    d3.select(this).attr('readonly',true); 
	                }

                    if(a.inputtype=='text'){d3.select(this).value(a.placeholder);}

                    if(a.type=='newfoldername' || a.type=='fileOutputName'){
                        d3.select(this).on('change',function(){
                            //ensure output name is valid
                            var resp = context.hoot().checkForUnallowedChar(this.value);
                            if(resp != true){
                                d3.select(this).classed('invalidName',true).attr('title',resp);
                            } else {
                                d3.select(this).classed('invalidName',false).attr('title',null);
                            }
                        });
                    }
	            });

	        var submitExp = ingestDiv.append('div')
	        .classed('form-field col12 center ', true);
	         submitExp.append('span')
	        .classed('round strong big loud dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	            .text('Update')
	            .on('click', function () {
                    if(!d3.selectAll('.invalidName').empty()){return;}

	            	var pathname = _form.select('.pathname').value();
	            	if(pathname==''){pathname=_form.select('.pathname').attr('placeholder');}
                    if(pathname=='root'){pathname='';}
                    var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
                    
                    //make sure a change is being made to foldername
                    var outputname =_form.select('.fileOutputName').value();
                    
                	var data = {};
                	data.inputType = dataset.type;
                	data.mapid = dataset.id;
                	data.modifiedName = outputname;
                	data.folderId = pathId;
                    
                    if(outputname == ''){outputname=dataset.name;}
                    if(outputname.toLowerCase() != dataset.name.toLowerCase()){
                    	var resp = context.hoot().checkForUnallowedChar(outputname);
                    	if(resp != true){
                    		iD.ui.Alert(resp,'warning');
                    		return;
                        }
                    	if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == outputname})))
                    	{
                    		iD.ui.Alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.",'warning');
                            return;
                        }
                    	
                    	data.updateType="update";
                    }
                	
	                context.hoot().model.layers.updateLayerName(data, function(status){
	                        //determine if a new folder is being added
	                        var newfoldername = _form.select('.newfoldername').value();
	                        resp = context.hoot().checkForUnallowedChar(newfoldername);
	                    	if(resp != true){
	                    		iD.ui.Alert(resp,'warning');
	                    		return;
	                        }

                             resp = hoot.model.folders.duplicateFolderCheck({name:newfoldername,parentId:pathId});
                            if(resp != true){
                                iD.ui.Alert(resp,'warning');
                                return;
                            }
	                        
	                        var folderData = {};
	                        folderData.folderName = newfoldername;
	                        folderData.parentId = pathId;
	                        hoot.model.folders.addFolder(folderData,function(a){
	                        	context.hoot().model.layers.refresh(function(){
		                        	//update map linking
		                            var link = {};
		                            link.folderId = a;
		                            link.mapid =_.pluck(_.filter(hoot.model.layers.getAvailLayers(),function(f){return f.name == outputname}),'id')[0] || 0;
		                            if(link.mapid==0){return;}
		                            link.updateType="update";
		                            hoot.model.folders.updateLink(link);
		                            link = {};
			                        modalbg.remove();	
	                        	});	                        
	                        });
	                });
	            });

	        return modalbg;
		};


    hoot_control_utilities_dataset.importDataContainer = function (trans,incomingFolder) {
            if(trans.length == 1){
                var emptyObj = {};
                emptyObj.NAME = "";
                emptyObj.DESCRIPTION = "";
                trans.push(emptyObj);
            }

            importTranslations = [];
            importTranslationsGeonames = [];
            importTranslationsOsm = [];

            _.each(trans, function(t){
                if(t.NAME === 'GEONAMES'){
                    importTranslationsGeonames.push(t);
                } else if(t.NAME === 'OSM'){
                    var emptyObj = {};
                    emptyObj.NAME = 'NONE';
                    emptyObj.PATH = 'NONE';
                    emptyObj.DESCRIPTION = "No Translation";
                    emptyObj.NONE = 'true';
                    importTranslationsOsm.push(emptyObj);

                    importTranslationsOsm.push(t);
                } else {
                    importTranslations.push(t);
                }
            })

            var importTypes = [];
            var fileTypes = {};
            fileTypes.value = "FILE";
            fileTypes.title = "File (shp,zip)";
            importTypes.push(fileTypes);

            var osmTypes = {};
            osmTypes.value = "OSM";
            osmTypes.title = "File (osm)";
            importTypes.push(osmTypes);

            var geonameTypes = {};
            geonameTypes.value = "GEONAMES";
            geonameTypes.title = "File (geonames)";
            importTypes.push(geonameTypes);

            var dirType = {};
            dirType.value = "DIR";
            dirType.title = "Directory (FGDB)";
            importTypes.push(dirType);

            hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
            var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
            
            var folderPlaceholder = 'root';
            if(incomingFolder){
            	folderId = incomingFolder.id ? incomingFolder.id : 0;
            	if(folderId > 0){
            		var match = _.findWhere(folderList,{id:folderId});
    				if(match){
    					if(match){folderPlaceholder = match.folderPath};
    				}
            	}
            }            

            var d_form = [{
                label: 'Import Type',
                placeholder: 'Select Import Type',
                type: 'importImportType',
                combobox2: importTypes
            }, {
                label: 'Import Data',
                type: 'fileImport',
                placeholder: 'Select File',
                icon: 'folder',
                readonly:'readonly'
            }, {
                label: 'Layer Name',
                placeholder: 'Save As',
                type: 'LayerName'
            }, {
            	label: 'Path',
            	placeholder: folderPlaceholder,
            	type: 'PathName',
            	combobox3:folderList 
            }, {
            	label: 'Enter Name for New Folder (Leave blank otherwise)',
            	placeholder:'',
            	type:'NewFolderName'
            }, {
                label: 'Translation Schema',
                placeholder: 'Select Data Translation Schema',
                type: 'Schema',
                combobox: importTranslations
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
                .text('Add Data')
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
                    if(a.type=='LayerName' || a.type == 'NewFolderName'){
                        d3.select(this).on('change',function(){
                            //ensure output name is valid
                            var resp = context.hoot().checkForUnallowedChar(this.value);
                            if(resp != true){
                                d3.select(this).classed('invalidName',true).attr('title',resp);
                            } else {
                                d3.select(this).classed('invalidName',false).attr('title',null);
                            }
                        });
                    }

                    function getTypeName(desc){
                        var comboData = _form.select('.reset.importImportType').datum();
                        var typeName = "";
                        for(i=0; i<comboData.combobox2.length; i++){
                            var o = comboData.combobox2[i];
                            if(o.title == desc){
                                typeName = o.value;
                                break;
                            }

                        }
                        return typeName;
                    };

                    if (a.readonly){
                    	d3.select(this).attr('readonly',true); 
                    }

                    if (a.icon) {
                        d3.select(this.parentNode)
                            .append('span')
                            .classed('point keyline-left _icon folder pin-right pad0x pad0y hidden', true)
                            .attr('id', 'ingestfileuploaderspancontainer')
                            .append('input')
                            .attr('id', 'ingestfileuploader')
                            .attr('type', 'file')
                            .property('multiple', false)
                            .attr('accept', '.shp,.shx,.dbf,.prj,.osm,.zip')
                            .classed('point pin-top', true)
                            .style({
                                'text-indent': '-9999px',
                                'width': '31px'
                            })
                            .on('change', function () {


                                var filesList=[];

                                // for chrome only for webkit
                                var selType = getTypeName(_form.select('.reset.importImportType').value());

                                if(!selType){
                                    iD.ui.Alert("Please select Import Type.",'warning');
                                    return;
                                }

                                var osmCnt = 0;
                                var shpCnt = 0;
                                var zipCnt = 0;
                                var fileNames = [];
                                var totalFileSize = 0;
                                var folderPath = "";
                                for (var l = 0; l < document.getElementById('ingestfileuploader')
                                    .files.length; l++) {
                                    var curFile = document.getElementById('ingestfileuploader')
                                        .files[l];
                                    totalFileSize += curFile.size;
                                    var curFileName = curFile.name;

                                    fileNames.push(curFileName);
                                    if(l == 0){
                                        if(selType == 'DIR'){
                                            var parts = curFile.webkitRelativePath.split("/");
                                            var folderName = parts[0];
                                            if(folderName.length > 4){
                                                var ext = folderName.substring(folderName.length - 4);
                                                var fgdbName = folderName.substring(0, folderName.length - 4);
                                                if(ext.toLowerCase() != '.gdb'){
                                                	iD.ui.Alert("Please select valid FGDB.",'warning');
                                                    return;
                                                } else {
                                                    var inputName = _form.select('.reset.LayerName').value();
                                                    if(!inputName){
                                                        _form.select('.reset.LayerName').value(fgdbName);
                                                    }
                                                }

                                            }

                                        }
                                    }



                                    if(selType == 'FILE'){
                                        var fName = curFileName.substring(0, curFileName.length - 4);
                                        // I guess only way to deal with shp.xml extension
                                        if(curFileName.toLowerCase().indexOf('.shp.xml') > -1){
                                            fName = curFileName.substring(0, curFileName.length - 8);
                                        }

                                        
                                        var fObj = _.find(filesList, function(f){
                                            return f.name == fName;
                                        });

                                        if(fObj == null){
                                            fObj = {};
                                            fObj.name = fName;
                                            fObj.isSHP = false;
                                            fObj.isSHX = false;
                                            fObj.isDBF = false;
                                            fObj.isPRJ = false;
                                            fObj.isOSM = false;
                                            fObj.isZIP = false;
                                            filesList.push(fObj);
                                        }
                                        if(curFileName.toLowerCase().lastIndexOf('.shp') > -1){
                                            shpCnt++;
                                            fObj.isSHP = true;
                                        }

                                        if(curFileName.toLowerCase().lastIndexOf('.shx') > -1){
                                            fObj.isSHX = true;
                                        }

                                        if(curFileName.toLowerCase().lastIndexOf('.dbf') > -1){
                                            fObj.isDBF = true;
                                        }

                                        if(curFileName.toLowerCase().lastIndexOf('.prj') > -1){
                                            fObj.isPRJ = true;
                                        }

                                        if(curFileName.toLowerCase().lastIndexOf('.osm') > -1){
                                            osmCnt++;
                                            fObj.isOSM = true;
                                        }

                                        if(curFileName.toLowerCase().lastIndexOf('.zip') > -1){
                                            zipCnt++
                                            fObj.isZIP = true;
                                        }
                                    }
                                }

                                if(selType == 'FILE'){
                                    var isValid = true;
                                    _.each(filesList, function(f){
                                        var grp = _.find(filesList, function(m){
                                            return m.name == f.name;
                                        })
                                        if(grp.isSHP){
                                            if(!grp.isSHX || !grp.isDBF){
                                                isValid = false;
                                            }
                                        }


                                    });

                                    if(!isValid){
                                    	iD.ui.Alert("Missing shapefile dependency. Import requires shp, shx and dbf.",'warning');
                                        return;
                                    }
                                }

                                var totalCnt = shpCnt + osmCnt + zipCnt;
                                if((shpCnt > 0 && shpCnt != totalCnt) || (osmCnt > 0 && osmCnt != totalCnt) 
                                    || (zipCnt > 0 && zipCnt != totalCnt)){
                                	iD.ui.Alert("Please select only single type of files. (i.e. can not mix zip with osm)",'warning');
                                    return;
                                }

                                if(osmCnt > 1) {
                                	iD.ui.Alert("Multiple osm files can not be ingested. Please select one.",'warning');
                                    return;
                                }


                                if(totalFileSize > iD.data.hootConfig.ingest_size_threshold){
                                    var thresholdInMb = Math.floor((1*iD.data.hootConfig.ingest_size_threshold)/1000000);
                                    if(!window.confirm("The total size of ingested files are greater than ingest threshold size of " + 
                                        thresholdInMb + "MB and it may have problem. Do you wish to continue?")){
                                        return;
                                    }
                                }

                                if(selType == 'DIR'){
                                    _form.select('.reset.fileImport').value(folderName);
                                    _form.select('.reset.LayerName').value(fgdbName);  
                                } else {
                                    _form.select('.reset.fileImport').value(fileNames.join('; '));
                                    var first = fileNames[0];
                                    var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
                                    _form.select('.reset.LayerName').value(saveName);    
                                }

                                submitExp.classed('hidden', false);

                            });
                    }
                    if (a.combobox) {
                        var combo = d3.combobox()
                            .data(_.map(a.combobox, function (n) {
                                return {
                                    value: n.DESCRIPTION,
                                    title: n.DESCRIPTION
                                };
                            }));


                        d3.select(this)
                            .style('width', '100%')
                            .call(combo);

                    }

                    if (a.combobox2) {
                        var comboImportType = d3.combobox()
                            .data(_.map(a.combobox2, function (n) {
                                return {
                                    value: n.title,
                                    title: n.title
                                };
                            }));


                        d3.select(this)
                            .style('width', '100%')
                            .attr('readonly',true)
                            .call(comboImportType)
                            .on('change', function(a1,a2,a3){
                                d3.select('.reset.fileImport').value('');
                                d3.select('.reset.LayerName').value('');
                                d3.select('.reset.Schema').value('');
                                var selectedType = _form.select('.reset.importImportType').value();
                                var typeName = getTypeName(selectedType);


                                if(typeName == 'DIR'){
                                    d3.select('#ingestfileuploader')
                                    .property('multiple', false)
                                    .attr('accept', null)
                                    .attr('webkitdirectory', '')
                                    .attr('directory', '');
                                } else if(typeName == 'GEONAMES') {
                                    d3.select('#ingestfileuploader')
                                    .property('multiple', false)
                                    .attr('accept', '.geonames')
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                } else if(typeName == 'OSM') {
                                    d3.select('#ingestfileuploader')
                                    .property('multiple', false)
                                    .attr('accept', '.osm')
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                } else {
                                    d3.select('#ingestfileuploader')
                                    .property('multiple', true)
                                    .attr('accept', null)
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                }

                                var translationsList = importTranslations;

                                if(typeName == 'GEONAMES'){
                                    translationsList = importTranslationsGeonames;
                                } else if(typeName == 'OSM') {
                                    translationsList = importTranslationsOsm;
                                }


                                var comboData = d3.select('.reset.Schema').datum();
                                comboData.combobox = translationsList;
                                var combo = d3.combobox()
                                    .data(_.map(translationsList, function (n) {
                                        return {
                                            value: n.DESCRIPTION,
                                            title: n.DESCRIPTION
                                        };
                                    }));

                                d3.select('.reset.Schema')
                                     .style('width', '100%')
                                        .call(combo);
                                if(typeName == 'GEONAMES'){
                                    d3.select('.reset.Schema').value(importTranslationsGeonames[0].DESCRIPTION);
                                } else if(typeName == 'OSM'){
                                    d3.select('.reset.Schema').value(importTranslationsOsm[0].DESCRIPTION);
                                } 

                                d3.select('#ingestfileuploaderspancontainer').classed('hidden', false);

                            });
                    }
                    
                    if (a.combobox3) {
                        var comboPathName = d3.combobox()
                            .data(_.map(a.combobox3, function (n) {
                                return {
                                    value: n.folderPath,
                                    title: n.folderPath
                                };
                            }));

                        comboPathName.data().sort(function(a,b){
                        	var textA = a.value.toUpperCase();
                        	var textB=b.value.toUpperCase();
                        	return(textA<textB)?-1 : (textA>textB)?1:0;
                        });
                        
                        comboPathName.data().unshift({value:'root',title:0});
                        
                        d3.select(this)
                        	.style('width', '100%')
                        	.call(comboPathName);
                        
                        d3.select(this).attr('readonly',true);                        
                    }
                });

                var isCancel = false;
                var jobIds = null;
                var mapIds = null;
                var submitExp = ingestDiv.append('div')
                .classed('hidden form-field col12 left ', true);
                 submitExp.append('span')
                .classed('round strong big loud dark center col10 margin1 point', true)
                .classed('inline row1 fl col10 pad1y', true)
                    .text('Import')
                    .on('click', function () {
                        //check if layer with same name already exists...
                        if(!d3.selectAll('.invalidName').empty()){return;}

                    	if(_form.select('.reset.LayerName').value()=='' || _form.select('.reset.LayerName').value()==_form.select('.reset.LayerName').attr('placeholder')){
                    		iD.ui.Alert("Please enter an output layer name.",'warning');
                            return;
                    	}
                    	
                    	if(!_.isEmpty(_.filter(_.map(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f == _form.select('.reset.LayerName').value();})))
                    	{
                    		iD.ui.Alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.",'warning');
                            return;
                        }
                    	
                    	var resp = context.hoot().checkForUnallowedChar(_form.select('.reset.LayerName').value());
                    	if(resp != true){
                    		iD.ui.Alert(resp,'warning');
                    		return;
                        }
                    	
                    	resp = context.hoot().checkForUnallowedChar(_form.select('.reset.NewFolderName').value());
                    	if(resp != true){
                    		iD.ui.Alert(resp,'warning');
                    		return;
                        }

                        var parId = hoot.model.folders.getfolderIdByName(_form.select('.reset.PathName').value()) || 0;
                        resp = hoot.model.folders.duplicateFolderCheck({name:_form.select('.reset.NewFolderName').value(),parentId:parId});
                        if(resp != true){
                            iD.ui.Alert(resp,'warning');
                            return;
                        }
                    	                                                
                        var importText = submitExp.select('span').text();
                        if(importText == 'Import'){
                            submitExp.select('span').text('Uploading ...');
                            //var spin = submitExp.insert('div',':first-child').classed('_icon _loading row1 col1 fr',true).attr('id', 'importspin');

                            var progcont = submitExp.append('div');
                           progcont.classed('form-field', true);
                           var prog = progcont.append('span').append('progress');
                           prog.classed('form-field', true);
                           prog.value("0");
                           prog.attr("max", "100");
                           prog.attr("id", "importprogress");

                           var progdiv = progcont.append("div");
                           progdiv.attr('id','importprogdiv')
                           		.style("max-height","24px")
                           		.style("overflow","hidden");
                           
                           progdiv.append("text")
                           		.attr("id", "importprogresstext")
                           		.attr("dy", ".3em").text("Initializing ...");
                           
                           var progShow = progcont.append("a");
                           progShow.attr("id","importprogressshow")
                           		.classed('show-link',true)
                           		.attr('expanded',false)
                           		.text('Show More')
                           		.on('click',function(){
                           			var expanded = !JSON.parse(d3.select(this).attr('expanded'));
                           			d3.select(this).attr('expanded',expanded);
            	        			if(expanded){
            	        				d3.select('#importprogdiv').style('max-height',undefined).style({'min-height':'48px','max-height':'300px','overflow-y':'auto'});
            	        				d3.select(this).text('Show Less');
            	        			} else {
            	        				d3.select('#importprogdiv').style('min-height',undefined).style({'min-height':'48px','max-height':'48px','overflow-y':'auto'});
            	        				d3.select(this).text('Show More');
            	        			}
                           		});

                            context.hoot().model.import.importData(_form,function(status){
                                if(status.info == 'complete'){
                                    if(isCancel == false){
                                        modalbg.remove();
                                        
                                    //}
                                    
                                    var pathname = _form.select('.reset.PathName').value();
                                    if(pathname==''){pathname=_form.select('.reset.PathName').attr('placeholder');}
                                    if(pathname=='root'){pathname='';}
                                    var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
                                    
                                    //determine if a new folder is being added
                                    var newfoldername = _form.select('.reset.NewFolderName').value();
                                    
                                    var folderData = {};
                                    folderData.folderName = newfoldername;
                                    folderData.parentId = pathId;
                                    hoot.model.folders.addFolder(folderData,function(a){
                                    	//update map linking
                                        var link = {};
                                        link.folderId = a;
                                        link.mapid=0;
                                        if(_form.select('.reset.LayerName').value())
                                        {link.mapid =_.pluck(_.filter(hoot.model.layers.getAvailLayers(),function(f){return f.name == _form.select('.reset.LayerName').value()}),'id')[0] || 0;}
                                        if(link.mapid==0){return;}
                                        link.updateType='new';
                                        hoot.model.folders.updateLink(link);
                                        link = {};
                                    })
                                    
                                    }

                                } else if(status.info == 'uploaded'){
                                    jobIds = status.jobids;
                                    mapIds = status.mapids;
                                    submitExp.select('span').text('Cancel');
                                } else if(status.info == 'failed'){
                                    var errorMessage = status.error || 'Import has failed or partially failed. For detail please see Manage->Log.';
                                    iD.ui.Alert(errorMessage,'error');
                                    modalbg.remove();
                                }

                            });

                        } else if(importText == 'Cancel'){
                            isCancel = true;
                            if(jobIds && mapIds){
                                for(var i=0; i<jobIds.length; i++){
                                    var curJobId = jobIds[i];
                                    var curMapId = mapIds[i];

                                    var data = {};
                                    data.jobid = curJobId;
                                    data.mapid = curMapId;
                                    Hoot.model.REST('cancel', data, function (a) {
                                    	iD.ui.Alert('Job ID: ' + curJobId + ' has been cancelled. ','notice');



                                        context.hoot().model.layers.refresh(function () {
                                            var combo = d3.combobox().data(_.map(context.hoot().model.layers.getAvailLayers(), function (n) {
                                                 return {
                                                     value: n.name,
                                                     title: n.name
                                                 };
                                             }));
                                             var controls = d3.selectAll('.reset.fileImport');
                                             var cntrl;

                                             for (var j = 0; j < controls.length; j++) {
                                                 cntrl = controls[j];
                                                 // for each of subitems
                                                 for(k=0; k<cntrl.length; k++){
                                                     d3.select(cntrl[k]).style('width', '100%')
                                                     .call(combo);
                                                 }

                                             }

                                             //var datasettable = d3.select('#datasettable');
                                             //context.hoot().view.utilities.dataset.populateDatasetsSVG(datasettable);
                                             modalbg.remove();
                                         });

                                    });
                                }

                            }

                        }

                    });
            return modalbg;
        }
    
    hoot_control_utilities_dataset.bulkImportDataContainer = function (trans) {
        if(trans.length == 1){
            var emptyObj = {};
            emptyObj.NAME = "";
            emptyObj.DESCRIPTION = "";
            trans.push(emptyObj);
        }

        importTranslations = [];
        importTranslationsGeonames = [];
        importTranslationsOsm = [];

        _.each(trans, function(t){
            if(t.NAME === 'GEONAMES'){
                importTranslationsGeonames.push(t);
            } else if(t.NAME === 'OSM'){
                var emptyObj = {};
                emptyObj.NAME = 'NONE';
                emptyObj.PATH = 'NONE';
                emptyObj.DESCRIPTION = "No Translation";
                emptyObj.NONE = 'true';
                importTranslationsOsm.push(emptyObj);

                importTranslationsOsm.push(t);
            }  else {
            importTranslations.push(t);
            }
        })

        var importTypes = [];
        var fileTypes = {};
        fileTypes.value = "FILE";
        fileTypes.title = "File (shp,zip)";
        importTypes.push(fileTypes);

        var osmTypes = {};
        osmTypes.value = "OSM";
        osmTypes.title = "File (osm)";
        importTypes.push(osmTypes);


        var geonameTypes = {};
        geonameTypes.value = "GEONAMES";
        geonameTypes.title = "File (geonames)";
        importTypes.push(geonameTypes);

        var dirType = {};
        dirType.value = "DIR";
        dirType.title = "Directory (FGDB)";
        importTypes.push(dirType);

        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);

        var rowNum = 0;
        
        var _columns = [
           {label:'Import Type', placeholder: 'Select Import Type', type: 'importImportType', combobox2: importTypes},
           {label:'Import Data', placeholder: 'Select File', type: 'fileImport',icon:'folder',readonly:'readonly'},
           {label:'Layer Name', placeholder: 'Save As',	 type: 'LayerName'},
           {label:'Path', placeholder: 'root', type: 'PathName', combobox3:folderList },
           {label:'Translation', placeholder: 'Select Data Translation Schema',	type: 'Schema', combobox: importTranslations},
           {label:'', placeholder:'',type:'deleteRow',icon:'trash'}
        ];
        
        var _row = [{'importTypeType':'','fileImport':'','LayerName':'','PathName':'','Schema':''}];
        
        var modalbg = d3.select('body')
	        .append('div')
	        .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
	    var ingestDiv = modalbg.append('div')
	        .classed('contain col10 pad1 hoot-menu fill-white round modal', true)
	        .style({'display':'block','margin-left':'auto','margin-right':'auto','left':'0%'});
	    var _form = ingestDiv.append('form');
	    _form.classed('round space-bottom1 importableLayer', true)
	        .append('div')
	        .classed('big pad1y keyline-bottom space-bottom2', true)
	        .append('h4')
	        .text('Bulk Add Data')
	        .append('div')
	        .classed('fr _icon x point', true)
	        .on('click', function () {
	            modalbg.remove();
	        });
	    
	    var _table = _form.append('table').attr('id','bulkImportTable');
	    //set column width for last column
	    var colgroup = _table.append('colgroup');
	    colgroup.append('col').attr('span','5').style('width','100%');
	    colgroup.append('col').style('width','30px');
	    
	    _table.append('thead').append('tr')
    		.selectAll('th')
    		.data(_columns).enter()
    		.append('th')
    		.attr('class',function(d){return d.cl})
    		.text(function(d){return d.label});
	    
	    _table.append('tbody');
	    addRow(d3.select("#bulkImportTable").select('tbody'));

        var isCancel = false;
        var jobIds = null;
        var mapIds = null;
        var submitExp = ingestDiv.append('div')
        	.classed('form-field col12 left ', true);
	        
        submitExp.append('span')
         	.classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
         	.text('Import')
            .on('click', function () {
                //remove any existing progress info
            	d3.select('#importprogress').remove();
            	d3.select('#importprogdiv').remove();

                if(!d3.selectAll('.invalidName').empty()){return;}
            	
            	var progcont = submitExp.append('div');
                progcont.classed('form-field', true);
                var prog = progcont.append('span').append('progress');
                prog.classed('form-field', true);
                prog.value("0");
                prog.attr("max", "100");
                prog.attr("id", "importprogress");

                var progdiv = progcont.append("div");
                progdiv.attr('id','importprogdiv')
                		.style("max-height","24px")
                		.style("overflow","hidden");

                var logTxt = "Initializing...";
                
                progdiv.append("text")
                		.attr("id", "importprogresstext")
                		.attr("dy", ".3em").text(logTxt);
                
                var progShow = progcont.append("a");
                progShow.attr("id","importprogressshow")
	        		.classed('show-link',true)
	        		.attr('expanded',false)
	        		.text('Show More')
	        		.on('click',function(){
	        			var expanded = !JSON.parse(d3.select(this).attr('expanded'));
	        			d3.select(this).attr('expanded',expanded);
	        			if(expanded){
	        				d3.select('#importprogdiv').style('max-height',undefined).style({'min-height':'48px','max-height':'300px','overflow-y':'auto'});
	        				d3.select(this).text('Show Less');
	        			} else {
	        				d3.select('#importprogdiv').style('min-height',undefined).style({'min-height':'48px','max-height':'48px','overflow-y':'auto'});
	        				d3.select(this).text('Show More');
	        			}
	        		});
            	
            	//Create a log output
            	var txtLog = 'Starting bulk import process...'
            	
            	
                //Loop through each row and treat as separate import function
            	//var rowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
            	var rowArray = d3.select("#bulkImportTable").selectAll("tr[id^='row-']");
            	importRow(rowArray[0],0, modalbg);
            	return;
            })
            
         	submitExp.append('span')
         		.classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
         		.text('Add Row')
         		.on('click', function () {
         			addRow(d3.select("#bulkImportTable").select('tbody'));
         		});
        
        function importRow(rowArray,rowNumber,modalbg){
    		var row = d3.select(rowArray[rowNumber]);
    		if(row.empty()){
    			modalbg.remove();
    			return;
    		}
    		
        	//check if layer with same name already exists...
    		if(row.select('.reset.LayerName').value()=='' || row.select('.reset.LayerName').value()==row.select('.reset.LayerName').attr('placeholder')){
    			d3.select('#importprogdiv').append('br');
            	d3.select('#importprogdiv').append('text').text("ERROR: Invalid output layer name...");
                return;
        	}
    		
        	if(!_.isEmpty(_.filter(_.map(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f == row.select('.reset.LayerName').value();})))
        	{
    			d3.select('#importprogdiv').append('br');
            	d3.select('#importprogdiv').append('text').text("A layer already exists with this name. Please remove the current layer or select a new name for this layer.");
                return;
            }
    		
        	var resp = context.hoot().checkForUnallowedChar(row.select('.reset.LayerName').value());
        	if(resp != true){
        		d3.select('#importprogdiv').append('br');
            	d3.select('#importprogdiv').append('text').text(resp);
        		return;
            }
    	
        	var importText = submitExp.select('span').text();
        	if(importText == 'Import'){
            	context.hoot().model.import.importData(row,function(status){
            		if(status.info=='complete'){
            			if(isCancel == false){
            				var pathname = row.select('.reset.PathName').value();
            				if(pathname==''){pathname=row.select('.reset.PathName').attr('placeholder');}
                            if(pathname=='root'){pathname='';}
                            var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
                            
                            //update map linking
                            var link = {};
                            link.folderId = pathId;
                            link.mapid=0;
                            link.mapid=0;
                            if(row.select('.reset.LayerName').value())
                            {link.mapid =_.pluck(_.filter(hoot.model.layers.getAvailLayers(),function(f){return f.name == row.select('.reset.LayerName').value()}),'id')[0] || 0;}
                            if(link.mapid==0){return;}
                            link.updateType='new';
                            hoot.model.folders.updateLink(link);
                            link = {};
                            d3.select('#importprogdiv').append('br');
                        	d3.select('#importprogdiv').append('text').text(row.select('.reset.LayerName').value() + " has been successfully uploaded.");
                            
                        	submitExp.select('span').text('Import');
                        	//go to next row in array if neccessary
                        	rowNumber++;
                        	importRow(rowArray,rowNumber,modalbg);
            			} 
        			} else if(status.info=="uploaded"){
        				jobIds = status.jobids;
                        mapIds = status.mapids;
                        submitExp.select('span').text('Cancel');
            		} else if(status.info == 'failed'){
                        var errorMessage = status.error || 'Import has failed or partially failed. For detail please see Manage->Log.';
                        d3.select('#importprogdiv').append('br');
                    	d3.select('#importprogdiv').append('text').text(errorMessage);
                       
                    	//go to next row in array if neccessary
                    	rowNumber++;
                    	importRow(rowArray,rowNumber,modalbg);
                    }
            	});
        	} else if (importText == 'Cancel') {
                isCancel = true;
                if(jobIds && mapIds){
                    for(var i=0; i<jobIds.length; i++){
                        var curJobId = jobIds[i];
                        var curMapId = mapIds[i];

                        var data = {};
                        data.jobid = curJobId;
                        data.mapid = curMapId;
                        Hoot.model.REST('cancel', data, function (a) {
                        	iD.ui.Alert('Job ID: ' + curJobId + ' has been cancelled. ','notice');
                            d3.select('#importprogdiv').append('br');
                            d3.select('#importprogdiv').append('text').text('Job ID: ' + curJobId + ' has been cancelled. ');
                            context.hoot().model.layers.refresh(function () {
                                var combo = d3.combobox().data(_.map(context.hoot().model.layers.getAvailLayers(), function (n) {
                                     return {
                                         value: n.name,
                                         title: n.name
                                     };
                                 }));
                                 var controls = d3.selectAll('.reset.fileImport');
                                 var cntrl;

                                 for (var j = 0; j < controls.length; j++) {
                                     cntrl = controls[j];
                                     // for each of subitems
                                     for(k=0; k<cntrl.length; k++){
                                         d3.select(cntrl[k]).style('width', '100%')
                                         .call(combo);
                                     }
                                 }
                                 
                             	//go to next row in array if neccessary
                             	rowNumber++;
                             	importRow(rowArray,rowNumber,modalbg);
                             });
                        });
                    }
                }
        	} 
        }
    
        function addRow(_table){
        	if(rowNum>10){
        		iD.ui.Alert("Please limit bulk import to 10 datasets or less.",'warning')
        		return;
        	}
        	
        	_table.append('tr').attr('id','row-' + rowNum)
		    .selectAll('td')
		    .data(function(row, i) {
		        // evaluate column objects against the current row
		        return _columns.map(function(c) {
		            var cell = {};
		            d3.keys(c).forEach(function(k) {
		                cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
		            });
		            return cell;
		        });
		    }).enter()
		    .append('td')
		    .append('div').classed('contain bulk-import',true).append('input')
		    .attr('class', function(d){return 'reset  bulk-import ' + d.type})
		    .attr('row',rowNum)
		    .attr('placeholder',function(d){return d.placeholder})
		    .select(function (a) {
                if(a.type=='LayerName'){
                    d3.select(this).on('change',function(){
                        //ensure output name is valid
                        var resp = context.hoot().checkForUnallowedChar(this.value);
                        if(resp != true){
                            d3.select(this).classed('invalidName',true).attr('title',resp);
                        } else {
                            d3.select(this).classed('invalidName',false).attr('title',null);
                        }
                    });
                }

                function getTypeName(desc){
                    var comboData = _form.select('.reset.importImportType').datum();
                    var typeName = "";
                    for(i=0; i<comboData.combobox2.length; i++){
                        var o = comboData.combobox2[i];
                        if(o.title == desc){
                            typeName = o.value;
                            break;
                        }

                    }
                    return typeName;
                };

                if (a.readonly){
                	d3.select(this).attr('readonly',true); 
                }
                
                if (a.icon) {
                    if(a.type=="deleteRow"){
                    	var parentNode = d3.select(this.parentNode);
                    	d3.select(this).remove();
                    	parentNode.append('span')
                    		.classed('point _icon trash pad0x', true)
                    		.attr('id', 'deleterow-'+rowNum)
                    		.on('click',function(){
                    			var rowid = this.id.replace('delete','');
                    			d3.select('#'+rowid).remove();
                    		});
                    } else {
                    	d3.select(this.parentNode)
	                        .append('span')
	                        .classed('point _icon folder pin-right pad0x hidden', true)
	                        .attr('id', 'ingestfileuploaderspancontainer-'+rowNum)
	                        .append('input')
	                        .attr('id', 'ingestfileuploader-'+rowNum)
	                        .attr('type', 'file')
	                        .attr('multiple', 'true')
	                        .attr('accept', '.shp,.shx,.dbf,.prj,.osm,.zip')
	                        .classed('point pin-top', true)
	                        .style({
	                            'text-indent': '-9999px',
	                            'width': '31px'
	                        })
	                        .on('change', function () {
	                            var filesList=[];
	                            var selRowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
	                            var selType = getTypeName(d3.select(".reset.importImportType[row='" + selRowNum + "']").value());
	
	                            if(!selType){
	                            	iD.ui.Alert("Please select Import Type.",'warning');
	                                return;
	                            }
	
	                            var osmCnt = 0;
	                            var shpCnt = 0;
	                            var zipCnt = 0;
	                            var fileNames = [];
	                            var totalFileSize = 0;
	                            var folderPath = "";
	                            for (var l = 0; l < document.getElementById('ingestfileuploader-'+selRowNum)
	                                .files.length; l++) {
	                                var curFile = document.getElementById('ingestfileuploader-'+selRowNum)
	                                    .files[l];
	                                totalFileSize += curFile.size;
	                                var curFileName = curFile.name;
	
	                                fileNames.push(curFileName);
	                                if(l == 0){
	                                    if(selType == 'DIR'){
	                                        var parts = curFile.webkitRelativePath.split("/");
	                                        var folderName = parts[0];
	                                        if(folderName.length > 4){
	                                            var ext = folderName.substring(folderName.length - 4);
	                                            var fgdbName = folderName.substring(0, folderName.length - 4);
	                                            if(ext.toLowerCase() != '.gdb'){
	                                            	iD.ui.Alert("Please select valid FGDB.",'warning');
	                                                return;
	                                            } else {
	                                                var inputName = d3.select(".reset.LayerName[row='" + selRowNum + "']").value();
	                                                if(!inputName){
	                                                	 d3.select(".reset.LayerName[row='" + selRowNum + "']").value(fgdbName);
	                                                }
	                                            }
	                                        }
	                                    }
	                                }
	                                
	                                if(selType == 'FILE'){
	                                    var fName = curFileName.substring(0, curFileName.length - 4);
                                        // I guess only way to deal with shp.xml extension
                                        if(curFileName.toLowerCase().indexOf('.shp.xml') > -1){
                                            fName = curFileName.substring(0, curFileName.length - 8);
                                        }

	                                    var fObj = _.find(filesList, function(f){
	                                        return f.name == fName;
	                                    });
	
	                                    if(fObj == null){
	                                        fObj = {};
	                                        fObj.name = fName;
	                                        fObj.isSHP = false;
	                                        fObj.isSHX = false;
	                                        fObj.isDBF = false;
	                                        fObj.isPRJ = false;
	                                        fObj.isOSM = false;
	                                        fObj.isZIP = false;
	                                        filesList.push(fObj);
	                                    }
	                                    if(curFileName.toLowerCase().lastIndexOf('.shp') > -1){
	                                        shpCnt++;
	                                        fObj.isSHP = true;
	                                    }
	
	                                    if(curFileName.toLowerCase().lastIndexOf('.shx') > -1){
	                                        fObj.isSHX = true;
	                                    }
	
	                                    if(curFileName.toLowerCase().lastIndexOf('.dbf') > -1){
	                                        fObj.isDBF = true;
	                                    }
	
	                                    if(curFileName.toLowerCase().lastIndexOf('.prj') > -1){
	                                        fObj.isPRJ = true;
	                                    }
	
	                                    if(curFileName.toLowerCase().lastIndexOf('.osm') > -1){
	                                        osmCnt++;
	                                        fObj.isOSM = true;
	                                    }
	
	                                    if(curFileName.toLowerCase().lastIndexOf('.zip') > -1){
	                                        zipCnt++
	                                        fObj.isZIP = true;
	                                    }
	                                }
	                            }
	
	                            if(selType == 'FILE'){
	                                var isValid = true;
	                                _.each(filesList, function(f){
	                                    var grp = _.find(filesList, function(m){
	                                        return m.name == f.name;
	                                    })
	                                    if(grp.isSHP){
	                                        if(!grp.isSHX || !grp.isDBF){
	                                            isValid = false;
	                                        }
	                                    }
	
	
	                                });
	
	                                if(!isValid){
	                                	iD.ui.Alert("Missing shapefile dependency. Import requires shp, shx and dbf.",'warning' );
	                                    return;
	                                }
	                            }
	
	                            var totalCnt = shpCnt + osmCnt + zipCnt;
	                            if((shpCnt > 0 && shpCnt != totalCnt) || (osmCnt > 0 && osmCnt != totalCnt) 
	                                || (zipCnt > 0 && zipCnt != totalCnt)){
	                            	iD.ui.Alert("Please select only single type of files. (i.e. can not mix zip with osm)",'warning');
	                                return;
	                            }
	
	                            if(osmCnt > 1) {
	                            	iD.ui.Alert("Multiple osm files can not be ingested. Please select one.",'warning');
	                                return;
	                            }
	
	
	                            if(totalFileSize > iD.data.hootConfig.ingest_size_threshold){
	                                var thresholdInMb = Math.floor((1*iD.data.hootConfig.ingest_size_threshold)/1000000);
	                                if(!window.confirm("The total size of ingested files are greater than ingest threshold size of " + 
	                                    thresholdInMb + "MB and it may have problem. Do you wish to continue?")){
	                                    return;
	                                }
	                            }
	
	                            d3.select(".reset.fileImport[row='" + selRowNum + "']").value(fileNames.join('; '));
	                            var first = fileNames[0];
	                            var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
	                            d3.select(".reset.LayerName[row='" + selRowNum + "']").value(saveName);
	                        });
	                }
			    }
                
		    	if(a.combobox){
		    		var combo = d3.combobox()
		    			.data(_.map(a.combobox,function(n){
		    				return {
		    					value: n.DESCRIPTION,
		    					title: n.DESCRIPTION
		    				};
		    			}));
		    		
		    		d3.select(this).style('width','100%').call(combo);
		    	}
		    	if (a.combobox2) {
                    var comboImportType = d3.combobox()
                        .data(_.map(a.combobox2, function (n) {
                            return {
                                value: n.title,
                                title: n.title
                            };
                        }));


                    d3.select(this)
                        .style('width', '100%')
                        .attr('readonly',true)
                        .call(comboImportType)
                        .on('change', function(a1,a2,a3){
                        	var selRowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
                        	
                        	d3.select(".reset.Schema[row='" + selRowNum + "']").value('');
                            var selectedType = d3.select(this).value();
                            var typeName = getTypeName(selectedType);

                            if(typeName == 'DIR'){
                                d3.select('#ingestfileuploader-'+selRowNum)
                                .attr('multiple', 'false')
                                .attr('accept', null)
                                .attr('webkitdirectory', '')
                                .attr('directory', '');
                            } else if(typeName == 'GEONAMES') {
                                d3.select('#ingestfileuploader-'+selRowNum)
                                .attr('multiple', 'false')
                                .attr('accept', '.geonames')
                                .attr('webkitdirectory', null)
                                .attr('directory', null);
                            } else if(typeName == 'OSM') {
                                d3.select('#ingestfileuploader-'+selRowNum)
                                .attr('multiple', 'false')
                                .attr('accept', '.osm')
                                .attr('webkitdirectory', null)
                                .attr('directory', null);
                            } else {
                                d3.select('#ingestfileuploader-'+selRowNum)
                                .attr('multiple', 'true')
                                .attr('accept', null)
                                .attr('webkitdirectory', null)
                                .attr('directory', null);
                            }

                            var translationsList = importTranslations;
                            if(typeName == 'GEONAMES'){
                                translationsList = importTranslationsGeonames;
                            }  else if(typeName == 'OSM') {
                                translationsList = importTranslationsOsm;
                            }
                            var comboData = d3.select(".reset.Schema[row='" + selRowNum + "']").datum();
                            comboData.combobox = translationsList;
                            var combo = d3.combobox()
                                .data(_.map(translationsList, function (n) {
                                    return {
                                        value: n.DESCRIPTION,
                                        title: n.DESCRIPTION
                                    };
                                }));

                            d3.select(".reset.Schema[row='" + selRowNum + "']")
                                 .style('width', '100%')
                                    .call(combo);
                            if(typeName == 'GEONAMES'){
                            	d3.select(".reset.Schema[row='" + selRowNum + "']").value(importTranslationsGeonames[0].DESCRIPTION);
                            } else if(typeName == 'OSM'){
                                d3.select(".reset.Schema[row='" + selRowNum + "']").value(importTranslationsOsm[0].DESCRIPTION);
                            } 

                            d3.select('#ingestfileuploaderspancontainer-'+selRowNum).classed('hidden', false);

                        });
                }
                
                if (a.combobox3) {
                    var comboPathName = d3.combobox()
                        .data(_.map(a.combobox3, function (n) {
                            return {
                                value: n.folderPath,
                                title: n.folderPath
                            };
                        }));

                    comboPathName.data().sort(function(a,b){
                    	var textA = a.value.toUpperCase();
                    	var textB=b.value.toUpperCase();
                    	return(textA<textB)?-1 : (textA>textB)?1:0;
                    });
                    
                    comboPathName.data().unshift({value:'root',title:0});
                    
                    d3.select(this)
                    	.style('width', '100%')
                    	.call(comboPathName);          
                }
            });
        	
        	rowNum++;
        }
            
            
        return modalbg;
    }

    hoot_control_utilities_dataset.clipDatasetContainer = function(clipType,rect) {
		//exit if already open
		if(!d3.select('#clipDatasetContainer').empty()){return;}

		if(_.isEmpty(hoot.model.layers.getLayers())){
			iD.ui.Alert('Please add at least one dataset to the map to clip.','notice');
			return;
		}

        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);

        var _columns = [
           {label:'Dataset',type:'datasetName'},
           {label:'Clip?', checkbox:true},
		   {label:'Output Name', placeholder: 'Save As',	 type: 'LayerName'},
		   {label:'Path', placeholder: 'root', type: 'PathName', combobox3:folderList }
        ];
        
        var _row = [{'datasetName':'','checkbox':'','LayerName':'','PathName':''}];
        
        var modalbg = d3.select('body')
	        .append('div')
	        .attr('id','clipDatasetContainer')
	        .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
	    var ingestDiv = modalbg.append('div')
	        .classed('contain col10 pad1 hoot-menu fill-white round modal', true)
	        .style({'display':'block','margin-left':'auto','margin-right':'auto','left':'0%'});
	    var _form = ingestDiv.append('form');
	    _form.classed('round space-bottom1 importableLayer', true)
	        .append('div')
	        .classed('big pad1y keyline-bottom space-bottom2', true)
	        .append('h4')
	        .text(function(){
	        	if(clipType=='visualExtent'){return 'Clip Data to Visual Extent'}
	        	else if(clipType=='boundingBox'){return 'Clip Data to Bounding Box'}
	        	else{return 'Clip Data'}
	        })
	        .append('div')
	        .classed('fr _icon x point', true)
	        .on('click', function () {
	            modalbg.remove();
	        });
	    
	    var _table = _form.append('table').attr('id','clipTable');
	    //set column width for last column
	    var colgroup = _table.append('colgroup');
	    colgroup.append('col').attr('span','4').style('width','100%');
	    colgroup.append('col').style('width','30px');
	    
	    _table.append('thead').append('tr')
    		.selectAll('th')
    		.data(_columns).enter()
    		.append('th')
    		.attr('class',function(d){return d.cl})
    		.text(function(d){return d.label});
	    
	    _table.append('tbody');
	    _.each(hoot.model.layers.getLayers(),function(d){
			var _tableBody = d3.select("#clipTable").select('tbody');
			_tableBody.append('tr').attr('id','row-'+d.name)
				.selectAll('td')
				.data(function(row,i){
					// evaluate column objects against the current row
					return _columns.map(function(c) {
						var cell = {};
						d3.keys(c).forEach(function(k) {
							cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
						});
						return cell;
					});
				}).enter()
				.append('td')
				.append('div').classed('contain bulk-import',true).append('input')
				.attr('class', function(d){return 'reset  bulk-import ' + d.type})
		    	.attr('row',d.name)
		    	.attr('placeholder',function(d){return d.placeholder})
		    	.select(function (a) {
					if(a.checkbox){
						var parentDiv = d3.select(this.parentElement);
						parentDiv.selectAll('input').remove();
						parentDiv.append('input').attr('type','checkbox').property('checked',true).attr('id','clip-'+d.name);//.attr('checked',true);
					}

					if(a.type=='datasetName'){
						d3.select(this).attr('placeholder',function(){
							return d.name}).attr('readonly',true);
					}

					if(a.type=='LayerName'){
						var uniquename = false;
						var name = d.name;
						var i = 1;
						while (uniquename==false){
							if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == name}))){
								name = d.name + i.toString();
								i++;
							} else {
								uniquename = true;
							}
						}
						d3.select(this).attr('placeholder',function(){return name;});
						
						d3.select(this).on('change',function(){
							//ensure output name is valid
							var resp = context.hoot().checkForUnallowedChar(this.value);
							if(resp != true){
								d3.select(this).classed('invalidName',true).attr('title',resp);
							} else {
								d3.select(this).classed('invalidName',false).attr('title',null);
							}
						});
					}

					if (a.readonly){
						d3.select(this).attr('readonly',true); 
					}

					if (a.combobox3) {
						var comboPathName = d3.combobox()
							.data(_.map(a.combobox3, function (n) {
								return {
									value: n.folderPath,
									title: n.folderPath
								};
							}));

						comboPathName.data().sort(function(a,b){
							var textA = a.value.toUpperCase();
							var textB=b.value.toUpperCase();
							return(textA<textB)?-1 : (textA>textB)?1:0;
						});

						comboPathName.data().unshift({value:'root',title:0});

						d3.select(this)
							.style('width', '100%')
							.call(comboPathName);  

						d3.select(this).attr('placeholder',function(){
							if(_.isEmpty(_.findWhere(hoot.model.layers.getAvailLayers(),{'name':d.name}))){
								return 'root';
							} else {
								var folderPath = 'root';
								try{
									hoot.model.layers.setLayerLinks(function(){
										var fID = _.findWhere(hoot.model.layers.getAvailLayers(),{'name':d.name}).folderId || 0;
										var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
										folderPath =  _.findWhere(folderList,{id:fID}).folderPath || 'root';
									});
										
								} catch (err) {
									folderPath = 'root';
								}

								return folderPath;
							}
						})        
					}
				});
			});

			var submitExp = ingestDiv.append('div')
				.classed('form-field col12 left ', true);

			if(clipType==undefined){clipType='visualExtent';}
			var typeDiv = ingestDiv.append('div').attr('id','clipType').classed('hidden',true).attr('clipType',clipType);

			var rect = rect;
			submitExp.append('span')
				.classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
				.text('Clip')
				.on('click', function () {
					if(!d3.selectAll('.invalidName').empty()){return;}
					
					var clipType = d3.select('#clipType').attr('clipType');
					var checkedRows = d3.select('#clipTable').selectAll('tr').selectAll("[type=checkbox]");
						var selectedLayers = [];
						_.each(checkedRows,function(d){
							if(!_.isEmpty(d)){
								if(d3.select(d[0]).property('checked')){selectedLayers.push(d.parentNode.id.replace('row-',''));}								
							}
						});
						
					//Set up params for clipping
					var params = [];
					_.each(hoot.model.layers.getLayers(),function(d){
						if(selectedLayers.indexOf(d.name)==-1){return;}
						
						var param = {};
						param.INPUT_NAME = d.name;
						
						var uniquename = false;
                        var name = d3.select('#row-' + d.name).select('div .LayerName').value() || d3.select('#row-' + d.name).select('div .LayerName').attr('placeholder');
						var i = 1;
						while (uniquename==false){
							if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == name}))){
								name = name + i.toString();
								i++;
							} else {
								uniquename = true;
							}
						}
						param.OUTPUT_NAME = name;
						
						var resp = context.hoot().checkForUnallowedChar(param.OUTPUT_NAME);
						if(resp != true){
			        		iD.ui.Alert(resp,'warning');
			        		return;
			            }
						
						if(clipType=='visualExtent'){param.BBOX = id.map().extent().toString();}
						else if(clipType=='boundingBox'){param.BBOX=rect;}
						
                        param.PATH_NAME = d3.select('#row-' + d.name).select('div .PathName').value() || d3.select('#row-' + d.name).select('div .PathName').attr('placeholder') || 'root';

						params.push(param); 
					});
					
					_.each(params,function(param){
						Hoot.model.REST('clipDataset', param, function (a,outputname) {
                            	if(a.status=='complete'){iD.ui.Alert("Success: " + outputname + " has been created!",'success');}
                            });
					})

					modalbg.remove();
					return;
				})


			return modalbg;
		};	

    
	return hoot_control_utilities_dataset;
};
