/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.tools is collection of various helper functions.
//
//  NOTE: All functions should be moved to coresponding modules and this module should be deprecated..
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//      31 May  2016 OSM API Database export type -- bwitham
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.tools = function (context) {
    var loadingLayer = {},
        loadedLayers = {},
        activeConflateLayer = {},
        ETL = context.hoot().control.import,
        view = context.hoot().control.view,
        conflate = context.hoot().control.conflate,
        conflicts = context.hoot().control.conflicts,
        exportLayer = context.hoot().control.export,
        hoot = context.hoot(),
        colors = ['violet', 'orange'],
        exporting = false;
    hoot._conflicts = conflicts;
//    hoot.view = view;
    hoot.loadedLayers = function () {
        return loadedLayers;
    };
    hoot.reset = function () {
        resetAllLayers();
    };


    /**
    * @desc Observes loaded layers and toggle confation control in sidebar
    * @param layerName - loaded layer name
    * @param add - add indicator
    * @param isPrimary - is loaded layer primary layer?
    **/
    function conflationCheck(layerName, add, isPrimary) {
        function returnNewColor() {
            var imports = d3.selectAll('.hootImport').data();
            var views = _.map(d3.selectAll('.hootView').data(), function (d) {
                return d.color;
            });
            var currentColor = _.merge(imports, views);
            return (currentColor[0] === colors[0]) ? colors[1] : colors[0];
        }

        function addImportCheck(isPrimary) {
            if (_.keys(loadedLayers).length >= 2) {
                return;
            }
            var imports = d3.selectAll('.hootImport');
            var views = d3.selectAll('.hootView');
            d3.selectAll('.hootConflate').remove();
            var layerDivLength = imports.size() + views.size();

            // If user tries to add second layer before first layer is done loading we end up with
            // third Add data button. So we check to see if we are already loading.
            // Also search on hoot.isLayerLoading.
            var loadedLayers = context.hoot().model.layers.getLayers();
            var loadedLayersLen = Object.keys(loadedLayers).length;

            if (layerDivLength === 2 || loadedLayersLen > 1) {
                return false;
            }
            if (layerDivLength === 0) {
                ETL.render(colors);
                return true;
            }
            if (layerDivLength === 1) {
                var newColor = returnNewColor();
                ETL.render([newColor], isPrimary);
                return true;
            }

        }

        function addConflationCheck() {
            var check = _.filter(loadedLayers, function (a) {
                return a.loadable;
            });
            if (check.length === 2) {
                conflate.activate(check);
            }
            else {
                conflate.deactivate(check);
            }
        }


        if (!layerName) {
            addImportCheck();
            return;
        }
        var confLayers;
        if (!add) {
            confLayers = loadedLayers[layerName].layers;
            if (confLayers) {
                conflicts.deactivate(true);
                context.hoot().mode('browse');
                _.each(confLayers, function (d) {
                    if(d){
                        context.hoot().model.layers.removeLayer(d);
                        d3.select('.layer_' + d).remove();
                        delete loadedLayers[d];
                    }
                });
            }
            delete loadedLayers[layerName];
        }
        if (add) {
            confLayers = loadedLayers[layerName].layers;
            if (confLayers) {
                _.each(confLayers, function (d) {
                    loadedLayers[d].loadable = false;
                    d3.select('.hootView.layer_' + loadedLayers[d].mapId).remove();
                });
            }
        }
        addImportCheck(isPrimary);
        addConflationCheck();
    }

    /**
    * @desc Helper function which resets Hootenanny to initial state
    **/
    function resetAllLayers() {
        _.each(loadedLayers, function (d) {
            if(context.hoot().model.layers.getLayers()[d.name]){
                context.hoot().model.layers.removeLayer(d.name);
            }

            var modifiedId = d.mapId.toString();
            d3.select('[data-layer="' + modifiedId + '"]').remove();
            delete loadedLayers[d.name];
        });

        d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
        conflicts.deactivate();
        conflationCheck();

    }

    /**
    * @desc Preconflation conflation request parameter setup
    * @param a - Conflation sidebar control container
    * @param layerName - layer name
    * @param advOpts - Advanced options list
    **/
    function preConflation(a, layerName, advOpts) {
        // refactored code to use map id instead of map name
        var data = {};
        data.INPUT1 = view.getLayer(0).id;
        data.INPUT2 = view.getLayer(1).id;

        if (view.getLayer(0).id === '-1')
        {
          data.INPUT1_TYPE = 'OSM_API_DB';
        }
        else if (view.getLayer(1).id === '-1')
        {
          data.INPUT2_TYPE = 'OSM_API_DB';
        }

        var refLayer = '1';
        var oRefLayerId = hoot.model.layers.getmapIdByName(a.select('.referenceLayer').value());
        if(oRefLayerId === data.INPUT2){
            refLayer = '2';
        }

        //This is also caught server side, but let's go ahead and catch it here too.  Would be
        //better to simply not allow the OSM API Database layer as an option for the secondary
        //layer...but was much harder to implement.
        if ((data.INPUT1_TYPE === 'OSM_API_DB' && refLayer === '2') ||
            (data.INPUT2_TYPE === 'OSM_API_DB' && refLayer === '1'))
        {
            //This reset has to occur here or successively run tests will fail.
            context.hoot().reset();
            //having difficulty accessing the iD alerts in cucumber tests, so using a regular
            //alert instead
            alert('OSM API database not allowed as secondary layer input.');
            return;
        }

        var _confType = {
            'Reference':'Reference',
            'Average':'Average',
            'Cookie Cutter & Horizontal':'Horizontal'
          };

        data.OUTPUT_NAME = a.select('.saveAs').value();
        data.CONFLATION_TYPE = _confType[a.select('.ConfType').value()] || a.select('.ConfType').value();
        //data.CONFLATION_TYPE = a.select('.ConfType').value();
        //data.MATCH_THRESHOLD = a.select('.matchThreshold').value();
        //data.MISS_THRESHOLD = a.select('.missThreshold').value();
        //Disable till swap approval
        data.GENERATE_REPORT = a.select('.isGenerateReport').value();
        data.COLLECT_STATS = a.select('.isCollectStats').value();

        var n = (new Date()).getTime();
        data.TIME_STAMP = '' + n;
        data.REFERENCE_LAYER = refLayer;

        if(advOpts){
            var advOptionsStr = '';
            _.each(advOpts, function(opt){
                if(advOptionsStr.length > 0){
                    advOptionsStr += ' ';
                }
                advOptionsStr += '-D "' + opt.name + '=' + opt.value + '"';
            });
            data.ADV_OPTIONS = advOptionsStr;
        }/* else {
            // Do the default onew
            data.ADV_OPTIONS = '-D conflate.match.threshold=0.6 -D conflate.miss.threshold=0.6';
        }*/

        d3.selectAll('.hootView').remove();
        return data;
    }

    /**
    * @desc Called when conflation job has ended
    * @param item - new merged layer
    * @param a - container
    **/
    function postConflation(item,a) {
        var layers = inputLayers();

        _.each(layers, function (d) {
            //Changed from changeVisibility to ensure that input layers are invisible after conflation
          context.hoot().model.layers.setLayerInvisible(d);
        });

        item.merged = true;
        item.layers = layers;
        loadingLayer = item;
        _.each(loadedLayers, function (a) {
            a.loadable = false;
        });
        //d3.select('.loadingLayer').remove();
        context.hoot().model.layers.addLayer(item);

        //Add a folder and update links
        var pathname = a.select('.pathname').value();
        if(pathname===''){pathname=a.select('.reset.PathName').attr('placeholder');}
        if(pathname==='root'){pathname='';}
        var pathId = context.hoot().model.folders.getfolderIdByName(pathname) || 0;

        var newfoldername = a.select('.newfoldername').value();
        var folderData = {};
        folderData.folderName = newfoldername;
        folderData.parentId = pathId;
        context.hoot().model.folders.addFolder(folderData,function(folderId){
            //update map linking
            var link = {};
            link.folderId = folderId || 0;
            link.mapid = 0;
            if(a.select('.saveAs').value()){
                link.mapid =_.pluck(_.filter(context.hoot().model.layers.getAvailLayers(),function(f){return f.name === a.select('.saveAs').value();}),'id')[0] || 0;
            }
            if(link.mapid===0){return;}
            link.updateType='new';
            context.hoot().model.folders.updateLink(link);
            link = {};
        });

        /*var datasettable = d3.select('#datasettable');
        context.hoot().view.utilities.dataset.populateDatasetsSVG(datasettable);*/
    }

    /**
    * @desc This is much like the two functions below, so may need to be consolidated.
    * @param params - merged layer meta data needed for getMapTags request
    * @param layerName - new merged layer
    **/
    function handleLayer(layerName,params,tags) {
        var doRenderView = true;
        if(params.hideinsidebar !== undefined && params.hideinsidebar === 'true'){
            doRenderView = false;
        }

        if(doRenderView === true){
            if(tags){
                renderInputLayer(layerName,params,tags);
            } else {
                Hoot.model.REST('getMapTags', {mapId: params.mapId}, function (tags) {
                    renderInputLayer(layerName,params,tags);
                });
            }
        } else {
            loadedLayers[layerName] = params;
            loadedLayers[layerName].loadable = true;
            loadingLayer = {};
        }
    }

    /**
    * @desc Retrieves input layers for conflated layer. Input layers are stored in hstore column of Maps table.
    * @param params - merged layer meta data needed for getMapTags request
    * @param layerName - new merged layer
    **/
    function renderInputLayer(layerName,params,tags) {
        //Get tags for loaded layer
        //Hoot.model.REST('getMapTags', {mapId: params.mapId}, function (tags) {
            loadedLayers[layerName] = params;
            loadedLayers[layerName].loadable = true;
            loadedLayers[layerName].tags = tags;

            view.render(params);
            loadingLayer = {};
            d3.select('.loadingLayer').remove();
            conflationCheck(layerName, true);
        //});
    }

    /**
    * @desc Retrieves conflated layer and goes into review mode if needed.
    * @param layerName - new merged layer
    * @param mapid - merged layer map id.
    **/
    function renderMergedLayer(layerName, mapid) {
        //Get tags for loaded layer
        Hoot.model.REST('getMapTags', {mapId: mapid}, function (tags) {
            //console.log(tags);
            loadingLayer.tags = tags;

            loadedLayers[layerName] = loadingLayer;
            loadedLayers[layerName].loadable = true;
            loadedLayers[layerName].merged = true;
            activeConflateLayer = loadingLayer;
            loadedLayers[layerName] = _.extend(loadedLayers[layerName], loadingLayer);
            view.render(loadingLayer);
            loadingLayer = {};
            conflicts.activate(loadedLayers[layerName]);
            context.hoot().mode('edit');
            context.hoot().model.conflicts.beginReview(activeConflateLayer, function (d) {
                conflicts.startReview(d);
            });
            conflationCheck(layerName, true);
        });
    }

    function inputLayers() {
        return _.map(loadedLayers, function (d) {
            return d.name;
        });
    }

    ETL.on('addLayer', function (options) {

        if (context.hoot().model.layers.getLayers()[options.name]) {
            return false;
        }
        if (!options.name || !options.color) {
            return false;
        }
        loadingLayer = options;
        context.hoot().model.layers.addLayer(options);
    });
    view.on('layerRemove', function (layerName, isPrimary) {
        context.hoot().model.layers.removeLayer(layerName);
        conflationCheck(layerName, false, isPrimary);
    });
    view.on('layerColor', function (layerName, newColor, layerId) {
        context.hoot().changeColor(layerId, newColor);
        loadedLayers[layerName].color = newColor;
    });
    view.on('layerVis', function (layerName) {
        context.hoot().model.layers.changeVisibility(layerName);
    });

    conflicts.on('exportData', function () {
        var mapid = activeConflateLayer.mapId;
        Hoot.model.REST('getMapSize', mapid,function (sizeInfo) {
//
            if(sizeInfo.error){
                return;
            }
            var expThreshold = 1*iD.data.hootConfig.export_size_threshold;
            var totalSize = 1*sizeInfo.size_byte;

            if(totalSize > expThreshold)
            {
                var thresholdInMb = Math.floor((1*expThreshold)/1000000);
                var res = window.confirm('Export data size is greater than ' + thresholdInMb
                    +'MB and export may encounter problem.' +
                    ' Do you wish to continue?');
                if(res === false) {

                    return;
                }
            }

            conflicts.deactivate();
            context.hoot().mode('browse');
            Hoot.model.REST('getTranslations', function (trans) {
                exportLayer.activate(activeConflateLayer, trans);
            });
        });


    });
    conflicts.on('addData', function () {
        conflicts.deactivate();
        context.hoot().mode('browse');
   /*     resetAllLayers();
         d3.select('[data-layer=' + activeConflateLayer.name + ']').remove();
        hoot.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange'
        });

        activeConflateLayer = {};    */

        _.each(loadedLayers, function(d) {
            context.hoot().model.layers.removeLayer(d.name);
            var modifiedId = d.mapId.toString();
            d3.select('[data-layer="' + modifiedId + '"]').remove();
            delete loadedLayers[d.name];
        });

        d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
        d3.select('[data-layer="' + activeConflateLayer.mapId.toString() + '"]').remove();

        context.hoot().model.layers.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange',
            'id': activeConflateLayer.mapId.toString()
        });

        activeConflateLayer = {};
    });

    /*conflicts.on('removeFeature', function (d, mapid) {
        context.hoot().model.conflicts.RemoveFeature(d, mapid);
    });*/


    /**
    * @desc Conflate event handler where it performs conflation by makeing request to server.
    * @param a - conflation control container
    * @param layerName - new merged layer
    * @param advOptions - selected advanced options.
    **/
    conflate.on('merge', function (a, layerName, advOptions) {

        var layers = inputLayers();
        // get map id
        var input1_id = context.hoot().model.layers.getmapIdByName(layers[0]);
        var input2_id = context.hoot().model.layers.getmapIdByName(layers[1]);
        // and then check size
        //getMapSize
        Hoot.model.REST('getMapSize', input1_id + ',' + input2_id,function (sizeInfo) {
//
            if(sizeInfo.error){
                context.hoot().reset();
                return;
            }
            var confThreshold = 1*iD.data.hootConfig.conflate_size_threshold;
            var totalSize = 1*sizeInfo.size_byte;

            if(totalSize > confThreshold)
            {
                var thresholdInMb = Math.floor((1*confThreshold)/1000000);
                if(!window.confirm('Conflation data size is greater than ' + thresholdInMb +
                    'MB and conflation may encounter problem. Do you wish to continue? (If you cancel layers will reset.)')) {
                    context.hoot().reset();
                    return;
                }
            }

            // var _confType = {
            //     'Reference':'Reference',
            //     'Average':'Average',
            //     'Cookie Cutter & Horizontal':'Horizontal'
            //   };

            var data = preConflation(a, layerName, advOptions);
            //var type = _confType[a.select('.ConfType').value()] || a.select('.ConfType').value();
            //var conflationExecType = (type === 'Horizontal') ? 'CookieCutterConflate' : 'Conflate';
            //Bug #6397

            var conflationExecType = 'Conflate';
            context.hoot().model.conflate.conflate(conflationExecType, data, function (item) {
                if(item.status && item.status === 'requested'){
                    conflate.jobid = item.jobid;
                } else {
                    postConflation(item,a);
                }
            });
        });
    });

    /**
    * @desc Post conflated layer load event handler where it loads input layers and goes into review mode
    *       if there is remaining review items.
    * @param layerName - new merged layer
    **/
    context.connection().on('layerAdded', function (layerName) {
        var params = context.hoot().model.layers.getLayers(layerName);
        if(!params){return;}

        if (loadedLayers[layerName]) return;

        var merged = loadingLayer.merged || null;
        if(!merged && params.mapId)
        {
            Hoot.model.REST('ReviewGetStatistics', params.mapId,function (error, stat) {
                if(stat.unreviewedCount > 0) {
                    var reqParam = {};
                    reqParam.mapId = params.mapId;
                    if(reqParam.mapId) {
                        Hoot.model.REST('getMapTags', reqParam,function (tags) {
                            //console.log(tags);
                            if (tags.reviewtype === 'hgisvalidation') {
                                var r = confirm('The layer has been prepared for validation. Do you want to go into validation mode?');
                                handleLayer(layerName,params,tags);
                                if (r === true) {
                                    context.hoot().control.validation.begin(params);
                                }
                            } else {
                                r = confirm('The layer contains unreviewed items. Do you want to go into review mode?');
                                if (r === true) {
                                    // Show map view
                                    if(d3.selectAll('#jobsBG').classed('hidden')===false){
                                        d3.selectAll('#jobsBG').classed('hidden',true);
                                        d3.select('#manageTabBtn').text('Manage').classed('fill-light',false).classed('dark',true);        
                                    }

                                    loadingLayer = params;
                                    loadingLayer.tags = tags;
                                    loadingLayer.merged = true;
                                    loadingLayer.layers = [];
                                    d3.selectAll('.loadingLayer').remove();
                                    d3.selectAll('.hootImport').remove();
                                    d3.selectAll('.hootView').remove();
                                    d3.selectAll('.hootConflate').remove();
                                    //renderMergedLayer(layerName);
                                    // Broke a part renderMergedLayer
                                    // The fix was to handle where loading source layers
                                    // preempted the loading of the feature used by review
                                    // moving the viewed location to wrong place.
                                    // old sequence was
                                    // load reviewed feature by control/conflicts.js
                                    // load source 1
                                    // load source 2
                                    // hence we load review feature and move the center of source 2..
                                    loadedLayers[layerName] = loadingLayer;
                                    loadedLayers[layerName].loadable = true;
                                    loadedLayers[layerName].merged = true;
                                    //change color to green
                                    var selColor = 'green';
                                    loadedLayers[layerName].color = selColor;
                                    context.hoot().replaceColor(loadedLayers[layerName].id,selColor);
                                    context.hoot().model.layers.changeLayerCntrlBtnColor(loadedLayers[layerName].id, selColor);
                                    activeConflateLayer = loadingLayer;
                                    loadedLayers[layerName] = _.extend(loadedLayers[layerName], loadingLayer);
                                    view.render(loadingLayer);
                                    loadingLayer = {};
                                    conflicts.activate(loadedLayers[layerName]);
                                    context.hoot().mode('edit');

                                    if(tags) {
                                        var input1 = tags.input1;
                                        var input2 = tags.input2;

                                        var input1Name = tags.input1Name;
                                        var input2Name = tags.input2Name;

                                        var input1unloaded = input1Name ? null : input1;
                                        var input2unloaded = input2Name ? null : input2;

                                        var curLayer = loadedLayers[layerName];
                                        curLayer.layers = [input1Name, input2Name];
                                        curLayer.unloaded = [input1unloaded, input2unloaded];

                                        if(input1unloaded){context.hoot().changeColor(input1unloaded, 'violet');}
                                        if(input2unloaded){context.hoot().changeColor(input2unloaded, 'orange');}

                                        if((input1 && input1Name) && (input2 && input2Name)){
                                            var key = {
                                                'name': input1Name,
                                                'id':input1,
                                                'color': 'violet',
                                                'hideinsidebar':'true'
                                            };
                                            context.hoot().model.layers.addLayer(key, function(){
                                                context.hoot().model.layers.setLayerInvisibleById(input1);

                                                if(input2 && input2Name) {
                                                    var key2 = {
                                                        'name': input2Name,
                                                        'id':input2,
                                                        'color': 'orange',
                                                        'hideinsidebar':'true'
                                                    };
                                                    context.hoot().model.layers.addLayer(key2, function(d){
                                                        context.hoot().model.layers.setLayerInvisibleById(input2);

                                                        if(d === undefined){
                                                            context.hoot().model.conflicts.beginReview(activeConflateLayer, function (d) {
                                                                conflicts.startReview(d);
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            key = {};
                                            if(input1 && input1Name) {
                                                key = {
                                                    'name': input1Name,
                                                    'id':input1,
                                                    'color': 'violet',
                                                    'hideinsidebar':'true'
                                                };
                                                iD.ui.Alert('Could not determine input layer 2. It will not be loaded.','warning',new Error().stack);
                                            } else if(input2 && input2Name) {
                                                key = {
                                                    'name': input2Name,
                                                    'id':input2,
                                                    'color': 'orange',
                                                    'hideinsidebar':'true'
                                                };
                                                iD.ui.Alert('Could not determine input layer 1. It will not be loaded.','warning',new Error().stack);
                                            } else {
                                                iD.ui.Alert('Could not determine input layers 1 or 2. Neither will not be loaded.','warning',new Error().stack);
                                            }

                                            if(key.id){
                                                context.hoot().model.layers.addLayer(key, function(d){
                                                    context.hoot().model.layers.setLayerInvisibleById(key.id);
                                                    if(d === undefined){
                                                        context.hoot().model.conflicts.beginReview(activeConflateLayer, function (d) {
                                                            conflicts.startReview(d);
                                                        });
                                                    }
                                                });
                                            } else {
                                                context.hoot().model.conflicts.beginReview(activeConflateLayer, function (d) {
                                                    conflicts.startReview(d);
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    handleLayer(layerName,params,tags);
                                }
                            }
                        });
                    }
                } else {
                    handleLayer(layerName,params);
                }
            });

        } else {
            /*renderMergedLayer(layerName);
            conflationCheck(layerName, true);*/
            if (merged) {
                var sel = d3.select('.loadingLayer');
                if(sel && sel.node()){
                    sel.remove();
                }
                renderMergedLayer(layerName, params.mapId);
            } else {
                conflationCheck(layerName, true);
            }
        }
    });
    exportLayer.on('cancelSaveLayer', function () {
        if(exporting){
            iD.ui.Alert('Can not cancel. Export in progress.','warning',new Error().stack);
            return;
        }
        exportLayer.deactivate();
        resetAllLayers();
       /* d3.select('[data-layer=' + activeConflateLayer.name + ']').remove();
        hoot.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange'
        });*/
        activeConflateLayer = {};
    });

    /**
    * @desc Export newly merged layer event handler which gets fired from sidebar export control.
    * @param cont - export control container
    * @param data - exported layer meta data
    **/
    exportLayer.on('saveLayer', function (cont, data) {
        var exportType = cont.select('.reset.fileExportFileType.combobox-input').value();
        exporting = true;
        var spinner = cont.append('span').attr('class', 'spinner-hoot').call(iD.ui.Spinner(context));
        context.hoot().model.export.exportData(cont, data, function (status) {
            if(status === 'failed'){
                iD.ui.Alert('Export has failed or partially failed. For detail please see Manage->Log.','error',new Error().stack);
            }

            /*if(exportType && exportType === 'Web Feature Service (WFS)'){
                var tblContainer = d3.select('#wfsdatasettable');
                context.hoot().view.utilities.wfsdataset.populateWFSDatasets(tblContainer);
            }*/

            spinner.remove();
            exportLayer.deactivate();
            resetAllLayers();
        });
    });
    conflationCheck();
};
