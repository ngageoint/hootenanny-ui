/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.model.REST is static collection of various REST request made to Hoot service and Node JS server.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.REST = function (command, data, callback, option) {
    if (typeof (data) === 'function' && !callback) {
        callback = data;
    }
    var rest = {};

    function _alertError(error, errorText){
        iD.ui.Alert(errorText,'error',new Error().stack);
        var localResp = {};
        localResp.status = 'failed';
        localResp.error = error;
        return localResp;
    }

    rest.jobStatusInterval = 2000;
    rest.Upload = function (data, callback) {
        if (!data.TRANSLATION || !data.INPUT_TYPE || !data.formData || !data.INPUT_NAME) {
            return false;
        }
        var url = '/hoot-services/ingest/ingest/upload?TRANSLATION=' + data.TRANSLATION + '&INPUT_TYPE=' +
                data.INPUT_TYPE + '&INPUT_NAME=' + data.INPUT_NAME + '&USER_EMAIL=' +
                iD.data.hootConfig.userEmail + '&NONE_TRANSLATION=' + data.NONE_TRANSLATION;

        if(data.FGDB_FC) {
            url += '&FGDB_FC=' + data.FGDB_FC;
        }
        d3.xhr(url).header('access-control-allow-origin', '*')
            .post(data.formData, function (error, json) {


                if (json && json.response.indexOf('<html>') !== -1) {
                    error = 'error';
                } else if (json===undefined && error.response) {
                    json = {'errorMessage':error.response.replace('java.lang.Exception: ',''),'response':'','responseText':[]};
                }
                callback(json);
                return json;
            });
    };

    rest.Modify = function (data, callback) {
        if (!data.inputType || !data.mapid || !data.modifiedName) {
            callback(false);
            return false;
        }
        /*callback(true);
        return true;*/
        d3.json('/hoot-services/osm/api/0.6/map/modify?mapId=' + data.mapid +
                '&inputType=' + data.inputType + '&modName=' + data.modifiedName)
        .post(data, function (error, data) {
            if (error){
                iD.ui.Alert('Modify name failed! For detailed log goto Manage->Log','error',new Error().stack);
                return error;
            }
            callback(data);
            return data;
        });
    };

    rest.updateMapFolderLinks = function(data,callback){
        if (!(data.folderId >= 0) || !(data.mapid >= 0) || !data.updateType) {
            callback(false);
            return false;
        }
        /*callback(true);
        return true;*/
        d3.json('/hoot-services/osm/api/0.6/map/linkMapFolder?mapId=' + data.mapid +
                '&folderId=' + data.folderId + '&updateType=' + data.updateType)
        .post(data, function (error, data) {
            if (error){
                iD.ui.Alert('Folder-Map link failed! For detailed log goto Manage->Log','error',new Error().stack);
                return error;
            }
            callback(data);
            return data;
        });
    };

    rest.updateFolder = function(data,callback){
        if(!(data.parentId >= 0)||!(data.folderId >= 0)||data.parentId===data.folderId){
            callback(false);
            return false;
        }

        d3.json('/hoot-services/osm/api/0.6/map/updateParentId?folderId=' + data.folderId +
                '&parentId=' + data.parentId)
        .post(data, function (error, data) {
            if (error){
                return error;
            }
            callback(data);
            return data;
        });
    };

    rest.addFolder = function (data, callback) {
        if (!data.folderName || !(data.parentId >= 0)) {
            callback(false);
            return false;
        }

        d3.json('/hoot-services/osm/api/0.6/map/addfolder?folderName=' + data.folderName +
                '&parentId=' + data.parentId)
        .post(data, function (error, data) {
            if (error){
                iD.ui.Alert('Add folder failed! For detailed log goto Manage->Log','error',new Error().stack);
                return error;
            }
            callback(data);
            return data;
        });
    };

    rest.deleteFolder = function (folderId,callback) {
        if(!(folderId >= 0)) {
            callback(false);
            return false;
        }

        d3.json('/hoot-services/osm/api/0.6/map/deletefolder?folderId=' + folderId)
        .post(function (error, json) {
            if(error){
                callback(false);
            } else {callback(true);}
            return json;
        });
    };

    rest.basemapUpload = function (data, callback) {
        if (!data.formData) {
            return false;
        }
        d3.xhr('/hoot-services/ingest/basemap/upload?' + 'INPUT_NAME=' + data.INPUT_NAME)
                        .header('access-control-allow-origin', '*')
            .post(data.formData, function (error, json) {
                if (json.response.indexOf('<html>') !== -1) {
                    error = 'error';
                }
                if (error) {
                    return error;
                }
                callback(json);
                return json;
            });
    };

    rest.getAvailLinks = function (callback) {
        var request = d3.json('/hoot-services/osm/api/0.6/map/links');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get available links failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getAvailLayers = function (callback) {
        var request = d3.json('/hoot-services/osm/api/0.6/map/layers');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get available layers failed! For detailed log goto Manage->Log'));
            } else {
                if(resp.layers && resp.layers.length > 0)
                {
                    var layerlist = resp;
                    Hoot.model.REST('getMapSizes', _.pluck(resp.layers,'id').toString(),function (sizeInfo) {
                        if(sizeInfo) {
                            layerlist.layers = _.map(layerlist.layers, function(lyr){
                                return _.extend(lyr, _.find(sizeInfo.layers, { id: lyr.id} ));
                            });
                        }


                        callback(layerlist);
                     });
                } else {
                    callback(resp);
                }
            }
        });
    };

    rest.getMapTags = function (data, callback) {
        var request = d3.json('/hoot-services/osm/api/0.6/map/tags?mapid=' + data.mapId);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get tags failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getAvailFolders = function (callback) {
        var request = d3.json('/hoot-services/osm/api/0.6/map/folders');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get available folders failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.enableBaseMap = function (data, callback) {
        var request = d3.json('/hoot-services/ingest/basemap/enable?NAME=' + data.name + '&ENABLE=true');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Enable Basemap failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.disableBaseMap = function (data, callback) {
        var request = d3.json('/hoot-services/ingest/basemap/enable?NAME=' + data.name + '&ENABLE=false');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Disable Basemap failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getMapSize = function (mapId, callback) {
        var request = d3.json('/hoot-services/info/map/size?mapid=' + mapId);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get map size failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getMapSizeThresholds = function (callback) {
        var request = d3.json('/hoot-services/info/map/thresholds');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get map size thresholds failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getMapSizes = function (mapIds, callback){
        if(!mapIds){
            callback(null);
            return;
        }
        var request = d3.json('/hoot-services/info/map/sizes?mapid=' + mapIds);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get map sizes failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.clipDataset = function (context, data, callback) {
        if(!data.INPUT_NAME || !data.BBOX || !data.OUTPUT_NAME || !data.PATH_NAME){return false;}

        var postClip = function(a){
            if(a.status==='complete'){
                context.hoot().model.layers.refresh(function(){
                    context.hoot().model.layers.setLayerLinks(function(){
                        var availLayers = context.hoot().model.layers.getAvailLayers();
                        var input = _.find(availLayers,{name:data.INPUT_NAME});
                        if(input!==undefined){
                            var outputFolderId = context.hoot().model.folders.getfolderIdByName(data.PATH_NAME) || 0;
                            var output = _.find(availLayers,{name:data.OUTPUT_NAME});
                            if(output!==undefined){
                                var link = {'folderId':outputFolderId,'mapid':output.id,'updateType':'update'};
                                context.hoot().model.folders.updateLink(link);
                                callback(a,data.OUTPUT_NAME);
                            }
                        }
                    });
                });
            }
        };

        // Commented out section below placeholder for future alpha-shape clipping
        /*if(option === 'bbox'){*/
            //Clip to bounding box
            d3.json('/hoot-services/job/clipdataset/execute')
                .header('Content-Type', 'text/plain')
                .post(JSON.stringify(data), function (error, resp) {
                    if (error) {
                        return callback(_alertError(error, 'Clip Dataset job failed! For detailed log goto Manage->Log'));
                    }
                    iD.ui.Alert('Clip ' + data.INPUT_NAME +  ' has been submitted.','notice');
                    rest.status(resp.jobid, postClip);
            });
        /*}
        else {
            console.log('under construction');
            return false;
        }*/
    };

    rest.Conflate = function (data, callback, option) {
         data.INPUT1_TYPE = data.INPUT1_TYPE || 'DB';
         data.INPUT2_TYPE = data.INPUT2_TYPE || 'DB';
        if (!data.INPUT1 || !data.INPUT2 || !data.OUTPUT_NAME) {
            return callback(_alertError('Something is undefined that shouldn\'t be!', 'Unable to conflate requested inputs!'));
        }
        if(option.queryInterval){
            rest.jobStatusInterval = option.queryInterval;
        }

        data.USER_EMAIL = iD.data.hootConfig.userEmail;
        d3.json('/hoot-services/job/conflation/execute')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(data), function (error, resp) {
                if(callback){
                    var param = {};
                    param.status = 'requested';
                    param.jobid = resp.jobid;
                    callback(param);
                }
                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                rest.status(resp.jobid, callback);
            });
    };

    rest.poiMerge = function (data, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
               Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.p2pServerPort) +
               '/p2pmerge')
           .post(data, function (error, resp) {
               if (error) {
                   _alertError(error, 'Poi merge failed.');
               }
               var oParser = new DOMParser();
               var oDOM = oParser.parseFromString(resp.output, 'text/xml');

               callback(oDOM);
           });
    };

    rest.AutoTune = function (data, callback) {

       d3.json('/hoot-services/job/tunning/execute')
           .header('Content-Type', 'text/plain')
           .post(JSON.stringify(data), function (error, resp) {
               if (error) {
                   return error;
               }
               rest.statusWithResponse(resp.jobId, callback);
           });
   };

   rest.statusWithResponse = function(jobStatus, callback) {
        var status = function() {
            d3.json('/hoot-services/job/status/' + jobStatus, function (error, resp) {
                if (error) {
                    return error;
                }

                if (resp.status !== 'running') {
                        JobStatusStopTimer(resp);
                    }
            });
        };
        var JobStatusTimer = setInterval(function() {
            status();
        }, 1000);
        var JobStatusStopTimer = function(response) {
                clearInterval(JobStatusTimer);
                if (callback) {
                    callback(response);
                }
            };
    };

    rest.status = function(jobStatus, callback) {
        var status = function() {
            d3.json('/hoot-services/job/status/' + jobStatus, function (error, resp) {
                if (error) {
                    JobStatusStopTimer();
                    return error;
                }

                if (resp.status !== 'running') {
                    if(resp.status === 'failed'){
                        var showError = true;
                        if(resp.statusDetail){
                            var detail = resp.statusDetail;
                            if(detail.indexOf('User requested termination') > -1){
                                showError = false;
                            }
                        }
                        if(showError){
                            iD.ui.Alert('Requested job failed! For detailed log goto Manage->Log','error',new Error().stack);
                        }
                    }
                    else
                    {
                      Hoot.model.REST.WarningHandler(resp);
                    }

                    JobStatusStopTimer(resp);
                }
            });
        };
        var JobStatusTimer = setInterval(function() {
            status();
        }, rest.jobStatusInterval);
        var JobStatusStopTimer = function(resp) {
                clearInterval(JobStatusTimer);
                if (callback) {
                    callback(resp, jobStatus);
                }
            };
    };

    rest.cancel = function(data, callback) {
        d3.json('/hoot-services/job/cancel')
        .header('Content-Type', 'text/plain')
        .post(JSON.stringify(data), function (error, resp) {
            if (error) {
                return error;
            }
            rest.status(resp.jobid, callback);
        });
    };



    rest.GetTranslationServerStatus = function(data, callback) {
        d3.json('/hoot-services/ogr/translationserver/status' , function (error, resp) {
                if (error) {
                    return error;
                }

                if(resp.port && resp.isRunning === true)
                {
                    iD.data.hootConfig.translationServerPort = resp.port;
                    callback();
                }
                else
                {
                    iD.ui.Alert('Can not find translation server info. Is it running?','warning',new Error().stack);
                }
            });
    };

    // This uses translation node js server using CORS
    rest.LTDS = function (data, callback) {
        if(!iD.data.hootConfig.translationServerPort){
            iD.ui.Alert('Can not find translation server info. Is it running?','warning',new Error().stack);
            return;
        }
        if (!data) {
            return false;
        }

        var reqData = {};
        reqData.command = 'translate';
        reqData.translation = data.translation;
        reqData.uid = data.id;
        reqData.input = data.osmXml;

        var osmToTdsAttribFilter = data.filterMeta;

        d3.xhr(window.location.protocol + '//' + window.location.hostname + Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) + '/osmtotds')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(reqData), function (error, json) {
                if (error) {
                    //Feature not in spec
                    //Unable to translate
                    var r = {};
                    r.tableName = '';
                    r.attrs = {};
                    r.fields = '{}';
                    callback(r);
                    _alertError(error, 'Feature out of spec, unable to translate');
                    return;
                }
                var res = JSON.parse(json.responseText);
                var tdsXml = res.output;
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(tdsXml,'text/xml');
                var tagslist = xmlDoc.getElementsByTagName('tag');

                //Check for F_CODE = Not found
                if (_.some(tagslist, function(tag) {
                    return tag.attributes.k.value === 'Feature Code' &&
                        tag.attributes.v.value === 'Not found';
                })) {
                    //Feature not in spec
                    //Unable to translate
                    var f = {};
                    f.tableName = '';
                    f.attrs = {};
                    f.fields = '{}';
                    callback(f);
                    _alertError(error, 'Feature out of spec, unable to translate');
                    return;
                }

                var attribs = {};
                //var fcode = null;
                var idVal = null;
                var idelem = null;

                if(osmToTdsAttribFilter){
                    idelem = osmToTdsAttribFilter.filtertagname;
                    _.each(tagslist, function(tag){
                        var key = tag.attributes.k.value;
                        var val = tag.attributes.v.value;
                        attribs[key] = val;
                        if(key === osmToTdsAttribFilter.filterkey){
                            idVal = val;
                        }
                    });
                } else {
                    idelem = 'fcode';
                    _.each(tagslist, function(tag){
                        var key = tag.attributes.k.value;
                        var val = tag.attributes.v.value;
                        attribs[key] = val;
                        if(key === 'Feature Code'){
                            var parts = val.split(':');
                            idVal = parts[0].trim();
                        }
                    });
                }

                // This is where we get the fields list based on fcode
                if(idVal){
                    d3.xhr(window.location.protocol + '//' + window.location.hostname +
                        Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) + '/osmtotds?idval='+idVal +
                         '&geom=' + data.geom + '&translation=' + data.translation + '&idelem=' + idelem)
                        .get(function(error, resp){
                            var ret = {};
                            ret.tableName = '';
                            ret.attrs = attribs;
                            ret.fields = resp.responseText;
                            callback(ret);

                        });
                } else {
                    // create empty fields
                    var ret = {};
                    ret.tableName = '';
                    ret.attrs = attribs;
                    ret.fields = '{}';
                    callback(ret);
                }
            });
    };

    // This uses translation node js server using CORS
    rest.TDSToOSMByFCode = function (data, callback) {
        if(!iD.data.hootConfig.translationServerPort){
            iD.ui.Alert('Can not find translation server info. Is it running?','warning',new Error().stack);
            return;
        }

        if(data){
            var fcode = data.fcode;
            var translation = data.translation;
            d3.xhr(window.location.protocol + '//' + window.location.hostname +
                Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
                '/tdstoosm?fcode='+ fcode + '&translation=' + translation)
                .get(function(error, resp){
                    callback(resp);

                });
        }
    };

    rest.TDSToOSM = function (data, callback) {
        if(!iD.data.hootConfig.translationServerPort){
            iD.ui.Alert('Can not find translation server info. Is it running?','warning',new Error().stack);
            return;
        }
        if (!data) {
            return false;
        }

        var reqData = {};
        reqData.command = 'translate';
        reqData.translation = data.translation;
        reqData.uid = data.id;
        reqData.input = data.osmXml;

        d3.xhr(window.location.protocol + '//' + window.location.hostname +
            Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +'/tdstoosm')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(reqData), function (error, json) {
                var res = JSON.parse(json.responseText);
                var tdsXml = res.output;
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(tdsXml,'text/xml');
                var tagslist = xmlDoc.getElementsByTagName('tag');
                var attribs = {};

                _.each(tagslist, function(tag){
                    var key = tag.attributes.k.value;
                    var val = tag.attributes.v.value;
                    attribs[key] = val;

                });

                var ret = {};
                    ret.tableName = '';
                    ret.attrs = attribs;
                    callback(ret);

            });
    };

    rest.Export = function (data) {
        if (!data.translation || !data.inputtype || !data.input || !data.outputtype) {
            return false;
        }
        data.USER_EMAIL = iD.data.hootConfig.userEmail;
        d3.json('/hoot-services/job/export/execute')
        .post(data, function (error, data) {
            if (error){
                iD.ui.Alert('Export job failed! For detailed log goto Manage->Log','error',new Error().stack);
                return error;
            }
            return data;
        });
    };

    rest.getConflationCustomOpts = function(confType,callback){
        // Doing the stacked load to prevent race condition in loading data
        var request = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=custom');
        request.get(function (error, resp) {
                if (error) {
                    return callback(_alertError(error, 'Get custom conflation options failed! For detailed log goto Manage->Log'));
                } else {
                    iD.data.hootConfAdvOps = resp;
                    var request_hrz = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=horizontal');
                    request_hrz.get(function (error, resp1) {
                        if (error) {
                            _alertError(error, 'Get horizontal conflation options failed! For detailed log goto Manage->Log');
                            return;
                        } else {
                            iD.data.hootConfAdvOps_horizontal = resp1;
                            var request_ave = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=average');
                            request_ave.get(function (error, resp2) {
                                if (error) {
                                    _alertError(error, 'Get average conflation options failed! For detailed log goto Manage->Log');
                                    return;
                                } else {
                                    iD.data.hootConfAdvOps_average = resp2;
                                    var request_ref = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=reference');
                                    request_ref.get(function (error, resp3) {
                                        if (error) {
                                            _alertError(error, 'Get reference conflation options failed! For detailed log goto Manage->Log');
                                            return;
                                        } else {
                                            iD.data.hootConfAdvOps_reference = resp3;
                                        }

                                    });
                                }
                            });
                        }
                    });
                }
        });
    };

    rest.getReports = function(callback) {
        var request = d3.json('/hoot-services/info/reports/list');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get Reports List failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.deleteReport = function (id, callback) {
        var request = d3.json('/hoot-services/info/reports/delete?id=' + id);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Delete Reports failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getWFSList = function(callback) {
        var request = d3.json('/hoot-services/job/export/wfs/resources');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get WFS List failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getBaseMapsList = function(callback) {
        var request = d3.json('/hoot-services/ingest/basemap/getlist');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get Base Maps List failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.resolveAllReviews = function(mapId, callback)
    {
      var request = {};
      request.mapId = mapId;
      d3.json('/hoot-services/job/review/resolveall')
        .header('Content-Type', 'application/json')
        .send(
          'PUT',
          JSON.stringify(request),
          function(error, response)
          {
            if (error)
            {
              iD.ui.Alert('Resolve all reviews failed.','error',new Error().stack);
            }
            callback(error, response);
          });
    };

  rest.getReviewRefs = function(queryElements, callback)
  {
    var request = {};
    request.queryElements = queryElements;
    d3.json('/hoot-services/job/review/refs')
      .header('Content-Type', 'application/json')
      .post(JSON.stringify(request),
      function(error, response)
      {
        if (error)
        {
          iD.ui.Alert('Review get refs failed.','error',new Error().stack);
        }
        callback(error, response);
      });
  };

  rest.reviewGetNext = function(data, callback)
  {
    var mapId = data.mapId;
    var seq = data.sequence;
    var direction = data.direction;

    d3.json('/hoot-services/job/review/next?mapid='+ mapId + '&offsetseqid=' + seq
        + '&direction=' + direction,
       function(error, response)
            {
                if (error)
                {
                    alert('Get next review failed.');
                }
                callback(error, response);
            }
        );
  };


  rest.reviewGetReviewItem = function(data, callback)
  {
    var mapId = data.mapId;
    var seq = data.sequence;

    d3.json('/hoot-services/job/review/reviewable?mapid='+ mapId + '&offsetseqid=' + seq,
            function(error, resp)
            {
               if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                callback(resp);
            }
        );
  };

  rest.ReviewGetStatistics = function (mapId, callback) {

        d3.json('/hoot-services/job/review/statistics?mapId=' + mapId, function (error, resp) {
                return callback(error,resp);
        });
    };

  rest.getTranslations = function(callback) {
    d3.json('/hoot-services/ingest/customscript/getlist', function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get Translations failed! For detailed log goto Manage->Log'));
        }
        if(callback){callback(resp);}
    });
};

rest.getExportResources = function(name,callback) {
    d3.text('/hoot-services/job/export/resources', function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get Exports failed! For detailed log goto Manage->Log'));
        }
        if(callback){callback(resp);}
    });
};


