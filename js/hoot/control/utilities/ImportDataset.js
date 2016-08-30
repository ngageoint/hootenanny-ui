/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.importdataset represents control for ingesting data sources like shapefile, osm,
// geoname  or FileGdb
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      17 Feb. 2016
//      15 Apr. 2016 eslint updates -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


Hoot.control.utilities.importdataset = function(context) {
    var _events = d3.dispatch();
    var _instance = {};

    var _trans;
    var _container;

    var _importTranslations;
    var _importTranslationsGeonames;
    var _importTranslationsOsm;

    var _isCancel = false;
    var _jobIds = null;
    var _mapIds = null;
    var _bInfo;


    /**
    * @desc Entry point where it creates form.
    * @param trans - Translation meta data.
    * @param incomingFolder - User selected folder.
    **/
    _instance.importDataContainer = function (trans, incomingFolder) {
        _createContainer(trans, incomingFolder);
    };


    /**
    * @desc Internal form creator.
    * @param trans - Translation meta data.
    * @param incomingFolder - User selected folder.
    **/
    var _createContainer = function(trans,incomingFolder) {
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

        _bInfo = context.hoot().getBrowserInfo();
        if(_.isEmpty(_bInfo)){
            _bInfo = {};
            _bInfo.name = 'Unknown';
            _bInfo.version = 'Unknown';
        }

        _instance.getImportTranslations(_trans, _importTranslations,
                _importTranslationsGeonames, _importTranslationsOsm);

        var importTypes = _instance.getImportTypes();



        context.hoot().model.folders.listFolders(context.hoot().model.folders.getAvailFolders());
        var folderList = _.map(context.hoot().model.folders.getAvailFolders(),_.clone);

        var folderPlaceholder = 'root';
        if(incomingFolder){
            var folderId = incomingFolder.id ? incomingFolder.id : 0;
            if(folderId > 0){
                var match = _.find(folderList,{id:folderId});
                if(match){
                    if(match){folderPlaceholder = match.folderPath;}
                }
            }
        }

        var d_form = [{
            label: 'Import Type',
            placeholder: 'Select Import Type',
            id: 'importDatasetImportType',
            combobox: {'data':importTypes, 'command': _populateImportTypes },
            inputtype: 'combobox'
        }, {
            label: 'Import Data',
            id: 'importDatasetFileImport',
            placeholder: 'Select File',
            icon: 'folder',
            readonly:'readonly',
            inputtype:'multipart',
            onchange: _multipartHandler,
            multipartid: 'ingestfileuploader'
        },
        {
            label: 'Layer Name',
            placeholder: 'Save As',
            id: 'importDatasetLayerName',
            onchange: _validateInput
        }, {
            label: 'Path',
            placeholder: folderPlaceholder,
            id: 'importDatasetPathName',
            combobox: {'data':folderList, 'command': _populateFolderList },
            inputtype: 'combobox'
        }, {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            placeholder:'',
            id:'importDatasetNewFolderName',
            onchange: _validateInput
        }, {
            label: 'Translation Schema',
            placeholder: 'Select Data Translation Schema',
            id: 'importDatasetSchema',
            combobox: {'data':_importTranslations, 'command': _populateTranslations },
            inputtype: 'combobox'
        }];


        var d_btn = [
                        {
                            text: 'Import',
                            location: 'right',
                            id: 'importDatasetBtnContainer',
                            ishidden: true,
                            onclick: _submitClickHandler
                        }
                    ];

        var meta = {};
        meta.title = 'Add Data';
        meta.form = d_form;
        meta.button = d_btn;

        _container = context.hoot().ui.formfactory.create('body', meta);
    };

    /**
    * @desc Validates user specified input.
    **/
    var _validateInput = function() {
        //ensure output name is valid
        var resp = context.hoot().checkForUnallowedChar(this.value);
        if(resp !== true){
            d3.select(this).classed('invalidName',true).attr('title',resp);
        } else {
            d3.select(this).classed('invalidName',false).attr('title',null);
        }
    };

    /**
    * @desc Ingest request click handler.
    **/
    var _submitClickHandler = function () {
        var submitExp = d3.select('#importDatasetBtnContainer');
        //check if layer with same name already exists...
        if(!d3.selectAll('.invalidName').empty()){return;}

        if(_container.select('#importDatasetLayerName').value()==='' ||
         _container.select('#importDatasetLayerName').value()===_container.select('#importDatasetLayerName').attr('placeholder')){
            iD.ui.Alert('Please enter an output layer name.','warning',new Error().stack);
            return;
        }

        if(!_.isEmpty(_.filter(_.map(
            _.pluck(context.hoot().model.layers.getAvailLayers(),'name'),
                function(l){
                    return l.substring(l.lastIndexOf('|')+1);
                }),
            function(f){
                return f === _container.select('#importDatasetLayerName').value();
            }))
        )
        {
            iD.ui.Alert('A layer already exists with this name. Please remove the current layer or select a new name for this layer.','warning',new Error().stack);
            return;
        }

        var resp = context.hoot().checkForUnallowedChar(_container.select('#importDatasetLayerName').value());
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return;
        }

        resp = context.hoot().checkForUnallowedChar(_container.select('#importDatasetNewFolderName').value());
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return;
        }

        var parId = context.hoot().model.folders.getfolderIdByName(_container.select('#importDatasetPathName').value()) || 0;
        resp = context.hoot().model.folders.duplicateFolderCheck({name:_container.select('#importDatasetNewFolderName').value(),parentId:parId});
        if(resp !== true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return;
        }



        var importText = submitExp.select('span').text();
        if(importText === 'Import') {
            _performImport(submitExp);
        } else if(importText === 'Cancel'){
            _cancelJob();
        }

    };

    /**
    * @desc Ingest request executioner.
    * @param submitExp - Submit control container.
    **/
    var _performImport = function(submitExp) {
        submitExp.select('span').text('Uploading ...');
        submitExp
            .insert('div',':first-child')
            .classed('_icon _loading row1 col1 fr',true)
            .attr('id', 'importspin');

        var progcont = submitExp.append('div');
        progcont.classed('form-field', true);

        /*      
        var prog = progcont.append('span').append('progress');
        prog.classed('form-field', true);
        prog.value('0');
        prog.attr('max', '100');
        prog.attr('id', 'importprogress');
        */

        var progdiv = progcont.append('div');
        progdiv.attr('id','importprogdiv')
            .style('max-height','24px')
            .style('overflow','hidden');

        progdiv.append('text')
            .attr('id', 'importprogresstext')
            .attr('dy', '.3em').text('Initializing ...');

       /*
       var progShow = progcont.append('a');
        progShow.attr('id','importprogressshow')
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
        */

            context.hoot().model.import.importData(_container,
                '#importDatasetSchema',
                '#importDatasetImportType',
                '#importDatasetNewFolderName',
                '#importDatasetLayerName',
                '#importDatasetFGDBFeatureClasses',
                function(status){
                if(status.info === 'complete'){
                    if(_isCancel === false){
                        _container.remove();

                        var pathname = _container.select('#importDatasetPathName').value();
                        if(pathname===''){pathname=_container.select('#importDatasetPathName').attr('placeholder');}
                        if(pathname==='root'){pathname='';}
                        var pathId = context.hoot().model.folders.getfolderIdByName(pathname) || 0;

                        //determine if a new folder is being added
                        var newfoldername = _container.select('#importDatasetNewFolderName').value();

                        var folderData = {};
                        folderData.folderName = newfoldername;
                        folderData.parentId = pathId;
                        context.hoot().model.folders.addFolder(folderData,function(a){
                            //update map linking
                            var link = {};
                            link.folderId = a;
                            link.mapid=0;
                            if(_container.select('#importDatasetLayerName').value())
                            {
                                link.mapid =_.pluck(_.filter(context.hoot().model.layers.getAvailLayers(),
                                function(f){
                                    return f.name === _container.select('#importDatasetLayerName').value();
                                }),'id')[0] || 0;
                            }
                            if(link.mapid===0){return;}
                            link.updateType='new';
                            context.hoot().model.folders.updateLink(link);
                            link = {};
                        });

                    }

                } else if(status.info === 'uploaded'){
                    _jobIds = status.jobids;
                    _mapIds = status.mapids;
                    submitExp.select('span').text('Cancel');
                } else if(status.info === 'failed'){
                    var errorMessage = status.error || 'Import has failed or partially failed. For detail please see Manage->Log.';
                    iD.ui.Alert(errorMessage,'error',new Error().stack);
                    _container.remove();
                }

            });

    };

    /**
    * @desc Ingest request job cancel.
    **/
    var _cancelJob = function() {
        _isCancel = true;
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

    var _cancelJobCallback = function(curJobId){
        iD.ui.Alert('Job ID: ' + curJobId + ' has been cancelled. ','notice');

        context.hoot().model.layers.refresh(function () {
            var combo = d3.combobox().data(_.map(context.hoot().model.layers.getAvailLayers(), function (n) {
                return {
                    value: n.name,
                    title: n.name
                };
            }));
            var controls = d3.selectAll('#importDatasetFileImport');
            var cntrl;

            for (var j = 0; j < controls.length; j++) {
                cntrl = controls[j];
                // for each of subitems
                for(var k=0; k<cntrl.length; k++){
                    d3.select(cntrl[k]).style('width', '100%')
                    .call(combo);
                }
            }

            //var datasettable = d3.select('#datasettable');
            //context.hoot().view.utilities.dataset.populateDatasetsSVG(datasettable);
            _container.remove();
        });
    };


    /**
    * @desc Helper function that translates type description to unique name.
    * @param desc - Description.
    **/
    var _getTypeName = function(desc){
        var comboData = _container.select('#importDatasetImportType').datum();
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
    * @desc Populate existing folders list.
    * @param a - Folder list combo meta data.
    **/
    var _populateFolderList = function (a) {
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

        d3.select(this).attr('readonly',true);
    };

    /**
    * @desc Populate available translations.
    * @param a - Translations list combo meta data.
    **/
    var _populateTranslations = function (a) {
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
    };

    /**
    * @desc Modify multipart control based on selected import type.
    * @param typeName - Import type name.
    **/
    var _setMultipartForType = function(typeName) {
        var isDir = false;
        if(typeName === 'DIR'){
            isDir = true;
            if(_bInfo.name.substring(0,3) === 'Chr'){
                d3.select('#ingestfileuploader')
                .property('multiple', false)
                .attr('accept', null)
                .attr('webkitdirectory', '')
                .attr('directory', '');
            } else {
                d3.select('#ingestfileuploader')
                .property('multiple', false)
                .attr('accept', '.zip')
                .attr('webkitdirectory', null)
                .attr('directory', null);
            }
        } else if(typeName === 'GEONAMES') {
            d3.select('#ingestfileuploader')
            .property('multiple', 'false')
            .attr('accept', '.geonames')
            .attr('webkitdirectory', null)
            .attr('directory', null);
        } else if(typeName === 'OSM') {
            d3.select('#ingestfileuploader')
            .property('multiple', 'false')
            .attr('accept', '.osm,.osm.zip,.pbf')
            .attr('webkitdirectory', null)
            .attr('directory', null);
        } else {
            d3.select('#ingestfileuploader')
            .property('multiple', 'true')
            .attr('accept', null)
            .attr('webkitdirectory', null)
            .attr('directory', null);
        }

        if(!d3.select('#importDatasetFGDBFeatureClasses').empty()) {
            if(isDir) {
                d3.select(d3.select('#importDatasetFGDBFeatureClasses')
                    .node().parentNode).classed('hidden',false);
            } else {
                d3.select(d3.select('#importDatasetFGDBFeatureClasses')
                    .node().parentNode).classed('hidden',true);
            }
        }

    };


    /**
    * @desc Populated import types drop down.
    * @param a - Import types list combo meta data.
    **/
    var _populateImportTypes = function(a) {
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
        .on('change', function(){
            d3.select('importDatasetFileImport').value('');
            d3.select('#importDatasetLayerName').value('');
            d3.select('#importDatasetSchema').value('');
            var selectedType = _container.select('#importDatasetImportType').value();
            var typeName = _getTypeName(selectedType);

            _setMultipartForType(typeName);


            var translationsList = _importTranslations;

            if(typeName === 'GEONAMES'){
                translationsList = _importTranslationsGeonames;
            } else if(typeName === 'OSM') {
                translationsList = _importTranslationsOsm;
            }


            var comboData = d3.select('#importDatasetSchema').datum();
            comboData.combobox = translationsList;
            var combo = d3.combobox()
                .data(_.map(translationsList, function (n) {
                    return {
                        value: n.DESCRIPTION,
                        title: n.DESCRIPTION
                    };
                }));

            d3.select('#importDatasetSchema')
                 .style('width', '100%')
                    .call(combo);
            if(typeName === 'GEONAMES'){
                d3.select('#importDatasetSchema').value(_importTranslationsGeonames[0].DESCRIPTION);
            } else if(typeName === 'OSM'){
                d3.select('#importDatasetSchema').value(_importTranslationsOsm[0].DESCRIPTION);
            }

            d3.select('#ingestfileuploaderspancontainer').classed('hidden', false);

        });
    };

    /**
    * @desc Collects selected multiparts data information for validation.
    * @param curFileName - Selected file name.
    * @param cntParam - Selected file type count transfer object.
    * @param  filesList - Selected files list.
    **/
    var _setFileMetaData = function(curFileName, cntParam, filesList)
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
    * @desc Selected multiparts data processor.
    **/
    var _multipartHandler = function() {

        var filesList=[];

        // for chrome only for webkit
        var selType = _getTypeName(_container.select('#importDatasetImportType').value());

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
        for (var l = 0; l < document.getElementById('ingestfileuploader').files.length; l++) {
            var curFile = document.getElementById('ingestfileuploader').files[l];
            totalFileSize += curFile.size;
            var curFileName = curFile.name;

            fileNames.push(curFileName);
            if(l === 0){

                if(selType === 'DIR'){
                    if(_bInfo.name.substring(0,3) === 'Chr'){
                        var parts = curFile.webkitRelativePath.split('/');
                        var folderName = parts[0];
                        if(folderName.length > 4){
                            var ext = folderName.substring(folderName.length - 4);
                            var fgdbName = folderName.substring(0, folderName.length - 4);
                            if(ext.toLowerCase() !== '.gdb'){
                                iD.ui.Alert('Please select valid FGDB.','warning',new Error().stack);
                                return;
                            } else {
                                var inputName = _container.select('#importDatasetLayerName').value();
                                if(!inputName){
                                    _container.select('#importDatasetLayerName').value(fgdbName);
                                }
                            }

                        }
                    }

                }
            }



            if(selType === 'FILE'){
                _setFileMetaData(curFileName, cntParam, filesList);
            }
        }

        var isValid = _validateLoaded(selType, filesList, cntParam, totalFileSize);

        if(!isValid) {
            return;
        }


        if(selType === 'DIR'){
                _container.select('#importDatasetFileImport').value(folderName);
                _container.select('#importDatasetLayerName').value(fgdbName);
        } else {
            _container.select('#importDatasetFileImport').value(fileNames.join('; '));
            var first = fileNames[0];
            var saveName = first.indexOf('.') ? first.substring(0, first.indexOf('.')) : first;
            _container.select('#importDatasetLayerName').value(saveName);
        }



        d3.select('#importDatasetBtnContainer')
            .classed('hidden', false);

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
                iD.ui.Alert('Missing shapefile dependency. Import requires shp, shx and dbf.','warning',new Error().stack );
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
    * @desc Helper function to return import types.
    **/
    _instance.getImportTypes = function() {
        if(!_bInfo) {
            _bInfo = context.hoot().getBrowserInfo();
            if(_.isEmpty(_bInfo)){_bInfo = {'name':'Unknown','version':'Unknown'};}
        }

        var importTypes = [];
        var fileTypes = {};
        fileTypes.value = 'FILE';
        fileTypes.title = 'File (shp,zip,gdb.zip)';
        importTypes.push(fileTypes);

        var osmTypes = {};
        osmTypes.value = 'OSM';
        osmTypes.title = 'File (osm,osm.zip,pbf)';
        importTypes.push(osmTypes);

        var geonameTypes = {};
        geonameTypes.value = 'GEONAMES';
        geonameTypes.title = 'File (geonames)';
        importTypes.push(geonameTypes);

        var dirType = {};
        dirType.value = 'DIR';
        dirType.title = 'Directory (FGDB)';

        if(_bInfo.name.substring(0,3) === 'Chr'){importTypes.push(dirType);}


        return importTypes;
    };

    /**
    * @desc Helper function to return import types.
    **/
    _instance.getImportTranslations = function(trans, importTranslations,
        importTranslationsGeonames, importTranslationsOsm) {
        _.each(trans, function(t){
            if(t.NAME === 'GEONAMES'){
                importTranslationsGeonames.push(t);
            } else if(t.NAME === 'OSM'){
                var emptyObj = {};
                emptyObj.NAME = 'NONE';
                emptyObj.PATH = 'NONE';
                emptyObj.DESCRIPTION = 'No Translation';
                emptyObj.NONE = 'true';
                importTranslationsOsm.push(emptyObj);

                importTranslationsOsm.push(t);
            } else {
                importTranslations.push(t);
            }
        });
    };





    return d3.rebind(_instance, _events, 'on');
};
