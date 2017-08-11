/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.bulkexportdataset exports multiple datasets.
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      10 August 2017
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.bulkexportdataset = function(context) {
    var _events = d3.dispatch();
    var _instance = {};

    var _trans;

    var _exportTranslations;

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
    _instance.bulkExportDataContainer = function(exportList, trans) {
        _reset();
        _createContainer(exportList, trans);
    };

    /**
    * @desc Internal form creation.
    * @param trans - Translations list.
    **/
    var _createContainer = function(exportList, trans) {
        _trans = trans;
        if(_trans.length === 1){
            var emptyObj = {};
            emptyObj.NAME = '';
            emptyObj.DESCRIPTION = '';
            _trans.push(emptyObj);
        }

        _exportTranslations = trans.filter(function(d) {return d.CANEXPORT===true;});

        _exportFormatList = 
            [   {'DESCRIPTION': 'File Geodatabase'}, 
                {'DESCRIPTION': 'Shapefile'},
                {'DESCRIPTION': 'Open Street Map (OSM)'},
                {'DESCRIPTION': 'Open Street Map (PBF)'}
            ];

        _rowNum = 0;

        _columns = [
            {label:'Dataset', placeholder: 'Dataset', type: 'fileExport', readonly:'readonly'},
            {label:'Export Translation Schema', readonly:'readonly', placeholder: 'Schema', type: 'Schema', combobox: {data:_exportTranslations, command:_translationComboHandler}},
            {label:'Export Hoot Status (OSM Only)', type: 'exportTextStatus', checkbox: true},
            {label:'Export Format', placeholder:'Export Type',type:'fileExportType',combobox: {data:_exportFormatList, command:_formatComboHandler}},
            {label:'Layer Name', placeholder: 'Save As',  type: 'LayerName'},           
           {label:'', placeholder:'',type:'deleteRow',icon:'trash'}
        ];

        _modalbg = _createModalBackground();
        var ingestDiv = _createFormFrame(_modalbg);
        _form = _createForm(ingestDiv);
        _createTableHeader();
        _createTableBody(ingestDiv, exportList);
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
        frm.classed('round space-bottom1 exportableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Bulk Export Datasets')
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
        _table = _form.append('table').attr('id','bulkExportTable');
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


    var _updateExportText = function(inputText){
        d3.select('#exportprogdiv').append('br');
        d3.select('#exportprogdiv').append('text').text(inputText);
    };

    /**
    * @desc Toggler for progress detail messages.
    **/
    var _showProgressDetail = function() {
        var expanded = !JSON.parse(d3.select(this).attr('expanded'));
        d3.select(this).attr('expanded',expanded);
        if(expanded){
            d3.select('#exportprogdiv').style('max-height',undefined).style({'min-height':'48px','max-height':'300px','overflow-y':'auto'});
            d3.select(this).text('Show Less');
        } else {
            d3.select('#exportprogdiv').style('min-height',undefined).style({'min-height':'48px','max-height':'48px','overflow-y':'auto'});
            d3.select(this).text('Show More');
        }
    };

    /**
    * @desc Creates bulk export table body.
    * @param ingestDiv - ingest form div.
    **/
    var _createTableBody = function(ingestDiv, exportList) {
        _table.append('tbody');
        
        // Add row for each dataset
        var _rowContainer = d3.select('#bulkExportTable').select('tbody');
        _addRow(_rowContainer, exportList);

        _isCancel = false;
        _jobIds = null;
        _mapIds = null;
        _submitExp = ingestDiv.append('div')
            .classed('form-field col12 left ', true);

        _submitExp.append('span')
            .classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
            .text('Export')
            .on('click', _exportClickHandler);
    };


    /**
    * @desc Click handler for export request.
    **/
    var _exportClickHandler = function() {
        // If in progress, check to cancel
        var exportText = _submitExp.select('span').text();
        if(exportText === 'Cancel') {
            _cancelJob();        
        } else if(exportText === 'Export') {
            // For a sanity check, double check all inputs
            _validateInputs();
            if(!d3.selectAll('.invalidName').empty()){return;}

            _submitExp.select('span').text('Cancel');
            d3.select('#bulkExportTable').selectAll('input').attr('readonly',true);
            d3.select('#bulkExportTable').selectAll('span').on('click', null);

            //Places spinner 
            var progcont = _submitExp.append('div');
            progcont.insert('div')
                    .classed('_icon _loading row1 col1 fl',true)
                    .attr('id', 'exportspin');

            var progdiv = progcont.append('div');
            progdiv.attr('id','exportprogdiv')
                    .style('max-height','24px')
                    .style('overflow','hidden');
                    
            var logTxt = 'Initializing...';
            
            progdiv.append('text')
                    .attr('id', 'exportprogresstext')
                    .attr('dy', '.3em').text(logTxt);

            var progShow = progcont.append('a');
            progShow.attr('id','exportprogressshow')
                .classed('show-link',true)
                .attr('expanded',false)
                .text('Show More')
                .on('click',_showProgressDetail);

            //Create a log output
            _updateExportText('Starting bulk export process...');

            _performBulkExport();
        }
    };
        
    /**
    * @desc changes button to close
    **/
    var _closeContainer = function() {
        d3.select('#exportspin').remove();
        _submitExp.select('span')
            .text('Close')
            .on('click',function(){
                 _modalbg.remove();
            });
    };

    var _emptyRowCheck = function(row, rowNumber){
        if (row.select('.reset.LayerName').value()==='' ||
            row.select('.reset.Schema').value()==='' ||
            row.select('.reset.fileExportType').value()==='') {
            return true;
        } else {
            return false;
        }

    };

    /**
    * @desc Performs bulk export for all rows 
    **/
    var _performBulkExport = function(){
        //Loop through each row and treat as separate export function
        var rowArray = d3.select('#bulkExportTable').selectAll('tr[id^="row-"]')[0];
        var rowNo = 0;
        _exportRow(rowArray,rowNo, _modalbg);
    };

   /**
    * @desc A row export request handler.
    * @param rowArray - Array of rows.
    * @param rowNumber - current row index.
    * @param modalbg - Form container div.
    **/
    var _exportRow = function(rowArray, rowNumber, modalbg){
        var exportText = _submitExp.select('span').text();
        if(exportText ==='Cancelling Jobs' || exportText === 'Close') { return; }

        var row = d3.select(rowArray[rowNumber]);
        if(_emptyRowCheck(row,rowNumber)){
            rowNumber++;
            if(rowNumber < rowArray.length){_exportRow(rowArray, rowNumber, modalbg);}
            else{
                _submitExp.select('span').text('Close');
                _closeContainer();
            }
        } else {
            var newLayerName = row.select('.reset.LayerName').value();
            _exportDatasetJob(row, newLayerName, function(){
                rowNumber++;
                if(rowNumber < rowArray.length){_exportRow(rowArray, rowNumber, modalbg);}
                else{
                    _submitExp.select('span').text('Export Complete!');
                    _closeContainer();
                }
            });
        }
    };


    var _exportDatasetJob = function(row, layerName, callback){
        _updateExportText('Exporting ' + layerName);

        var transType, transName, oTrans;

        transType = row.select('.Schema').value();
        var comboData = row.select('.Schema').datum();

        for(var i=0; i<comboData.combobox.data.length; i++){
            var o = comboData.combobox.data[i];
            if(o.DESCRIPTION === transType){
                transName = o.NAME;
                oTrans = o;
                break;
            }
        }

        var _fakeContainer = {
            'outputname': layerName,
            'exporttype': row.select('.fileExportType').value(),
            'trans': transType,
            'transName': transName,
            'oTrans': oTrans,
            'appendTemplate': false,
            'exportTextStatus': row.select('.exportTextStatus').property('checked')
        };

        var _dataset = { 
            'name': row.select('.fileExport').value(), 
            'id': row.select('.fileExport').attr('lyr-id')
        }

        context.hoot().model.export.exportData(_fakeContainer, _dataset, function(status){


            if(status === 'failed'){
                iD.ui.Alert('Export has failed or partially failed. For detail please see Manage->Log.','warning',new Error().stack);
                console.log('fail');
            } else {
                console.log('success');
            }
        });
    };


    /**
    * @desc Post processor for a row ingesting.
    * @param row - ingested row.
    * @param rowNumber - current row index.
    * @param modalbg - Form container div.
    **/
    var _loadPostProcess = function(row) {
        var pathname = row.select('.reset.PathName').value();
        if(pathname===''){pathname=row.select('.reset.PathName').attr('placeholder');}
        if(pathname==='root'){pathname='';}
        var pathId = context.hoot().model.folders.getfolderIdByName(pathname) || 0;

        //update map linking
        var link = {};
        link.folderId = pathId;
        link.mapid=0;
        link.mapid=0;

        var newLayerName = row.select('.reset.LayerName').value();

        if(newLayerName)
        {link.mapid =_.pluck(_.filter(context.hoot().model.layers.getAvailLayers(),function(f){return f.name === newLayerName;}),'id')[0] || 0;}
        if(link.mapid===0){return;}
        link.updateType='new';
        context.hoot().model.folders.updateLink(link);
        link = {};
        _updateExportText(newLayerName + ' has been successfully uploaded.');

        return true;
    };

    /**
    * @desc Cancels bulk export request.
    **/
    var _cancelJob = function() {
        _isCancel = true;
        _submitExp.select('span').text('Cancelling Jobs');
        if(_jobIds && _mapIds){
            for(var i=0; i<_jobIds.length; i++){
                var curJobId = _jobIds[i];
                var curMapId = _mapIds[i];

                var data = {};
                data.jobid = curJobId;
                data.mapid = curMapId;
                Hoot.model.REST('cancel', data, _cancelJobCallback(curJobId));
            }

        }
    };

    var _cancelJobCallback = function(data){
        iD.ui.Alert('Job ID: ' + data.curJobId + ' has been cancelled. ','notice');
        _updateExportText('Job ID: ' + data.curJobId + ' has been cancelled. ');
        context.hoot().model.layers.refresh(function () {
            var combo = d3.combobox().data(_.map(context.hoot().model.layers.getAvailLayers(), function (n) {
                 return {
                     value: n.name,
                     title: n.name
                 };
             }));
             var controls = d3.selectAll('.reset.fileExport');
             var cntrl;

             for (var j = 0; j < controls.length; j++) {
                 cntrl = controls[j];
                 // for each of subitems
                 for(var k=0; k<cntrl.length; k++){
                     d3.select(cntrl[k]).style('width', '100%')
                     .call(combo);
                 }
             }

             _closeContainer();
         });
    };

    /**
    * @desc Validate input fields.
    * @param row - ingested row.
    **/
    var _validateInputs = function(){
        var rowArray = d3.select('#bulkExportTable').selectAll('tr[id^="row-"]');
        _.each(rowArray[0], function(row){
            var r = d3.select(row); 
            _validateInput(r);
        });
    };

    var _validateInput = function(row) {
        //check if layer with same name already exists...
        if(row.select('.reset.LayerName').value()==='' || row.select('.reset.LayerName').value()===row.select('.reset.LayerName').attr('placeholder')){
            _updateExportText('ERROR: Invalid output layer name...');
            return false;
        }

        var newLayerName = row.select('.reset.LayerName').value();

        if(!_.isEmpty(_.filter(_.map(_.pluck(context.hoot().model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f === newLayerName;})))
        {
            row.select('.reset.LayerName')
                .classed('invalidName',true)
                .attr('title','A layer already exists with this name. Please remove the current layer or select a new name for this layer.');
            return false;
        }

        // Check for duplicates within the table
        var inputLayerNames = _.map(d3.selectAll('.reset.LayerName')[0],function(f){return f.value;});
        if(inputLayerNames.filter(function(val){return val===row.select('.reset.LayerName').value();}).length > 1){
            row.select('.reset.LayerName')
                .classed('invalidName',true)
                .attr('title','This layer name is already being used in the bulk export process.');
            return false;            
        }

        var resp = context.hoot().checkForUnallowedChar(row.select('.reset.LayerName').value());
        if(resp !== true){
            row.select('.reset.LayerName')
                .classed('invalidName',true)
                .attr('title',resp);
            return false;
        }

        row.select('.reset.LayerName')
            .classed('invalidName',false)
            .attr('title',null);
        return true;
    };

 
    /**
    * @desc Helper function for valiating loaded data.
    * @param selType - Selected export type.
    * @param filesList - Selected files list.
    * @param cntParam - Selected file type count transfer object.
    * @param totalFileSize - total physical size of selected files.
    **/
    var _validateLoaded = function(selType, filesList, cntParam, totalFileSize) {
        var resp = true;
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
                } else {isValid = false;}


            });

            if(!isValid){
                resp = 'Missing shapefile dependency. Export requires shp, shx and dbf.';
                iD.ui.Alert(resp,'warning',new Error().stack);
                return resp;
            }
        }

        var totalCnt = cntParam.shpCnt + cntParam.osmCnt + cntParam.zipCnt;
        if((cntParam.shpCnt > 0 && cntParam.shpCnt !== totalCnt) || (cntParam.osmCnt > 0 && cntParam.osmCnt !== totalCnt)
            || (cntParam.zipCnt > 0 && cntParam.zipCnt !== totalCnt)){
            resp = 'Please select only single type of files. (i.e. can not mix zip with osm)';
            iD.ui.Alert(resp,'warning',new Error().stack);
            return resp;
        }

        if(cntParam.osmCnt > 1) {
            resp = 'Multiple osm files can not be ingested. Please select one.';
            iD.ui.Alert(resp,'warning',new Error().stack);
            return resp;
        }


        if(totalFileSize > iD.data.hootConfig.ingest_size_threshold){
            var thresholdInMb = Math.floor((1*iD.data.hootConfig.ingest_size_threshold)/1000000);
            if(!window.confirm('The total size of ingested files are greater than ingest threshold size of ' +
                thresholdInMb + 'MB and it may have problem. Do you wish to continue?')){
                return false;
            }
        }

        return resp;
    };

    /**
    * @desc Selected multiparts data processor.
    **/
    var _multipartHandler = function () {
        var filesList=[];
        var selRowNum = d3.select(this.parentElement.parentElement).select('input').attr('row');
        var selType = _getTypeName(d3.select('.reset.exportExportType[row="' + selRowNum + '"]').value());

        if(!selType){
            iD.ui.Alert('Please select Export Type.','warning',new Error().stack);
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
        if(isValid !== true){ d3.select('.reset.bulk-export.fileExport[row="' + selRowNum + '"]').attr('title',isValid).classed('invalidName',true); }
        else { d3.select('.reset.bulk-export.fileExport[row="' + selRowNum + '"]').attr('title',null).classed('invalidName',false); }
        

        d3.select('.reset.fileExport[row="' + selRowNum + '"]').value(fileNames.join('; '));
        var first = fileNames[0];
        var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
        d3.select('.reset.LayerName[row="' + selRowNum + '"]').value(saveName);
        //validate layername
        _validateInputs();
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
    * @desc Populate available formats.
    * @param a - Formats list combo meta data.
    **/
    var _formatComboHandler = function(a) {
        var combo = d3.combobox()
            .data(_.map(a.combobox.data,function(n){
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                };
            }));

        d3.select(this).style('width','100%').call(combo);
    }
   
    /**
    * @desc Adds new row of ingest input fields.
    * @param tbl - Bulk export list table div.
    **/
    var _addRow = function(tbl, exportList){
        if(_rowNum>10){
            iD.ui.Alert('Please limit bulk export to 10 datasets or less.','warning',new Error().stack);            
        }

        _.each(exportList,function(lyr){
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
                })
                .enter()
                .append('td')
                .append('div').classed('contain bulk-export',true).append('input')
                .attr('class', function(d){return 'reset  bulk-export ' + d.type;})
                .attr('row',_rowNum)
                .attr('placeholder',function(d){return d.placeholder;})
                .select(function (a) {
                    if(a.type=='fileExport'){
                        d3.select(this).value(lyr.name).attr('lyr-id',lyr.id);
                    }

                    if(a.type==='LayerName'){
                        d3.select(this).on('change',function(){
                            _validateInputs();
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
                        }
                    }

                    if(a.combobox){
                        if(a.combobox.command) {
                            a.combobox.command.call(this, a);
                        }
                    }

                    if(a.type==='Schema'){
                        d3.select(this).on('change',function(){
                            var selrow = '#row-' + d3.select(this).attr('row');
                            if(this.value==='OpenStreetMap.org (OSM)'){
                                //enable checkbox
                                d3.select(selrow).select('.exportTextStatus').attr('disabled',null);
                            } else {
                                //disable checkbox
                                d3.select(selrow).select('.exportTextStatus').attr('disabled',true).property('checked',false);
                            }
                        });
                    }

                    if(a.checkbox){
                        d3.select(this).attr('type','checkbox')
                        .attr('disabled','disabled');
                    }

                });

            _rowNum++;
        });
    };

    /**
    * @desc Helper function that translates type description to unique name.
    * @param desc - Description.
    **/
    var _getTypeName = function (desc){
        var comboData = _form.select('.reset.exportExportType').datum();
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
    * @desc Reset global variables.
    **/
    var _reset = function() {
        _trans = null;

        _exportTranslations = null;

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
