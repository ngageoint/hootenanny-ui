/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Hoot.model.layers connects UI to Hoot REST end point for Layer/dataset loading.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.layers = function (context)
{
    var model_layers = {};
    var layers = {};
    var availLayers = [];
    var recentlyUsedLayers = [];
    var isLayerLoading = false;
    var selectedLayers = [];


    model_layers.layers = layers;
    model_layers.getmapIdByName = function (name) {
        var ar = _.filter(model_layers.getAvailLayers(), function (a) {
            return a.name === name;
        });
        if(!ar.length){return null;}
        return ar[0].id;
    };

    model_layers.getNameBymapId = function (id) {
        // Replacing tis code since lodash version used by iD does not have _.object
       /* var currAvailLayers = model_layers.getAvailLayers();
        var layerSort = _.object(_.pluck(currAvailLayers, 'id'), currAvailLayers);
        var obj = layerSort[id];
        return obj ? obj.name : null;*/
        var currAvailLayers = model_layers.getAvailLayers();
        var found = _.find(currAvailLayers, function(l){
            return (id === l.id);
        });

        if(found){
            return found.name;
        }
        return null;
    };


    model_layers.refresh = function (callback) {
        Hoot.model.REST('getAvailLayers', function (a) {

            if(a.status === 'failed'){
                if(a.error){
                    context.hoot().view.utilities.errorlog.reportUIError(a.error);
                }
            }

            if (!a.layers) {
                return callback([]);
            }
            availLayers = a.layers;

            //get path names
            /*_.each(a.layers,function(lyr){
                if(lyr.name.indexOf('|')==-1){lyr.path='root'}
                else{lyr.path = lyr.name.slice(0,lyr.name.lastIndexOf('|'));}
            });*/

            if (callback) {
                callback(availLayers);
            }
        });
    };

    model_layers.getAvailLayers = function () {
        return availLayers;
    };

    model_layers.setAvailLayers = function (d) {
        availLayers = d;
        return availLayers;
    };

    model_layers.getRecentlyUsedLayers = function() {
        return recentlyUsedLayers;
    };

    model_layers.setRecentlyUsedLayers = function(lyr) {
        //remove old layers
        recentlyUsedLayers = _.intersection(_.map(context.hoot().model.layers.getAvailLayers(),'name'),recentlyUsedLayers);

        if(recentlyUsedLayers.indexOf(lyr)>-1){return;}        //Already in list

        if(recentlyUsedLayers.length>5){recentlyUsedLayers.splice(0,1);}
        recentlyUsedLayers.push(lyr);
    };

    model_layers.setLayerLinks = function(callback) {
        var links = context.hoot().model.folders.getAvailLinks();

        var layerList = _.each(_.map(model_layers.getAvailLayers(), _.clone) , function(element) {
            _.extend(element, {type:'dataset'});
            var match = _.find(this,function(e){return e.mapId===element.id;});
            if(match){_.extend(element,{folderId:match.folderId});}
            else{_.extend(element,{folderId:0});}
        },links);

        availLayers = layerList;

        if (callback){
            callback(availLayers);
        }
    };

    model_layers.getLayers = function (opt) {
        if (opt) return layers[opt];
        return layers;
    };
    model_layers.layerSwap = function () {
        var merged = _.filter(layers, function (d) {
            return d.merged;
        });
        if (merged.length > 1) {
            merged = _.filter(merged, function (d) {
                return d.loadable;
            });
        }
        if (!merged || !merged.length) {
            return;
        }
        _.each(layers, function (d) {
            var mapid = d.mapId;
            var current = context.connection()
                .visLayer(mapid);
            var modifiedId = d.mapId.toString();
            if (current) {
                context.connection()
                    .hideLayer(mapid);
                d3.select('.layerControl_' + modifiedId)
                    .select('input')
                    .property('checked', false);
            }
            else {
                context.connection()
                    .showLayer(mapid);
                d3.select('.layerControl_' + modifiedId)
                    .select('input')
                    .property('checked', true);
            }
        });
        context.flush(false);
    };

    model_layers.changeLayerCntrlBtnColor = function(lyrId, color){
        var lyrSym = d3.select('#lyrcntrlbtn-' + lyrId);
        if(lyrSym && lyrSym.size()>0){
            var classStr = lyrSym.attr('class');
            var classList = classStr.split(' ');
            var colorAttrib = _.find(classList,function(cls){
                return cls.indexOf('fill-') === 0;
            });
            if(colorAttrib){
                lyrSym.classed(colorAttrib, false);
                lyrSym.classed('fill-' + color, true);
            }
        }
    };


    model_layers.addLayer2Sidebar = function (options) {
        var layerName = options.name;
        var modifiedId = options.mapId.toString();
        var parent = d3.select('.layer-list-hoot').classed('hidden', false);
        var layerLinks = parent.insert('li', ':first-child')
            .attr('class', 'layers active hootLayers layerControl_' + modifiedId);
        var btn = layerLinks.append('button')
        .attr('id', 'lyrcntrlbtn-' + modifiedId)
        .classed('pad0x keyline-left tall fr fill-'+options.color,true)
        .style('border-radius','0 3px 3px')
            .on('click', function () {
                var feature = layerLinks.node();
                var prev = feature.previousElementSibling;
                if (!prev) {
                    return;
                }
                parent.node()
                    .insertBefore(feature, prev);

                var hootLyrs = d3.selectAll('.hootLayers');
                if(hootLyrs[0][0] !== undefined){
                    var lyr = model_layers.getmapIdByName(d3.select(hootLyrs[0][0]).text());
                    context.connection().lastLoadedLayer(lyr.toString());
                    context.flush();
                }

            });
        btn.append('span')
        .classed('_icon up',true);
        var lbl = layerLinks.append('label');
        lbl.append('input').attr('type','checkbox').property('checked', true)
            .on('change', function () {
                model_layers.changeVisibility(layerName);
            });
        lbl.append('span').text(layerName);
    };



    model_layers.addLayerAndCenter = function (key, callback, extent) {
        var name = key.name;
        var mapId = key.id || model_layers.getmapIdByName(name) || 155;
        if (layers[name]){return false;}

        key.mapId = mapId;
        if(extent){
            key.extent = extent;
        }

        var color = key.color;
        context.hoot().changeColor(mapId, color);
        layers[name] = key;
        context.connection().loadData(key);

        model_layers.addLayer2Sidebar(key);

        if (callback) callback();
    };

    model_layers.addLayer = function (key, callback) {
        context.background().updateMeasureLayer({},'');

        // this isLayerLoading tracks on till key is added to layers object.
        isLayerLoading = true;
        var cMapId = key.id || model_layers.getmapIdByName(key.name) || 155;
        context.connection().getMbrFromUrl(cMapId, function(resp){
            if(resp !== null){
                if(callback){
                    callback('showprogress');
                }

                // zoom and render
                context.zoomToExtent(resp.minlon, resp.minlat, resp.maxlon, resp.maxlat);

                model_layers.addLayerAndCenter(key, callback, resp);
            }

            isLayerLoading = false;
        });

    };

    model_layers.removeLayer = function (name) {
        //var mapid = model_layers.getLayers()[name].mapId;
        var mapid = model_layers.getLayers(name).mapId;
        delete layers[name];

        context.background().updateReviewLayer({},'');
        context.background().updateMeasureLayer({},'');

        context.connection().loadedDataRemove(mapid.toString());
        d3.select('.layerControl_' + mapid.toString()).remove();
        d3.select('.layer-list-hoot').classed('hidden', function() {
            return d3.select(this).selectAll('li').size() === 0;
        });
        context.flush();
    };

    model_layers.deleteLayer = function(params,callback){
        if(!params.dataset.name) {
            if(callback){callback(false,params);}
        }

        // Make sure that there are no current bookmarks affiliated with layer
        var _request = {};
        _request.orderBy = 'createdAt';
        _request.asc = 'false';
        _request.limit = 50;
        _request.offset = 0;
        Hoot.model.REST('getAllReviewBookmarks', _request, function (d) {
            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }

            var deleteDataset = true;

            // First check to see if any review bookmarks match this dataset
            var matchingBookmarks = _.filter(d.reviewBookmarks,function(r){return r.mapId===params.dataset.id;});

            if(matchingBookmarks.length > 0)
            {
                 if (!window.confirm('There are ' + matchingBookmarks.length + ' bookmarks attached to ' + params.dataset.name + ' that will be deleted as well.  Are you sure you want to continue?')) {
                    deleteDataset = false;
                }               

            }

            if(deleteDataset){  
                d3.json('/hoot-services/osm/api/0.6/map/delete?mapId=' + params.dataset.name)
                    .header('Content-Type', 'text/plain')
                    .post('', function (error, data) {
    
                        var exportJobId = data.jobId;
    
                        var statusUrl = '/hoot-services/job/status/' + exportJobId;
                        var statusTimer = setInterval(function () {
                            d3.json(statusUrl, function (error, result) {
                                if (result.status !== 'running') {
                                    Hoot.model.REST.WarningHandler(result);
                                    clearInterval(statusTimer);
    
                                    //update link
                                    var link={};
                                    link.folderId = 0;
                                    link.updateType='delete';
                                    link.mapid=context.hoot().model.layers.getmapIdByName(params.dataset.name)||0;
                                    context.hoot().model.layers.refresh(function(){
                                        if(callback){callback(true,params);}
                                    });
                                }
                            });
                        }, iD.data.hootConfig.JobStatusQueryInterval);
                    });
                } else {
                    context.hoot().model.layers.refresh(function(){
                        if(callback){callback(true,params);}
                    });
                }
            }, params.dataset);
    };


    model_layers.changeVisibility = function (name) {
        var layer = model_layers
            .getLayers(name);
        if (!layer) {
            return;
        }
        var mapid = layer.mapId;
        var current = context.connection()
            .visLayer(mapid);
        var modifiedId = mapid.toString();
        if (current) {
            context.connection()
                .hideLayer(mapid);
            context.flush(false);
            d3.select('.layerControl_' + modifiedId)
                .select('input')
                .property('checked', false);
        }
        else {
            context.connection()
                .showLayer(mapid);
            context.flush(false);
            d3.select('.layerControl_' + modifiedId)
                .select('input')
                .property('checked', true);
        }
    };


    model_layers.setLayerVisible = function(name) {
        var layer = model_layers
        .getLayers(name);
        if (!layer) {
            return;
        }
        var mapid = layer.mapId;
        var current = context.connection()
            .visLayer(mapid);
        if (!current){
            context.connection()
                .showLayer(mapid);
            context.flush(false);
            d3.select('.layerControl_' + mapid.toString())
                .select('input')
                .property('checked', true);
        }
    };


    model_layers.setLayerInvisible = function(name) {
        var layer = model_layers
        .getLayers(name);
        if (!layer) {
            return;
        }
        var mapid = layer.mapId;
        var current = context.connection()
            .visLayer(mapid);
        if (current) {
            context.connection()
                .hideLayer(mapid.toString());
            context.flush(false);
            d3.select('.layerControl_' + mapid)
                .select('input')
                .property('checked', false);
        }

    };

    model_layers.setLayerInvisibleById = function(mapid) {

        if (!mapid) {
            return;
        }

        var current = context.connection()
            .visLayer(mapid);
        if (current) {
            context.connection()
                .hideLayer(mapid.toString());
            context.flush(false);
            d3.select('.layerControl_' + mapid)
                .select('input')
                .property('checked', false);
        }

    };

    model_layers.RefreshLayers = function ()
    {
        model_layers.refresh(context.hoot().model.import.updateTrees);
    };


   model_layers.isLayerLoading = function()
   {
        return isLayerLoading;
   };


   model_layers.getMergedLayer = function () {
        var merged = _.filter(layers, function (d) {
            return d.merged;
        });
        return merged;
    };

    model_layers.updateLayerName = function(data,callback){

        Hoot.model.REST('Modify',data,function(resp){
            //if(resp.success === true){
                if(callback){callback(resp.success);}
            //}
            //return resp.success;
        });
        //return true;
    };

    model_layers.getSelectedLayers = function() {
        return selectedLayers;
    };

    model_layers.setSelectedLayers = function(d) {
        selectedLayers = d;
        return selectedLayers;
    };


    return model_layers;
};