rest.ReviewGetGeoJson = function (mapId, extent, callback) {
        d3.json('/hoot-services/job/review/allreviewables?mapid=' + mapId
            + '&minlon=' + (extent[0][0]).toFixed(6)
            + '&minlat=' + (extent[0][1]).toFixed(6)
            + '&maxlon=' + (extent[1][0]).toFixed(6)
            + '&maxlat=' + (extent[1][1]).toFixed(6)
            , function (error, resp) {
                if (error) {
                    iD.ui.Alert('Failed to get review geojson.','error',new Error().stack);
                    return;
                }
                if (callback) {
                    callback(resp.geojson);
                }
        });
    };

rest.getTranslation = function(name,callback) {
    d3.text('/hoot-services/ingest/customscript/getscript?SCRIPT_NAME='+ name, function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get Translation failed! For detailed log goto Manage->Log'));
        }
        if(callback){callback(resp);}
    });
};

rest.getDefaultTranslation = function(path,callback) {
    d3.text('/hoot-services/ingest/customscript/getdefaultscript?SCRIPT_PATH='+ path, function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get Translation failed! For detailed log goto Manage->Log'));
        }
        if(callback){callback(resp);}
    });
};

rest.deleteTranslation = function(name,callback) {
    d3.text('/hoot-services/ingest/customscript/deletescript?SCRIPT_NAME='+name, function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get Translation failed! For detailed log goto Manage->Log'));
        }
        if(callback){callback(resp);}
    });
};

