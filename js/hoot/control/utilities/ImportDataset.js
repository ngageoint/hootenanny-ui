Hoot.control.utilities.importdataset = function(context) {
	var _events = d3.dispatch();
	var _instance = {};

	var _trans;
	var _incomingFolder;
	var _container;

	
	var _createContainer = function(trans,incomingFolder) {
		_trans = trans;
		_incomingFolder = incomingFolder;
		if(_trans.length == 1){
            var emptyObj = {};
            emptyObj.NAME = "";
            emptyObj.DESCRIPTION = "";
            _trans.push(emptyObj);
        }

        var importTranslations = [];
        var importTranslationsGeonames = [];
        var importTranslationsOsm = [];

        _getImportTranslations(_trans, importTranslations, 
				importTranslationsGeonames, importTranslationsOsm);

        var importTypes = _getImportTypes();



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
            id: 'importDatasetImportType',
            combobox2: importTypes
        }, {
            label: 'Import Data',
            id: 'importDatasetFileImport',
            placeholder: 'Select File',
            icon: 'folder',
            readonly:'readonly',
            inputtype:'multipart'
        }, {
            label: 'Layer Name',
            placeholder: 'Save As',
            id: 'importDatasetLayerName'
        }, {
        	label: 'Path',
        	placeholder: folderPlaceholder,
        	id: 'importDatasetPathName',
        	combobox3:folderList 
        }, {
        	label: 'Enter Name for New Folder (Leave blank otherwise)',
        	placeholder:'',
        	id:'importDatasetNewFolderName'
        }, {
            label: 'Translation Schema',
            placeholder: 'Select Data Translation Schema',
            id: 'importDatasetSchema',
            combobox: importTranslations
        }];


        var d_btn = [
			        {
			        	text: 'Update',
			        	location: 'right',
			        	id: 'bulkModifyDatasetBtnContainer',
			        	onclick: _submitClickHandler
			        }
		        ];

        var meta = {};
        meta.title = 'Add Data';
        meta.form = d_form;
        meta.button = d_btn;

		_container = context.hoot().ui.formfactory.create('body', meta);
	}


	var _getImportTypes = function() {
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

        return importTypes;
	}

	var _getImportTranslations = function(trans, importTranslations, 
		importTranslationsGeonames, importTranslationsOsm) {
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
		});
	}


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
                .attr('id','testModlg')
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
            var labelContainer = fieldset.enter()
                .append('div')
                .classed('form-field fill-white small keyline-all round space-bottom1', true)
                .select(function(a){
                    //d3.select(this)
 /*                   if(a.type == 'LayerName') {



                        var dd = d3.select(this)
                            .append('div')
                            .attr('id', 'exportFGDBListDiv')
                            .classed('strong fill-light round-top keyline-bottom',true);

                        
                            

                        dd
                            .append('label')
                            .classed('pad1x pad0y strong round-top _icon down', true)
                            .text(function (d) {
                                return d.label;
                            })
                            .on('click', function(d){
                                

var data = [
            {'name': 'Created At (asc)', 'action':function(){}},
            {'name': 'Created At (dsc)', 'action':function(){}},
            {'name': 'Created By (asc)', 'action':function(){}}
        ];
        var meta = {};
        meta.title = 'Sort By';
        meta.data  = data;
context.hoot().ui.hootformreviewmarkmenu.createForm('testModlg', meta);
                            });

                    } else {
                        d3.select(this)
                            .append('label')
                            .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
                            .text(function (d) {
                                return d.label;
                            });

                    }*/
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
                            .attr('readonly',true)
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
                                } else if(typeName == 'OSM') {
                                    d3.select('#ingestfileuploader')
                                    .attr('multiple', 'false')
                                    .attr('accept', '.osm')
                                    .attr('webkitdirectory', null)
                                    .attr('directory', null);
                                } else {
                                    d3.select('#ingestfileuploader')
                                    .attr('multiple', 'true')
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


	return d3.rebind(_instance, _events, 'on');
}