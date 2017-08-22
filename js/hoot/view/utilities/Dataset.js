/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.dataset is Datasets view in Manage tab where user can view all ingested Hootenanny layers
//  and performs CRUD operations.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//      18 Apr. 2016 eslint updates -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.dataset = function(context)
{
    var hoot_view_utilities_dataset = {};

    hoot_view_utilities_dataset.createContent = function(form){
        var items = [];
        items.push(
            {title: 'Import Single Dataset', icon: 'layers', class: 'import-add-dataset', contextmenu: 'bulkimport'},
            {title: 'Import Directory', icon: 'folder', class: 'import-directory'},
            {title: 'Add Folder',icon: 'folder', class: 'import-add-folder'},
            {title: 'Refresh Datasets', icon: 'refresh', class: 'import-refresh-layers'}
        );

        var fieldDiv = form.append('div').classed('pad1y button-wrap joined col12', true);
        var buttons = fieldDiv.selectAll('button.import-button').data(items);

        buttons.enter().append('button')
            .attr('tabindex',-1)
            .attr('class', function(d){return d.class + ' import-button col2 loud dark';})
            .on('click.import-button', function(d){
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if(d.class === 'import-add-dataset'){
                    Hoot.model.REST('getTranslations', function (d) {
                        if(d.error){
                            context.hoot().view.utilities.errorlog.reportUIError(d.error);
                            return;
                        }
                        context.hoot().control.utilities.importdataset.importDataContainer(d);
                 });
                } else if (d.class === 'import-bulk-dataset') {
                    hoot_view_utilities_dataset.importDatasets();
                } else if (d.class === 'import-directory') {
                    hoot_view_utilities_dataset.importDirectory();
                } else if (d.class === 'import-add-folder') {
                    context.hoot().control.utilities.folder.importFolderContainer(0);
                } else if (d.class === 'import-refresh-layers') {
                    context.hoot().model.folders.refresh(function () {
                        context.hoot().model.layers.refresh(function(){
                            context.hoot().model.folders.refreshLinks(function(){
                                context.hoot().model.import.updateTrees();
                            });
                        });
                    });

                    this.blur();
                }
            })
            .on('contextmenu',function(d){
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if(d.contextmenu){
                    _createContextMenu(d.contextmenu);
                }
            });

        buttons.each(function(d){
            d3.select(this).call(iD.svg.Icon('#icon-' + d.icon, 'pre-text'));
        });

        buttons.append('span')
            .attr('class', 'label')
            .text(function(d) { return d.title; });

        form.append('div')
        .attr('id','datasettable')
            .classed('col12 fill-white small strong row10 overflow keyline-all', true)
            .call(hoot_view_utilities_dataset.populateDatasetsSVG);
    };

    var _createContextMenu = function(type) {
        if(type==='bulkimport'){
                            var items = [{title:'Bulk Import',icon:'plus',action:'bulkImport'}];
                d3.select('html').append('div').attr('class', 'dataset-options-menu');

                 var menuItem =  d3.selectAll('.dataset-options-menu')
                    .html('')
                    .append('ul')
                    .selectAll('li')
                    .data(items).enter()
                    .append('li')
                    .attr('class',function(item){return item.icon + ' dataset-option';})
                    .on('click' , function(item) {
                        switch (item.action) {
                        case 'bulkImport': hoot_view_utilities_dataset.importDatasets(); break;
                        default: break;
                        }
                        d3.select('.dataset-options-menu').remove();
                   });

                 menuItem.append('span').attr('class',function(item){return item.icon + ' icon icon-pre-text';});
                 menuItem.append('span').text(function(item) { return item.title; });

                 d3.select('.dataset-options-menu').style('display', 'none');

                 // show the context menu
                 d3.select('.dataset-options-menu')
                    .style('left', function(){return d3.event.clientX +'px'||'0px';})
                     .style('top', function(){return d3.event.clientY +'px'||'0px';})
                     .style('display', 'block');

                 //close menu
                 var firstOpen = true;
                 d3.select('html').on('click.dataset-options-menu',function(){
                     if(firstOpen){
                        firstOpen=false;
                     } else {
                         d3.select('.dataset-options-menu').style('display', 'none');
                     }
                 });
        }
    };

    hoot_view_utilities_dataset.deleteDataset = function(d,container){
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var warningMsg = d.type ==='folder'? 'folder and all data?' : 'dataset?';
        if(!window.confirm('Are you sure you want to remove the selected ' + warningMsg)){return;}

        var mapId = d.id;//d3.select(this.parentNode).datum().name;

        var parentNode;
        if(d.type==='dataset'){
            parentNode = container.selectAll('text[lyr-id="' + d.id + '"]').node().parentNode;
        } else {
            parentNode = container.selectAll('text[fldr-id="' + d.id + '"]').node().parentNode;
        }
        if(!parentNode){return;}

        var rectNode = d3.select(parentNode).select('rect');
        var currentFill = rectNode.style('fill');
        rectNode.style('fill','rgb(255,0,0)');
        rectNode.classed('sel',false);

        var datasets2remove = [];
        if(d.type==='folder'){
            context.hoot().model.layers.setLayerLinks();
            var folderArray = context.hoot().model.folders.getChildrenFolders(d.id);

            datasets2remove = _.filter(context.hoot().model.layers.getAvailLayers(),function(lyr){
                return folderArray.indexOf(lyr.folderId) >= 0; //return lyr.folderId===folderId;
            });
        } else {
            var availLayers = context.hoot().model.layers.getAvailLayers();
            datasets2remove=_.filter(availLayers,function(n){return n.id===mapId;});
        }

        //datasets2remove.forEach(function(dataset){
        for(var i=0; i<=datasets2remove.length-1; i++){
            var dataset = datasets2remove[i];
            var exists = context.hoot().model.layers.getLayers()[dataset.name];
            if(exists){
                iD.ui.Alert('Can not remove the layer in use: ' + dataset.name,'warning',new Error().stack);
                rectNode.style('fill',currentFill);
                return;
            }

            //select the rect using lyr-id
            try {
                // If the folder is closed, you will not be able to change the rect color...
                var selNode;
                if(!container.selectAll('text[lyr-id="' + dataset.id + '"]').empty()){
                    selNode  = container.selectAll('text[lyr-id="' + dataset.id + '"]').node().parentNode;
                    var selRect = d3.select(selNode).select('rect');
                    currentFill = selRect.style('fill');
                    selRect.style('fill','rgb(255,0,0)');
                }

                d3.select('.context-menu').style('display', 'none');

                var data = {};
                data.dataset = dataset;
                data.selNode = selNode;
                data.datasets2remove = datasets2remove;
                data.id = d.id;
                data.i = i;
                data.type = d.type;

                context.hoot().model.layers.deleteLayer(data, _deleteLayerCallback);
            } catch (e) {
                iD.ui.Alert('Unable to delete dataset ' + dataset.name + '. ' + e,'error',new Error().stack);
            }
        }//,container);

        if(datasets2remove.length===0){
            _.each(_.uniq(folderArray),function(f){
                context.hoot().model.folders.deleteFolder(f,function(resp){
                    if(resp===false){iD.ui.Alert('Unable to delete folder.','error',new Error().stack);}
                    context.hoot().model.folders.refresh(function () {context.hoot().model.import.updateTrees();});
                });
            });
        }
    };

    var _deleteLayerCallback = function(resp,data){
        if(resp===true){
            if(data.selNode){data.selNode.remove();}

            if(data.i>=data.datasets2remove.length-1){
                context.hoot().model.layers.refresh(_refreshLinks(_updateTrees()));

                //remove folder
                if(data.type==='folder'){
                    var folderArray = context.hoot().model.folders.getChildrenFolders(data.id);
                    _.each(_.uniq(folderArray),function(f){
                        context.hoot().model.folders.deleteFolder(f,function(resp){
                            if(resp===false){iD.ui.Alert('Unable to delete folder.','error',new Error().stack);}
                            context.hoot().model.folders.refresh(function () {context.hoot().model.import.updateTrees();});
                        });
                    });
                }
            }
        }
    };

    //var _refreshFolders = function(callback){context.hoot().model.folders.refresh(callback);};
    var _refreshLinks = function(callback){context.hoot().model.folders.refreshLinks(callback);};
    var _updateTrees = function(callback){context.hoot().model.import.updateTrees(callback);};

    hoot_view_utilities_dataset.exportDataset = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var mapid = context.hoot().model.layers.getmapIdByName(d.name);
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

            Hoot.model.REST('getTranslations', function (trans) {
                if(trans.error){
                    context.hoot().view.utilities.errorlog.reportUIError(trans.error);
                    return;
                }
                context.hoot().control.utilities.exportdataset.exportDataContainer(d, trans);
            });
        });
    };

    hoot_view_utilities_dataset.preparebulkexportDataset = function(d) {
        var datasets = context.hoot().model.folders.returnDatasetsInFolder(d.id);
        var datasetIds = _.pluck(datasets,'id');
        hoot_view_utilities_dataset.bulkexportDataset(datasetIds);
    };

    hoot_view_utilities_dataset.bulkexportDataset = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        // Loop through the datasets and flag any that may be over the size limit
        var expThreshold = 1*iD.data.hootConfig.export_size_threshold;

        var _exportList = [];
        _.each(d,function(lyrid){
            var _lyrInfo = {};
            _lyrInfo.id = lyrid;
            _lyrInfo.name = context.hoot().model.layers.getNameBymapId(lyrid);
            _exportList.push(_lyrInfo);
            
            /*Hoot.model.REST('getMapSize', d,function (sizeInfo) {
                if(sizeInfo.error){ _lyrInfo.size = -1; }

                _lyrInfo.size = 1*sizeInfo.size_byte;
                if(_lyrInfo.size > expThreshold) { _lyrInfo.oversized = true; }
            });*/
        });
        
        Hoot.model.REST('getTranslations', function (trans) {
            if(trans.error){
                context.hoot().view.utilities.errorlog.reportUIError(trans.error);
                return;
            }
            context.hoot().control.utilities.bulkexportdataset.bulkExportDataContainer(_exportList, trans);
        });

    };    

    hoot_view_utilities_dataset.deleteDatasets = function(d,container) {
        if(d.length===0){return;}
        else if(d.length===1){
            var dataset = _.find(context.hoot().model.layers.getAvailLayers(),{id:d[0]});
            if(dataset===undefined){
                iD.ui.Alert('Could not locate dataset with id: ' + d[0].toString() + '.','error',new Error().stack);
                return;
            } else {
                dataset.type='dataset';
            }
            hoot_view_utilities_dataset.deleteDataset(dataset, container);
        } else {
            d3.event.stopPropagation();
            d3.event.preventDefault();

            var warningMsg = 'You are about to delete ' + d.length + ' datasets.  Do you want to proceed?';
            if(!window.confirm(warningMsg)){return;}

            // Populate datasets2remove
            var availLayers = context.hoot().model.layers.getAvailLayers();
            var selectedLayers = context.hoot().model.layers.getSelectedLayers();
            var datasets2remove = [];
            _.each(selectedLayers,function(f){if(_.find(availLayers,{id:f})){datasets2remove.push(_.find(availLayers,{id:f}));}});

        for(var i=0; i<=datasets2remove.length-1; i++){
            dataset = datasets2remove[i];
            var exists = context.hoot().model.layers.getLayers()[dataset.name];
            if(exists){
                iD.ui.Alert('Can not remove the layer in use: ' + dataset.name,'warning',new Error().stack);
                return;
            }

            //select the rect using lyr-id
            try {
                // If the folder is closed, you will not be able to change the rect color...
                var selNode;
                if(!container.selectAll('text[lyr-id="' + dataset.id + '"]').empty()){
                    selNode  = container.selectAll('text[lyr-id="' + dataset.id + '"]').node().parentNode;
                    var selRect = d3.select(selNode).select('rect');
                    selRect.style('fill','rgb(255,0,0)');
                    selRect.classed('sel',false);
                }

                d3.select('.context-menu').style('display', 'none');

                var data = {};
                data.dataset = dataset;
                data.selNode = selNode;
                data.datasets2remove = datasets2remove;
                data.id = d.id;
                data.i = i;
                data.type = d.type;

                context.hoot().model.layers.deleteLayer(data, _deleteLayerCallback);
            } catch (e) {
                iD.ui.Alert('Unable to delete dataset ' + dataset.name + '. ' + e,'error',new Error().stack);
            }
            }//,container);
        }
    };

    hoot_view_utilities_dataset.importDatasets = function() {
        Hoot.model.REST('getTranslations', function (d) {
            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }
           context.hoot().control.utilities.bulkimportdataset.bulkImportDataContainer(d);
        });
    };

    hoot_view_utilities_dataset.importDirectory = function() {
        Hoot.model.REST('getTranslations', function (d) {
            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }
           context.hoot().control.utilities.importdirectory.importDirectoryContainer(d);
        });
    };

    hoot_view_utilities_dataset.moveDatasets = function(d) {
        context.hoot().control.utilities.bulkmodifydataset.bulkModifyContainer(d);
    };

    hoot_view_utilities_dataset.modifyDataset = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var data = {};
        data.inputType=d.type;
        data.mapid=d.id;

        if(d.type==='dataset'){
            context.hoot().control.utilities.modifydataset.modifyNameContainer(d);
        } else if(d.type==='folder'){
            context.hoot().control.utilities.folder.modifyNameContainer(d);
        }
    };


    hoot_view_utilities_dataset.populateDatasetsSVG = function(container) {
        context.hoot().control.utilities.folder.createFolderTree(container);
    };

    //Takes a bbox in the form of an array [minx, miny, maxx, maxy]
    //and returns geojson Multipolygon geometry
    function bbox2multipolygon(bbox) {
        return {
                    type: 'MultiPolygon',
                    coordinates:[
                                  [
                                    [
                                      [
                                        bbox[0],
                                        bbox[3]
                                      ],
                                      [
                                        bbox[2],
                                        bbox[3]
                                      ],
                                      [
                                        bbox[2],
                                        bbox[1]
                                      ],
                                      [
                                        bbox[0],
                                        bbox[1]
                                      ],
                                      [
                                        bbox[0],
                                        bbox[3]
                                      ]
                                    ]
                                  ]
                                ]
                };
    }

    hoot_view_utilities_dataset.createConflationTaskProject = function(d) {
        //console.log(d);
        //TO DO: use convex hull shape instead of minimum bounding rectangle
        context.connection().getMbrFromUrl(d.id, function(mbr) {
            //console.log(mbr);

            //get task geojson
            var param = {
                input: d.id,
                inputtype: 'db',
                outputtype: 'tiles.geojson',
                MAX_NODE_COUNT_PER_TILE: 5000,
                PIXEL_SIZE: 0.001
            };
            d3.json('/hoot-services/job/export/execute')
                .header('Content-Type', 'application/json')
                .post(JSON.stringify(param), function (error, data) {
                    if (error) {
                        iD.ui.Alert('Calculate Task Grids Failed', 'warning', new Error().stack);
                        return;
                    }

                    //Show a wait cursor
                    d3.selectAll('a, div').classed('wait', true);

                    var exportJobId = data.jobid;
                    var statusUrl = '/hoot-services/job/status/' + exportJobId;
                    var statusTimer = setInterval(function () {
                        d3.json(statusUrl, function(error, result)
                            {

                                if (result.status !== 'running') {
                                    clearInterval(statusTimer);
                                    //Remove the wait cursor
                                    d3.selectAll('a, div').classed('wait', false);
                                    if (result.status === 'failed') {
                                        Hoot.model.REST.WarningHandler(result.statusDetail);
                                    } else {
                                        var resultUrl = '/hoot-services/job/export/geojson/' + exportJobId + '?ext=tiles.geojson';
                                        d3.json(resultUrl, function(error, json) {
                                            var project = {
                                                geometry: bbox2multipolygon([mbr.minlon, mbr.minlat, mbr.maxlon, mbr.maxlat]),
                                                type: 'Feature',
                                                properties: {
                                                    name: 'Conflation Task Project - ' + d.name,
                                                    status: 2,
                                                    changeset_comment: '#hootenanny-conflation-of-' + d.name.replace(/\s+/g, '-'),
                                                    license: null,
                                                    description: 'Step through Hootenanny conflation reviews for the task area.',
                                                    per_task_instructions: '',
                                                    priority: 2,
                                                    short_description: 'Review Hootenanny conflation of ' + d.name + ' data into' + iD.data.hootConfig.taskingManagerTarget + '.',
                                                    instructions: 'Hootenanny will conflate the ' + d.name + ' data for the task area and present you with reviews for possible feature matches it is unsure of.  The features can be manually edited, merged, deleted, or left alone and then the review is resolved.  The conflated data changeset will then be written back to ' + iD.data.hootConfig.taskingManagerTarget + '.',
                                                    entities_to_map: 'review conflation of roads, buildings, waterways, pois',
                                                    hoot_map_id: d.id,
                                                    tasks: json
                                                }
                                            };

                                            var projectUrl = iD.data.hootConfig.taskingManagerUrl + '/project';
                                            d3.json(projectUrl)
                                                .on('beforesend', function (request) {request.withCredentials = true;})
                                                .post(JSON.stringify(project), function(error, json) {
                                                    if (error) {
                                                        iD.ui.Alert('Error creating Conflation Task Project.','warning', new Error().stack);
                                                        return;
                                                    }
                                                    window.open(projectUrl + '/' + json.id, '_blank');
                                                });
                                        });
                                    }
                                }
                            });
                    }, iD.data.hootConfig.JobStatusQueryInterval);
                });
        });
    };

    return hoot_view_utilities_dataset;
};