rest.postTranslation = function(data,callback) {
d3.json('/hoot-services/ingest/customscript/save?SCRIPT_NAME='+data.NAME+'&SCRIPT_DESCRIPTION='+data.DESCRIPTION)
            .header('Content-Type', 'text/plain')
            .post(data.data, function (error, resp) {
                if (error) {
                    return callback(_alertError(error, 'Post Translation failed! For detailed log goto Manage->Log'));
                }
                if(callback){callback(resp);}
                return resp;
            });
};

rest.servicesVersionInfo = function(callback)
{
    d3.json('/hoot-services/info/about/servicesVersionInfo', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, 'Get service version info failed! For detailed log goto Manage->Log'));
        }
        return callback(resp);
    });
};

rest.coreVersionInfo = function(callback)
{
    d3.json('/hoot-services/info/about/coreVersionInfo', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, 'Get core version info failed! For detailed log goto Manage->Log'));
        }
        return callback(resp);
    });
};

rest.coreVersionDetail = function(callback)
{
    d3.json('/hoot-services/info/about/coreVersionDetail', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, 'Get core version detail failed! For detailed log goto Manage->Log'));
        }
        return callback(resp);
    });
};

rest.jobStatusLegacy = function (data, callback) {
        d3.json('/hoot-services/job/status/' + data, function (error, resp) {
            if (error) {
                return error;
            }
            callback(resp);
        });
};

