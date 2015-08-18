Hoot.control.utilities.dataset = function(context) {

	var hoot_control_utilities_dataset = {};
    var importTranslations;
    var importTranslationsGeonames;

    hoot_control_utilities_dataset.exportDataContainer = function(dataset, translations) {

      var placeHolder = 'NSG Topographic Data Store (TDS) v6.1 (Hootenanny Default)';//'Select Data Translation Schema'
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
            .classed('contain col4 pad1 fill-white round modal', true);
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
            });;

        var submitExp = ingestDiv.append('div')
        .classed('form-field col12 center ', true);
         submitExp.append('span')
        .classed('round strong big loud dark center col10 margin1 point', true)
        .classed('inline row1 fl col10 pad1y', true)
            .text('Export')
            .on('click', function () {

                var spin = submitExp.insert('div',':first-child').classed('_icon _loading row1 col1 fr',true);
                context.hoot().model.export.exportData(_form, dataset, function(status){
                 
                    
                    if(status == 'failed'){
                        alert('Export has failed or partially failed. For detail please see Manage->Log.');
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
	            .classed('contain col4 pad1 fill-white round modal', true);
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
	            });

	        var submitExp = ingestDiv.append('div')
	        .classed('form-field col12 center ', true);
	         submitExp.append('span')
	        .classed('round strong big loud dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	            .text('Update')
	            .on('click', function () {
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
                    		alert(resp);
                    		return;
                        }
                    	if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == outputname})))
                    	{
                            alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.");
                            return;
                        }
                    	
                    	data.updateType="update";
                    }
                	
	                context.hoot().model.layers.updateLayerName(data, function(status){
	                        //determine if a new folder is being added
	                        var newfoldername = _form.select('.newfoldername').value();
	                        resp = context.hoot().checkForUnallowedChar(newfoldername);
	                    	if(resp != true){
	                    		alert(resp);
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

            _.each(trans, function(t){
                if(t.NAME === 'GEONAMES'){
                    importTranslationsGeonames.push(t);
                } else {
                    importTranslations.push(t);
                }
            })

            var importTypes = [];
            var fileTypes = {};
            fileTypes.value = "FILE";
            fileTypes.title = "File (osm,shp,zip)";
            importTypes.push(fileTypes);

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
                icon: 'folder'
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
                .classed('contain col4 pad1 fill-white round modal', true);
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


                    if (a.icon) {
                        d3.select(this.parentNode)
                            .append('span')
                            .classed('point keyline-left _icon folder pin-right pad0x pad0y hidden', true)
                            .attr('id', 'ingestfileuploaderspancontainer')
                            .append('input')
                            .attr('id', 'ingestfileuploader')
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

                                // for chrome only for webkit
                                var selType = getTypeName(_form.select('.reset.importImportType').value());

                                if(!selType){
                                    alert("Please select Import Type.");
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
                                                    alert("Please select valid FGDB.");
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
                                        alert("Missing shapefile dependency. Import requires shp, shx and dbf." );
                                        return;
                                    }
                                }

                                var totalCnt = shpCnt + osmCnt + zipCnt;
                                if((shpCnt > 0 && shpCnt != totalCnt) || (osmCnt > 0 && osmCnt != totalCnt) 
                                    || (zipCnt > 0 && zipCnt != totalCnt)){
                                    alert("Please select only single type of files. (i.e. can not mix zip with osm)");
                                    return;
                                }

                                if(osmCnt > 1) {
                                    alert("Multiple osm files can not be ingested. Please select one.");
                                    return;
                                }


                                if(totalFileSize > iD.data.hootConfig.ingest_size_threshold){
                                    var thresholdInMb = Math.floor((1*iD.data.hootConfig.ingest_size_threshold)/1000000);
                                    if(!window.confirm("The total size of ingested files are greater than ingest threshold size of " + 
                                        thresholdInMb + "MB and it may have problem. Do you wish to continue?")){
                                        return;
                                    }
                                }

                                _form.select('.reset.fileImport').value(fileNames.join('; '));
                                var first = fileNames[0];
                                var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
                                _form.select('.reset.LayerName').value(saveName);

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
                            .call(comboImportType)
                            .on('change', function(a1,a2,a3){
                                d3.select('.reset.Schema').value('');
                                var selectedType = _form.select('.reset.importImportType').value();
                                var typeName = getTypeName(selectedType);


                                if(typeName == 'DIR'){
                                    d3.select('#ingestfileuploader')
                                    .attr('multiple', 'false')
                                    .attr('accept', null)
                                    .attr('webkitdirectory', '')
                                    .attr('directory', '');
                                } else if(typeName == 'GEONAMES') {
                                    d3.select('#ingestfileuploader')
                                    .attr('multiple', 'false')
                                    .attr('accept', '.geonames')
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                } else {
                                    d3.select('#ingestfileuploader')
                                    .attr('multiple', 'true')
                                    .attr('accept', null)
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                }

                                var geonamesTrans = importTranslations;
                                if(typeName == 'GEONAMES'){
                                    geonamesTrans = importTranslationsGeonames;
                                } 
                                var comboData = d3.select('.reset.Schema').datum();
                                comboData.combobox = geonamesTrans;
                                var combo = d3.combobox()
                                    .data(_.map(geonamesTrans, function (n) {
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
                    	if(_form.select('.reset.LayerName').value()=='' || _form.select('.reset.LayerName').value()==_form.select('.reset.LayerName').attr('placeholder')){
                    		alert("Please enter an output layer name.");
                            return;
                    	}
                    	
                    	if(!_.isEmpty(_.filter(_.map(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f == _form.select('.reset.LayerName').value();})))
                    	{
                            alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.");
                            return;
                        }
                    	
                    	var resp = context.hoot().checkForUnallowedChar(_form.select('.reset.LayerName').value());
                    	if(resp != true){
                    		alert(resp);
                    		return;
                        }
                    	
                    	resp = context.hoot().checkForUnallowedChar(_form.select('.reset.NewFolderName').value());
                    	if(resp != true){
                    		alert(resp);
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

                           progcont.append("text")
                            .attr("id", "importprogresstext")
                            .attr("dy", ".3em").text("Initializing ...")       

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
                                    alert('Import has failed or partially failed. For detail please see Manage->Log.');
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
                                        alert('Job ID: ' + curJobId + ' has been cancelled. ');



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
    
	return hoot_control_utilities_dataset;
};