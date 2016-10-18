/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.bulkimportdataset imports multiple datasets.
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      17 Feb. 2016
//      15 Apr. 2016 eslint updates -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.bulkimportdataset = function(context) {
    var _events = d3.dispatch();
    var _instance = {};

    var _trans;

    var _importTranslations;
    var _importTranslationsGeonames;
    var _importTranslationsOsm;

    var _isCancel = false;
    var _jobIds = null;
    var _mapIds = null;

    var _rowNum = 0;
    var _columns;

    var _table;
    var _modalbg;
    var _form;

    var _submitExp;




    /**
    * @desc Entry point where it creates form.
    * @param trans - Translations list.
    **/
    _instance.bulkImportDataContainer = function(trans) {
        _reset();
        _createContainer(trans);
    };

    /**
    * @desc Internal form creation.
    * @param trans - Translations list.
    **/
    var _createContainer = function(trans) {
        _trans = trans;
        if(_trans.length === 1){
            var emptyObj = {};
            emptyObj.NAME = '';
            emptyObj.DESCRIPTION = '';
            _trans.push(emptyObj);
        }

        _importTranslations = [];
        _importTranslationsGeonames = [];
        _importTranslationsOsm = [];

        context.hoot().control.utilities.importdataset.getImportTranslations(_trans, _importTranslations,
                _importTranslationsGeonames, _importTranslationsOsm);

        var importTypes = context.hoot().control.utilities.importdataset.getImportTypes();


        context.hoot().model.folders.listFolders(context.hoot().model.folders.getAvailFolders());
        var folderList = _.map(context.hoot().model.folders.getAvailFolders(),_.clone);

        _rowNum = 0;

        _columns = [
           {label:'Import Type', placeholder: 'Select Import Type', type: 'importImportType', combobox: {data: importTypes, command:_importTypeComboHandler}},
           {label:'Import Data', placeholder: 'Select File', type: 'fileImport',icon:'folder',readonly:'readonly'},
           // Disabling util we figure out how to cache ogr info
           //{label: 'FGDB Feature Classes', placeholder: '', type: 'bulkImportDatasetFGDBFeatureClasses',readonly:'readonly'},
           {label:'Layer Name', placeholder: 'Save As',  type: 'LayerName'},
           {label:'Path', placeholder: 'root', type: 'PathName', combobox:{data:folderList, command:_folderListComboHandler }},
           {label:'Translation', placeholder: 'Select Translation Schema', type: 'Schema', combobox: {data:_importTranslations, command:_translationComboHandler}},
           {label:'', placeholder:'',type:'deleteRow',icon:'trash'}
        ];

        _modalbg = _createModalBackground();
        var ingestDiv = _createFormFrame(_modalbg);
        _form = _createForm(ingestDiv);
        _createTableHeader();
        _createTableBody(ingestDiv);
    };


    /**
    * @desc Creates black background.
    **/
    var _createModalBackground = function() {
        return d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
    };

    /**
    * @desc Creates form frame on top of black background.
    * @param modalbg - back ground div.
    **/
    var _createFormFrame = function (modalbg) {
        return modalbg.append('div')
            .classed('contain col10 pad1 hoot-menu fill-white round modal', true)
            .style({'display':'block','margin-left':'auto','margin-right':'auto','left':'0%'});
    };

    /**
    * @desc Creates form within the frame.
    * @param ingestDiv - ingest div.
    **/
    var _createForm = function (ingestDiv) {

        var frm = ingestDiv.append('form');
        frm.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Bulk Import Datasets')
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                _modalbg.remove();
            });

        return frm;
    };


    /**
    * @desc Creates table header.
    **/
    var _createTableHeader = function() {
        _table = _form.append('table').attr('id','bulkImportTable');
        //set column width for last column
        var colgroup = _table.append('colgroup');
        colgroup.append('col').attr('span','5').style('width','100%');
        colgroup.append('col').style('width','30px');

        _table.append('thead').append('tr')
            .selectAll('th')
            .data(_columns).enter()
            .append('th')
            .attr('class',function(d){return d.cl;})
            .text(function(d){return d.label;});
    };


    /**
    * @desc Toggler for progress detail messages.
    **/
    var _showProgressDetail = function() {
        var expanded = !JSON.parse(d3.select(this).attr('expanded'));
        d3.select(this).attr('expanded',expanded);
        if(expanded){
            d3.select('#importprogdiv').style('max-height',undefined).style({'min-height':'48px','max-height':'300px','overflow-y':'auto'});
            d3.select(this).text('Show Less');
        } else {
            d3.select('#importprogdiv').style('min-height',undefined).style({'min-height':'48px','max-height':'48px','overflow-y':'auto'});
            d3.select(this).text('Show More');
        }
    };

    /**
    * @desc Click handler for import request.
    **/
    var _importClickHandler = function() {
        //remove any existing progress info
        d3.select('#importprogress').remove();
        d3.select('#importprogdiv').remove();

        if(!d3.selectAll('.invalidName').empty()){return;}

        //Places spinner 
        var progcont = _submitExp.append('div');
        progcont.insert('div')
                .classed('_icon _loading row1 col1 fl',true)
                .attr('id', 'importspin');

/*      var prog = progcont.append('span').append('progress');
        prog.classed('form-field', true);
        prog.value('0');
        prog.attr('max', '100');
        prog.attr('id', 'importprogress');*/

        var progdiv = progcont.append('div');
        progdiv.attr('id','importprogdiv')
                .style('max-height','24px')
                .style('overflow','hidden');
                
        var logTxt = 'Initializing...';
        
        progdiv.append('text')
                .attr('id', 'importprogresstext')
                .attr('dy', '.3em').text(logTxt);

        var progShow = progcont.append('a');
        progShow.attr('id','importprogressshow')
            .classed('show-link',true)
            .attr('expanded',false)
            .text('Show More')
            .on('click',_showProgressDetail);

        //Create a log output
        d3.select('#importprogdiv').append('text').text('Starting bulk import process...');


        //Loop through each row and treat as separate import function
        //var rowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
        var rowArray = d3.select('#bulkImportTable').selectAll('tr[id^="row-"]');
        _importRow(rowArray[0],0, _modalbg);

    };

    /**
    * @desc Creates bulk import table body.
    * @param ingestDiv - ingest form div.
    **/
    var _createTableBody = function(ingestDiv) {
        _table.append('tbody');
        _addRow(d3.select('#bulkImportTable').select('tbody'));

        _isCancel = false;
        _jobIds = null;
        _mapIds = null;
        _submitExp = ingestDiv.append('div')
            .classed('form-field col12 left ', true);

        _submitExp.append('span')
            .classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
            .text('Import')
            .on('click', _importClickHandler);

        _submitExp.append('span')
            .classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
            .text('Add Row')
            .on('click', function () {
                _addRow(d3.select('#bulkImportTable').select('tbody'));
            });

        var suffixDiv = _submitExp.append('div')
            .classed('form-field fill-white small',true);

        suffixDiv.append('label')
            .attr('for','customSuffix')
            .style({'display':'inline-block','font-weight':'bold'})
            .text('Suffix for all layer names: ');

        var suffixTitle = 'To not use a suffix, leave blank.';
        suffixDiv.append('div')
            .style('display','inline-block')
            .classed('pad1x',true)
            .append('input')
            .attr('type','text')
            .style('display','inline-block')
            .attr({'name':'customSuffix','id':'customSuffix','title':suffixTitle})
            .on('change',function(){
            	// Check suffix for unallowed characters
            	var resp = context.hoot().checkForUnallowedChar(this.value);
			        if(resp !== true){
			        	d3.select(this).attr('title',resp)
			        		.classed('invalidName',true);
			        	return false;
			        } else {
			        	d3.select(this).attr('title',suffixTitle)
			        		.classed('invalidName',false);			        	
			        }

			    // Loop through rows to determine if layer with same name already exists
            	var rowArray = d3.select('#bulkImportTable').selectAll('tr[id^="row-"]');
        			_.each(rowArray[0], function(row){
        				var r = d3.select(row); 
                        _validateInput(r);
        				/*var lyrName = r.select('.reset.LayerName').value() + d3.select('#customSuffix').value();

        				if(!_.isEmpty(_.filter(_.map(
			                _.pluck(context.hoot().model.layers.getAvailLayers(),'name'),
			                    function(l){
			                        return l.substring(l.lastIndexOf('|')+1);
			                    }),
			                function(p){
			                    return p === lyrName;
			                }))
			            )
			            {
			                r.select('.reset.LayerName')
			                	.attr('title','A layer already exists with the name ' + lyrName + '.')
			                	.classed('invalidName',true);		                
			            } else {
			            	r.select('.reset.LayerName')
			                	.attr('title',null)
			                	.classed('invalidName',false);		                
			            }*/
        			});
            });
    };

    /**
    * @desc Post processor for a row ingesting.
    * @param row - ingested row.
    * @param rowArray - Array of rows.
    * @param rowNumber - current row index.
    * @param modalbg - Form container div.
    **/
    var _loadPostProcess = function(row, rowArray, rowNumber, modalbg) {
        var pathname = row.select('.reset.PathName').value();
        if(pathname===''){pathname=row.select('.reset.PathName').attr('placeholder');}
        if(pathname==='root'){pathname='';}
        var pathId = context.hoot().model.folders.getfolderIdByName(pathname) || 0;

        //update map linking
        var link = {};
        link.folderId = pathId;
        link.mapid=0;
        link.mapid=0;

        var newLayerName = row.select('.reset.LayerName').value() + d3.select('#customSuffix').value();

        if(newLayerName)
        {link.mapid =_.pluck(_.filter(context.hoot().model.layers.getAvailLayers(),function(f){return f.name === newLayerName;}),'id')[0] || 0;}
        if(link.mapid===0){return;}
        link.updateType='new';
        context.hoot().model.folders.updateLink(link);
        link = {};
        d3.select('#importprogdiv').append('br');
        d3.select('#importprogdiv').append('text').text(newLayerName + ' has been successfully uploaded.');

        _submitExp.select('span').text('Import');
        //go to next row in array if neccessary
        rowNumber++;
        _importRow(rowArray,rowNumber,modalbg);
    };

    /**
    * @desc Cancels bulk import request.
    * @param rowArray - Array of rows.
    * @param rowNumber - current row index.
    * @param modalbg - Form container div.
    **/
    var _cancelJob = function(rowArray, rowNumber, modalbg) {
        _isCancel = true;
        if(_jobIds && _mapIds){
            for(var i=0; i<_jobIds.length; i++){
                var curJobId = _jobIds[i];
                var curMapId = _mapIds[i];

                var data = {};
                data.jobid = curJobId;
                data.mapid = curMapId;
                data.rowArray = rowArray;
                data.rowNumber = rowNumber;
                data.modalbg = modalbg;

                Hoot.model.REST('cancel', data, _cancelJobCallback(data));
            }
        }
    };

    var _cancelJobCallback = function(data){
        iD.ui.Alert('Job ID: ' + data.curJobId + ' has been cancelled. ','notice');
        d3.select('#importprogdiv').append('br');
        d3.select('#importprogdiv').append('text').text('Job ID: ' + data.curJobId + ' has been cancelled. ');
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
                 for(var k=0; k<cntrl.length; k++){
                     d3.select(cntrl[k]).style('width', '100%')
                     .call(combo);
                 }
             }

            //go to next row in array if neccessary
            data.rowNumber++;
            _importRow(data.rowArray,data.rowNumber,data.modalbg);
         });
    };


    /**
    * @desc Validate input fields.
    * @param row - ingested row.
    **/
    var _validateInput = function(row) {
        //check if layer with same name already exists...
        if(row.select('.reset.LayerName').value()==='' || row.select('.reset.LayerName').value()===row.select('.reset.LayerName').attr('placeholder')){
            d3.select('#importprogdiv').append('br');
            d3.select('#importprogdiv').append('text').text('ERROR: Invalid output layer name...');
            return false;
        }

        var newLayerName = row.select('.reset.LayerName').value() + d3.select('#customSuffix').value();

        if(!_.isEmpty(_.filter(_.map(_.pluck(context.hoot().model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f === newLayerName;})))
        {
            d3.select('#importprogdiv').append('br');
            d3.select('#importprogdiv').append('text').text('A layer already exists with this name. Please remove the current layer or select a new name for this layer.');
            return false;
        }

        var resp = context.hoot().checkForUnallowedChar(newLayerName);
        if(resp !== true){
            d3.select('#importprogdiv').append('br');
            d3.select('#importprogdiv').append('text').text(resp);
            return false;
        }

        return true;
    };

    /**
    * @desc A row import request handler.
    * @param rowArray - Array of rows.
    * @param rowNumber - current row index.
    * @param modalbg - Form container div.
    **/
    var _importRow = function(rowArray, rowNumber, modalbg){
        var row = d3.select(rowArray[rowNumber]);
        if(row.empty()){
            modalbg.remove();
            return;
        }

        var isValid = _validateInput(row);
        if(!isValid) {
            return;
        }

        var importText = _submitExp.select('span').text();
        if(importText === 'Import'){

            var newLayerName = row.select('.reset.LayerName').value().concat(d3.select('#customSuffix').value());
            context.hoot().model.import.importData(row,
                '.reset.Schema',
                '.reset.importImportType',
                null,
                newLayerName,
                '.reset.bulkImportDatasetFGDBFeatureClasses',
                function(status){
                if(status.info==='complete'){
                    if(_isCancel === false){
                        _loadPostProcess(row,rowArray,rowNumber,modalbg);
                    }
                } else if(status.info==='uploaded'){
                    _jobIds = status.jobids;
                    _mapIds = status.mapids;
                    _submitExp.select('span').text('Cancel');
                } else if(status.info === 'failed'){
                    var errorMessage = status.error || 'Import has failed or partially failed. For detail please see Manage->Log.';
                    d3.select('#importprogdiv').append('br');
                    d3.select('#importprogdiv').append('text').text(errorMessage);
                    _loadPostProcess(row,rowArray,rowNumber,modalbg);
                }
            });
        } else if (importText === 'Cancel') {
            _cancelJob(rowArray,rowNumber,modalbg);
        }
    };


    /**
    * @desc Helper function for valiating loaded data.
    * @param selType - Selected import type.
    * @param filesList - Selected files list.
    * @param cntParam - Selected file type count transfer object.
    * @param totalFileSize - total physical size of selected files.
    **/
    var _validateLoaded = function(selType, filesList, cntParam, totalFileSize) {
        if(selType === 'FILE'){
            var isValid = true;
            _.each(filesList, function(f){
                var grp = _.find(filesList, function(m){
                    return m.name === f.name;
                });
                if(grp.isSHP){
                    if(!grp.isSHX || !grp.isDBF){
                        isValid = false;
                    }
                }


            });

            if(!isValid){
                iD.ui.Alert('Missing shapefile dependency. Import requires shp, shx and dbf.','warning',new Error().stack);
                return false;
            }
        }

        var totalCnt = cntParam.shpCnt + cntParam.osmCnt + cntParam.zipCnt;
        if((cntParam.shpCnt > 0 && cntParam.shpCnt !== totalCnt) || (cntParam.osmCnt > 0 && cntParam.osmCnt !== totalCnt)
            || (cntParam.zipCnt > 0 && cntParam.zipCnt !== totalCnt)){
            iD.ui.Alert('Please select only single type of files. (i.e. can not mix zip with osm)','warning',new Error().stack);
            return false;
        }

        if(cntParam.osmCnt > 1) {
            iD.ui.Alert('Multiple osm files can not be ingested. Please select one.','warning',new Error().stack);
            return false;
        }


        if(totalFileSize > iD.data.hootConfig.ingest_size_threshold){
            var thresholdInMb = Math.floor((1*iD.data.hootConfig.ingest_size_threshold)/1000000);
            if(!window.confirm('The total size of ingested files are greater than ingest threshold size of ' +
                thresholdInMb + 'MB and it may have problem. Do you wish to continue?')){
                return false;
            }
        }

        return true;
    };

    /**
    * @desc Selected multiparts data processor.
    **/
    var _multipartHandler = function () {
        var filesList=[];
        var selRowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
        var selType = _getTypeName(d3.select('.reset.importImportType[row="' + selRowNum + '"]').value());

        if(!selType){
            iD.ui.Alert('Please select Import Type.','warning',new Error().stack);
            return;
        }

        var cntParam = {};
        cntParam.osmCnt = 0;
        cntParam.shpCnt = 0;
        cntParam.zipCnt = 0;
        var fileNames = [];
        var totalFileSize = 0;
        for (var l = 0; l < document.getElementById('ingestfileuploader-'+selRowNum)
            .files.length; l++) {
            var curFile = document.getElementById('ingestfileuploader-'+selRowNum)
                .files[l];
            totalFileSize += curFile.size;
            var curFileName = curFile.name;

            fileNames.push(curFileName);
            if(l === 0){
                if(selType === 'DIR'){
                    var parts = curFile.webkitRelativePath.split('/');
                    var folderName = parts[0];
                    if(folderName.length > 4){
                        var ext = folderName.substring(folderName.length - 4);
                        var fgdbName = folderName.substring(0, folderName.length - 4);
                        if(ext.toLowerCase() !== '.gdb'){
                            iD.ui.Alert('Please select valid FGDB.','warning',new Error().stack);
                            return;
                        } else {
                            var inputName = d3.select('.reset.LayerName[row="' + selRowNum + '"]').value();
                            if(!inputName){
                                 d3.select('.reset.LayerName[row="' + selRowNum + '"]').value(fgdbName);
                            }
                        }
                    }
                }
            }

            if(selType === 'FILE'){

               _setFileMetaData(curFileName, filesList, cntParam);
            }
        }

        var isValid = _validateLoaded(selType, filesList, cntParam, totalFileSize);

        if(!isValid) {
            return;
        }

        d3.select('.reset.fileImport[row="' + selRowNum + '"]').value(fileNames.join('; '));
        var first = fileNames[0];
        var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
        d3.select('.reset.LayerName[row="' + selRowNum + '"]').value(saveName);
    };

    /**
    * @desc Collects selected multiparts data information for validation.
    * @param curFileName - Selected file name.
    * @param cntParam - Selected file type count transfer object.
    * @param  filesList - Selected files list.
    **/
    var _setFileMetaData = function(curFileName, filesList, cntParam)
    {
        var fName = curFileName.substring(0, curFileName.length - 4);
        // I guess only way to deal with shp.xml extension
        if(curFileName.toLowerCase().indexOf('.shp.xml') > -1){
            fName = curFileName.substring(0, curFileName.length - 8);
        }


        var fObj = _.find(filesList, function(f){
            return f.name === fName;
        });

        if(!fObj){
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
            cntParam.shpCnt++;
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
            cntParam.osmCnt++;
            fObj.isOSM = true;
        }

        if(curFileName.toLowerCase().lastIndexOf('.zip') > -1){
            cntParam.zipCnt++;
            fObj.isZIP = true;
        }
    };


    /**
    * @desc Populate available translations.
    * @param a - Translations list combo meta data.
    **/
    var _translationComboHandler = function(a) {
        var combo = d3.combobox()
            .data(_.map(a.combobox.data,function(n){
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                };
            }));

        d3.select(this).style('width','100%').call(combo);
    };

    /**
    * @desc Populated import types drop down.
    * @param a - Import types list combo meta data.
    **/
    var _importTypeComboHandler = function(a) {
        var comboImportType = d3.combobox()
            .data(_.map(a.combobox.data, function (n) {
                return {
                    value: n.title,
                    title: n.title
                };
            }));


        d3.select(this)
            .style('width', '100%')
            .attr('readonly',true)
            .call(comboImportType)
            .on('change', _ingestTypeChangeHandler);
    };

    /**
    * @desc Populate existing folders list.
    * @param a - Folder list combo meta data.
    **/
    var _folderListComboHandler = function(a) {
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

        d3.select(this)
            .style('width', '100%')
            .call(comboPathName);
    };



    /**
    * @desc Adds new row of ingest input fields.
    * @param tbl - Bulk import list table div.
    **/
    var _addRow = function(tbl){
        if(_rowNum>10){
            iD.ui.Alert('Please limit bulk import to 10 datasets or less.','warning',new Error().stack);
            return;
        }

        tbl.append('tr').attr('id','row-' + _rowNum)
        .selectAll('td')
        .data(function(row, i) {
            // evaluate column objects against the current row
            return _columns.map(function(c) {
                var cell = {};
                d3.keys(c).forEach(function(k) {
                    cell[k] = typeof c[k] === 'function' ? c[k](row,i) : c[k];
                });
                return cell;
            });
        }).enter()
        .append('td')
        .append('div').classed('contain bulk-import',true).append('input')
        .attr('class', function(d){return 'reset  bulk-import ' + d.type;})
        .attr('row',_rowNum)
        .attr('placeholder',function(d){return d.placeholder;})
        .select(function (a) {
            if(a.type==='LayerName'){
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



            if (a.readonly){
                d3.select(this).attr('readonly',true);
            }

            if (a.icon) {
                if(a.type==='deleteRow'){
                    var parentNode = d3.select(this.parentNode);
                    d3.select(this).remove();
                    parentNode.append('span')
                        .classed('point _icon trash pad0x', true)
                        .attr('id', 'deleterow-'+ _rowNum)
                        .on('click',function(){
                            var rowid = this.id.replace('delete','');
                            d3.select('#'+rowid).remove();
                        });
                } else {
                    d3.select(this.parentNode)
                        .append('span')
                        .classed('point pin-right pad0x hidden', true)
                        .call(iD.svg.Icon('#icon-folder'))
                        .attr('id', 'ingestfileuploaderspancontainer-'+ _rowNum)
                        .append('input')
                        .attr('id', 'ingestfileuploader-'+ _rowNum)
                        .attr('type', 'file')
                        .attr('multiple', 'true')
                        .attr('accept', '.shp,.shx,.dbf,.prj,.osm,.zip')
                        .classed('point pin-top', true)
                        .style({
                            'text-indent': '-9999px',
                            'width': '31px',
                            'height': '31px'
                        })
                        .on('change', _multipartHandler);
                }
            }

            if(a.combobox){
                if(a.combobox.command) {
                    a.combobox.command.call(this, a);
                }
            }

        });

        _rowNum++;
    };

    /**
    * @desc Helper function that translates type description to unique name.
    * @param desc - Description.
    **/
    var _getTypeName = function (desc){
        var comboData = _form.select('.reset.importImportType').datum();
        var typeName = '';
        for(var i=0; i<comboData.combobox.data.length; i++){
            var o = comboData.combobox.data[i];
            if(o.title === desc){
                typeName = o.value;
                break;
            }

        }
        return typeName;
    };

    /**
    * @desc Modify multipart control based on selected import type.
    **/
    var _ingestTypeChangeHandler = function(){
        var selRowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');

        d3.select('.reset.Schema[row="' + selRowNum + '"]').value('');
        var selectedType = d3.select(this).value();
        var typeName = _getTypeName(selectedType);

        if(typeName === 'DIR'){
            d3.select('#ingestfileuploader-'+selRowNum)
            .attr('multiple', 'false')
            .attr('accept', null)
            .attr('webkitdirectory', '')
            .attr('directory', '');
        } else if(typeName === 'GEONAMES') {
            d3.select('#ingestfileuploader-'+selRowNum)
            .attr('multiple', 'false')
            .attr('accept', '.geonames,.txt')
            .attr('webkitdirectory', null)
            .attr('directory', null);
        } else if(typeName === 'OSM') {
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

        /* Updated to allow for OSM translation for all input types - issue 710 */
        var translationsList = _importTranslations.concat(_importTranslationsOsm);

        //var translationsList = _importTranslations;
        if(typeName === 'GEONAMES'){
            translationsList = _importTranslationsGeonames;
        }  /*else if(typeName === 'OSM') {
            translationsList = _importTranslationsOsm;
        }*/
        var comboData = d3.select('.reset.Schema[row="' + selRowNum + '"]').datum();
        comboData.combobox = translationsList;
        var combo = d3.combobox()
            .data(_.map(translationsList, function (n) {
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                };
            }));

        d3.select('.reset.Schema[row="' + selRowNum + '"]')
             .style('width', '100%')
                .call(combo);
        if(typeName === 'GEONAMES'){
            d3.select('.reset.Schema[row="' + selRowNum + '"]').value(_importTranslationsGeonames[0].DESCRIPTION);
        } else if(typeName === 'OSM'){
            d3.select('.reset.Schema[row="' + selRowNum + '"]').value(_importTranslationsOsm[0].DESCRIPTION);
        }

        d3.select('#ingestfileuploaderspancontainer-'+selRowNum).classed('hidden', false);

    };


    /**
    * @desc Reset global variables.
    **/
    var _reset = function() {
        _trans = null;

        _importTranslations = null;
        _importTranslationsGeonames = null;
        _importTranslationsOsm = null;

        _isCancel = false;
        _jobIds = null;
        _mapIds = null;

        _rowNum = 0;
        _columns = null;

        _table = null;
        _modalbg = null;
        _form = null;

        _submitExp = null;
    };

    return d3.rebind(_instance, _events, 'on');
};