rest.getDebugLog = function (data, callback) {
    d3.json('/hoot-services/info/logging/debuglog', function (error, resp) {
        if (error) {
            return callback(_alertError(error, 'Get debug log failed! For detailed log goto Manage->Log'));
        }
        callback(resp);
    });
};

rest.exportLog = function()
{
    var sUrl = '/hoot-services/info/logging/export';
    var link = document.createElement('a');
    link.href = sUrl;
    if (link.download !== undefined) {
        //Set HTML5 download attribute. This will prevent file from opening if supported.
        var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
        link.download = fileName;
    }
    //Dispatching click event.
    if (document.createEvent) {
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        link.dispatchEvent(e);
        return true;
    }
};

rest.downloadReport = function(data)
{
    var sUrl = '/hoot-services/info/reports/get?id=' + data.id + '&reportname=' + data.outputname;
    var link = document.createElement('a');
    link.href = sUrl;
    if (link.download !== undefined) {
        //Set HTML5 download attribute. This will prevent file from opening if supported.
        var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
        link.download = fileName;
    }
    //Dispatching click event.
    if (document.createEvent) {
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        link.dispatchEvent(e);
        return true;
    }
};

    rest.createValidationMap = function (data, callback) {

        d3.json('/hoot-services/job/review/custom/HGIS/preparevalidation')
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(data), function (error, resp) {

                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                rest.status(resp.jobId, callback);
            });
    };

    rest.createFilteredMap = function (data, callback) {

        d3.json('/hoot-services/job/filter/custom/HGIS/filternonhgispois')
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(data), function (error, resp) {

                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                rest.status(resp.jobId, callback);
            });
    };

    rest.getTransaltionCapabilities = function(data, callback) {
        d3.xhr(window.location.protocol + '//' + window.location.hostname +
            Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) + '/capabilities')
            .get(function(error, resp){
                callback(error, resp);
            });
    };

    rest.saveReviewBookmark = function(data, callback) {
        d3.json('/hoot-services/job/review/bookmarks/save')
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(data), function (error, resp) {

                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                callback(resp);
            });
    };

    rest.getAllReviewBookmarks = function(data, callback) {
        var url = '/hoot-services/job/review/bookmarks/getall?orderBy=' + data.orderBy + '&asc=' + data.asc +
            '&limit=' + data.limit + '&offset=' + data.offset;
        if(data.createFilterVal){
            url += '&createFilterVal=' + data.createFilterVal;
        }
        if(data.layerFilterVal){
            url += '&layerFilterVal=' + data.layerFilterVal;
        }

        d3.json(url, function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get all bookmarks failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getReviewBookmark = function(data, callback) {
         d3.json('/hoot-services/job/review/bookmarks/get?bookmarkId=' + data.bookmarkId, function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get bookmark failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.getReviewBookmarkStat = function(data, callback) {
         d3.json('/hoot-services/job/review/bookmarks/stat', function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get bookmark failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };

    rest.deleteReviewBookmark = function(data, callback) {
        d3.json('/hoot-services/job/review/bookmarks/delete?bookmarkId=' + data.bookmarkId)
        .send('DELETE',function (error, resp) {

                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                callback(resp);
            });


    };


    rest.getSaveUser = function(data, callback) {
        d3.json('/hoot-services/osm/user/-1?userEmail=' + data.email)
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(data), function (error, resp) {

                if (error) {
                    return callback(_alertError(error, 'Requested job failed! For detailed log goto Manage->Log'));
                }
                callback(resp);
            });
    };

    rest.getAllUsers = function(callback) {
        d3.json('/hoot-services/osm/user/-1/all', function (error, resp) {
            if (error) {
                return callback(_alertError(error, 'Get all users failed! For detailed log goto Manage->Log'));
            }
            callback(resp);
        });
    };


        rest['' + command + ''](data, callback, option);
    };

Hoot.model.REST.formatNodeJsPortOrPath = function(p) {
    if (isNaN(p)) {
        return '/' + p;
    } else {
        return ':' + p;
    }
};

Hoot.model.REST.WarningHandler = function(resp){
    if(resp.statusDetail){
        var detail = resp.statusDetail;
        var statDetail  = null;
        try{
            statDetail = JSON.parse(detail);
        } catch (e) {
            // must be string so try to see if it is warning
            if(detail.indexOf('WARNINGS:') === 0){
               iD.ui.Alert('SUCCESS: but the job has completed with warnings. For detailed log goto Manage->Log','warning',new Error().stack);
               return;
            }
        }

        if(statDetail){
            if(statDetail.children && statDetail.children.length > 0){
                var isWarning = false;
                _.each(statDetail.children, function(child){
                    if(child && child.detail){
                        var childDetail = child.detail.trim();
                        if(childDetail.indexOf('WARNINGS:') === 0){
                            isWarning = true;

                        }
                    }

                });
                if(isWarning === true){
                    iD.ui.Alert('SUCCESS: but the job has completed with warnings. For detailed log goto Manage->Log','warning',new Error().stack);
                }
            }
        }
    }
};