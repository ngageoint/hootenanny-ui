/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.bulkexportdataset exports multiple datasets.
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      10 August 2017
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.bulkexportdataset = function(context) {
    var _events = d3.dispatch('cancelSaveLayer');
    var _instance = {};

    var _trans;

    var _exportTranslations;
    var _exportFormatList;

    var _isCancel = false;

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
            {label:'Export Translation Schema', readonly:'readonly', placeholder: 'OpenStreetMap.org (OSM)', type: 'Schema', combobox: {data:_exportTranslations, command:_translationComboHandler}},
            {label:'Export Hoot Status (OSM Only)', type: 'exportTextStatus', checkbox: true},
            {label:'Export Format', placeholder:'Open Street Map (OSM)',type:'fileExportType',combobox: {data:_exportFormatList, command:_formatComboHandler}},
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
            .text('Export Multiple Datasets')
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
        colgroup.append('col').attr('span','4').style('width','100%');
        colgroup.append('col').style('width','30px');

        _table.append('thead').append('tr')
            .selectAll('th')
            .data(_columns).enter()
            .append('th')
            .attr('class',function(d){return d.cl;})
            .classed('pad0y strong fill-light round-top keyline-bottom', true)
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
            _updateExportText('Starting export process...');

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
        
        var newLayerName = row.select('.reset.fileExport').value();
        _exportDatasetJob(row, newLayerName, function(){
            rowNumber++;
            if(rowNumber < rowArray.length){_exportRow(rowArray, rowNumber, modalbg);}
            else{
                _submitExp.select('span').text('Export Complete!');
                _closeContainer();
            }
        });
    };


    var _exportDatasetJob = function(row, layerName, callback){
        _updateExportText('Exporting ' + layerName);

        var transType, transName, oTrans;

        transType = row.select('.Schema').value() || row.select('.Schema').attr('placeholder');
        var comboData = row.select('.Schema').datum();

        for(var i=0; i<comboData.combobox.data.length; i++){
            var o = comboData.combobox.data[i];
            if(o.DESCRIPTION === transType){
                transName = o.NAME;
                oTrans = o;
                break;
            }
        }

        var exportType = row.select('.fileExportType').value() || row.select('.fileExportType').attr('placeholder');

        var _fakeContainer = {
            'outputname': layerName,
            'exporttype': exportType,
            'trans': transType,
            'transName': transName,
            'oTrans': oTrans,
            'appendTemplate': false,
            'exportTextStatus': row.select('.exportTextStatus').property('checked')
        };

        var _dataset = { 
            'name': row.select('.fileExport').value(), 
            'id': row.select('.fileExport').attr('lyr-id')
        };

        context.hoot().model.export.exportData(_fakeContainer, _dataset, function(status){
            if(status === 'failed'){
                iD.ui.Alert('Export has failed or partially failed. For detail please see Manage->Log.','warning',new Error().stack);
                _updateExportText('FAILURE: ' + layerName + ' was not successfully exported.');
                if(callback){callback();}
            } else {
                _updateExportText(layerName + ' has been successfully exported.');
                if(callback){callback();}
            }
        });
    };


    /**
    * @desc Cancels bulk export request.
    **/
    var _cancelJob = function() {
        _isCancel = true;
        _submitExp.select('span').text('Cancelling Jobs');
        _updateExportText('Cancelling remaining jobs...');
        _events.cancelSaveLayer();
        _closeContainer();
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
    };
   
    /**
    * @desc Adds new row of ingest input fields.
    * @param tbl - Bulk export list table div.
    **/
    var _addRow = function(tbl, exportList){
        if(_rowNum>10){
            iD.ui.Alert('Please limit bulk export to 10 datasets or less.','warning',new Error().stack);            
        }

        _.each(exportList,function(lyr){
            tbl.append('tr').attr('id','row-' + _rowNum).style('border-bottom','1px lightgray solid')
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
                .append('div').classed('contain bulk-export form-field fill-white small round space-bottom1',true).append('input')
                .attr('class', function(d){return 'reset  bulk-export ' + d.type;})
                .attr('row',_rowNum)
                .attr('placeholder',function(d){return d.placeholder;})
                .select(function (a) {
                    if(a.type==='fileExport'){
                        d3.select(this).value(lyr.name).attr('lyr-id',lyr.id);
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
                        //since placeholder is OSM, do not disable
                        d3.select(this).attr('type','checkbox');
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

        _rowNum = 0;
        _columns = null;

        _table = null;
        _modalbg = null;
        _form = null;

        _submitExp = null;
    };

    return d3.rebind(_instance, _events, 'on');
};
