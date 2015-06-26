Hoot.model.REST = function (command, data, callback, option) {
    if (typeof (data) === 'function' && !callback) {
        callback = data;
    }
    var rest = {};

    function _alertError(error, errorText){
        console.log(error);
        alert(errorText);
        var localResp = {};
        localResp.status = "failed";
        localResp.error = error;
        return localResp;
    }

    function _confirmError(error, errorText){
        var localResp = {};
        localResp.status = "failed";
        localResp.error = error;
        var r = confirm(errorText);
        if (r == true) {
            localResp.reset = true;
        }
        return localResp;
    }

    rest.jobStatusInterval = 2000;
    rest.Upload = function (data, callback) {
        if (!data.TRANSLATION || !data.INPUT_TYPE || !data.formData) {
            return false;
        }
        d3.xhr('/hoot-services/ingest/ingest/upload?TRANSLATION=' + data.TRANSLATION + '&INPUT_TYPE=' +
                data.INPUT_TYPE + '&INPUT_NAME=' + data.INPUT_NAME)
                        .header('access-control-allow-origin', '*')
            .post(data.formData, function (error, json) {


                if (json && json.response.indexOf('<html>') !== -1) {
                    error = 'error';
                }
                callback(json);
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

    rest.getAvailLayers = function (callback) {
        var request = d3.json('/hoot-services/osm/api/0.6/map/layers');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Get available layers failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };


    rest.enableBaseMap = function (data, callback) {
        var request = d3.json('/hoot-services/ingest/basemap/enable?NAME=' + data.name + "&ENABLE=true");
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Enable Basemap failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };


    rest.disableBaseMap = function (data, callback) {
        var request = d3.json('/hoot-services/ingest/basemap/enable?NAME=' + data.name + "&ENABLE=false");
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Disable Basemap failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };


    rest.getMapSize = function (mapId, callback) {
        var request = d3.json('/hoot-services/info/map/size?mapid=' + mapId);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Get map size failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };

    rest.getMapSizeThresholds = function (callback) {
        var request = d3.json('/hoot-services/info/map/thresholds');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Get map size thresholds failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };

    rest.Conflate = function (data, callback, option) {
         data.INPUT1_TYPE = data.INPUT1_TYPE || 'DB';
         data.INPUT2_TYPE = data.INPUT2_TYPE || 'DB';
        if (!data.INPUT1 || !data.INPUT2 || !data.OUTPUT_NAME) {
            return false;
        }
        if(option.queryInterval){
            rest.jobStatusInterval = option.queryInterval;
        }

        d3.json('/hoot-services/job/conflation/execute')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(data), function (error, resp) {
                if(callback){
                    var param = {};
                    param.status = "requested";
                    param.jobid = resp.jobid;
                    callback(param);
                }
                if (error) {
                    return callback(_alertError(error, "Requested job failed! For detailed log goto Manage->Log"));
                }
                rest.status(resp.jobid, callback);
            });
    };

    rest.poiMerge = function (data, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname + ":"  +
               iD.data.hootConfig.p2pServerPort +
               '/p2pmerge')
           .post(data, function (error, resp) {
               if (error) {
                   _alertError(error, "Poi merge failed.");
               }
               var oParser = new DOMParser();
               var oDOM = oParser.parseFromString(resp.output, "text/xml");

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
                    console.log(error);
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
                    console.log(error);
                    return error;
                }

                if (resp.status !== 'running') {
                    if(resp.status == 'failed'){
                        var showError = true;
                        if(resp.statusDetail){
                            var detail = resp.statusDetail;
                            if(detail.indexOf("User requested termination") > -1){
                                showError = false;
                            }

                        }
                        if(showError){
                            alert("Requested job failed! For detailed log goto Manage->Log");
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
                    callback(resp);
                }
            };
    };


    rest.cancel = function(data, callback) {


        d3.json('/hoot-services/job/cancel')
        .header('Content-Type', 'text/plain')
        .post(JSON.stringify(data), function (error, resp) {
            if (error) {
                console.log(error);
                return error;
            }


            rest.status(resp.jobid, callback);
        });
    };


    rest.CookieCutterConflate = function (data, callback, option) {
            data.INPUT1_TYPE = data.INPUT1_TYPE || 'DB';
            data.INPUT2_TYPE = data.INPUT2_TYPE || 'DB';
            data.CONFLATION_TYPE = 'Horizontal';
            data.alpha = data.alpha || '2500';
            data.buffer = data.buffer || '0';
            data.crop = data.crop || 'false';
            data.outputbuffer = data.outputbuffer || '-1000';
            data.cuttershape = data.INPUT1;
            data.inputtype= 'DB';
            data.cuttershapetype = 'DB';
            data.outputname = data.outputname = 'layer_' + Math.random().toString(16).substring(7);
            data.input = data.INPUT2;
        if (!data.INPUT1 || !data.INPUT2 || !data.OUTPUT_NAME) {
            return false;
        }
        if(option.queryInterval){
            rest.jobStatusInterval = option.queryInterval;
        }
        d3.json('/hoot-services/job/cookiecutter/execute')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(data), function (error, resp) {
                if (error) {
                    return callback(_alertError(error, "Cookie Cutter Conflate job failed! For detailed log goto Manage->Log"));
                }
                rest.status(resp.jobid, callback);
            });
    };
/*
    rest.LTDS = function (data, callback) {
        if (!data) {
            return false;
        }

        d3.json('/hoot-services/ogr/ltds/translate/' + data.id + '?translation=OSM_to_englishTDS.js')
            .header('Content-Type', 'text/plain')
            .post(data.osmXml, function (error, json) {
                if (error) {
                    return callback(_alertError(error, "TDS translation job failed! For detailed log goto Manage->Log"));
                }
                callback(json);
                return json;
            });
    };
    rest.TDSToOSM = function (data, callback) {
        if (!data) {
            return false;
        }
        d3.json('/hoot-services/ogr/ltds/translate/tds/' + data.id + '?translation=englishTDS_to_OSM.js')
            .header('Content-Type', 'text/plain')
            .post(data.osmXml, function (error, json) {
                if (error) {
                    return callback(_alertError(error, "TDS to OSM translation job failed! For detailed log goto Manage->Log"));
                }
                callback(json);
                return json;
            });
    };

*/

    rest.GetTranslationServerStatus = function(data, callback) {
        d3.json('/hoot-services/ogr/translationserver/status' , function (error, resp) {
                if (error) {
                    console.log(error);
                    return error;
                }

                if(resp.port && resp.isRunning === true)
                {
                    iD.data.hootConfig.translationServerPort = resp.port;
                }
                else
                {
                    alert('Can not find translation server info. Is it running?');
                }
            });
    }

// This uses translation node js server using CORS
    rest.LTDS = function (data, callback) {
        if(!iD.data.hootConfig.translationServerPort){
            alert('Can not find translation server info. Is it running?');
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

        d3.xhr(window.location.protocol + '//' + window.location.hostname + ":" + iD.data.hootConfig.translationServerPort + '/osmtotds')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(reqData), function (error, json) {
                var res = JSON.parse(json.responseText);
                var tdsXml = res.output;
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(tdsXml,"text/xml");
                var tagslist = xmlDoc.getElementsByTagName("tag");
                var attribs = {};
                var fcode = null;
                _.each(tagslist, function(tag){
                    var key = tag.attributes['k'].value;
                    var val = tag.attributes['v'].value;
                    attribs[key] = val;
                    if(key == 'Feature Code'){
                        var parts = val.split(':');
                        fcode = parts[0].trim();
                    }
                });
                // This is where we get the fields list based on fcode
                if(fcode){
                    d3.xhr(window.location.protocol + '//' + window.location.hostname + ":"  +
                        iD.data.hootConfig.translationServerPort + '/osmtotds?fcode='+fcode +
                         '&geom=' + data.geom + '&translation=' + data.translation)
                        .get(function(error, resp){
                            var ret = {};
                            ret.tableName = '';
                            ret.attrs = attribs;
                            ret.fields = resp.responseText;
                            callback(ret);

                        })
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
            alert('Can not find translation server info. Is it running?');
            return;
        }


        if(data){
            var fcode = data.fcode;
            var translation = data.translation;
            d3.xhr(window.location.protocol + '//' + window.location.hostname + ":"  + iD.data.hootConfig.translationServerPort +
                '/tdstoosm?fcode='+ fcode + '&translation=' + translation)
                .get(function(error, resp){
                    callback(resp);

                })
        }
    };

    rest.TDSToOSM = function (data, callback) {
        if(!iD.data.hootConfig.translationServerPort){
            alert('Can not find translation server info. Is it running?');
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

        d3.xhr(window.location.protocol + '//' + window.location.hostname + ":"  + iD.data.hootConfig.translationServerPort +'/tdstoosm')
            .header('Content-Type', 'text/plain')
            .post(JSON.stringify(reqData), function (error, json) {
                var res = JSON.parse(json.responseText);
                var tdsXml = res.output;
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(tdsXml,"text/xml");
                var tagslist = xmlDoc.getElementsByTagName("tag");
                var attribs = {};

                _.each(tagslist, function(tag){
                    var key = tag.attributes['k'].value;
                    var val = tag.attributes['v'].value;
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
        d3.json('/hoot-services/job/export/execute')
        .post(data, function (error, data) {
            if (error){
                alert("Export job failed! For detailed log goto Manage->Log");
                return error;
            }
            return data;
        });
    };


    rest.getConflationCustomOpts = function(confType,callback){
    /*	var confTypes=['custom','horizontal','average','reference'];
    	_.each(confTypes,function(confType){
    		var request = d3.json('/hoot-services/info/advancedopts/getoptions?conftype='+confType);
    		request.get(function (error, resp) {
                if (error) {
                    return callback(_alertError(error, "Get custom conflation options failed! For detailed log goto Manage->Log"));
                } else {
                	if(confType=='custom'){
                		iD.data['hootConfAdvOps'] = resp;
                	} else {
                		iD.data['hootConfAdvOps_'+confType] = resp;
                	}
                }
            });
    	});*/

        // Doing the stacked load to prevent race condition in loading data
        var request = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=custom');
        request.get(function (error, resp) {
                if (error) {
                    return callback(_alertError(error, "Get custom conflation options failed! For detailed log goto Manage->Log"));
                } else {
                    iD.data['hootConfAdvOps'] = resp;
                    var request_hrz = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=horizontal');
                    request_hrz.get(function (error, resp1) {
                        if (error) {
                            _alertError(error, "Get horizontal conflation options failed! For detailed log goto Manage->Log");
                            return;
                        } else {
                            iD.data['hootConfAdvOps_horizontal'] = resp1;
                            var request_ave = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=average');
                            request_ave.get(function (error, resp2) {
                                if (error) {
                                    _alertError(error, "Get average conflation options failed! For detailed log goto Manage->Log");
                                    return;
                                } else {
                                    iD.data['hootConfAdvOps_average'] = resp2;
                                    var request_ref = d3.json('/hoot-services/info/advancedopts/getoptions?conftype=reference');
                                    request_ref.get(function (error, resp3) {
                                        if (error) {
                                            _alertError(error, "Get reference conflation options failed! For detailed log goto Manage->Log");
                                            return;
                                        } else {
                                            iD.data['hootConfAdvOps_reference'] = resp3;
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
                return callback(_alertError(error, "Get Reports List failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };

    rest.deleteReport = function (id, callback) {
        var request = d3.json('/hoot-services/info/reports/delete?id=' + id);
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Delete Reports failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    }


    rest.getWFSList = function(callback) {
        var request = d3.json('/hoot-services/job/export/wfs/resources');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Get WFS List failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };

    rest.getBaseMapsList = function(callback) {
        var request = d3.json('/hoot-services/ingest/basemap/getlist');
        request.get(function (error, resp) {
            if (error) {
                return callback(_alertError(error, "Get Base Maps List failed! For detailed log goto Manage->Log"));
            }
            callback(resp);
        });
    };

    rest.ReviewGet = function (mapId, callback) {
            var numItems = 1000;
            var highestReviewScoreFirst = true;
            var reviewScoreThresholdMinimum = '0';
            var geospatialBounds = '-180,-90,180,90';
            var boundsDisplayMethod = 'reviewableItemOnly';
        d3.json('/hoot-services/job/review?mapId=' + mapId + '&boundsDisplayMethod=' + boundsDisplayMethod + '&numItems=' + numItems + '&highestReviewScoreFirst=' + highestReviewScoreFirst + '&reviewScoreThresholdMinimum=' + reviewScoreThresholdMinimum + '&geospatialBounds=' + geospatialBounds, function (error, resp) {
                if (error) {
                    return callback(_confirmError(error, "Get review failed! Do you want to reset layers? \n " +
                            "(Note: For detailed error log goto Manage->Log)"));
                }
                return callback(resp);
        });
    };

rest.ReviewMarkAll = function(data, callback)
{
    var mapId = data.mapId;
    //console.log("ReviewMarkAll mapId: " + mapId);
    //markItemsReviewedRequest is required but can be unpopulated when markAll=true
    var markItemsReviewedRequest = {};
    markItemsReviewedRequest.reviewedItems = {};
    markItemsReviewedRequest.reviewedItemsChangeset = "";
    d3.json('/hoot-services/job/review?mapId='+mapId+'&markAll=true')
        .header('Content-Type', 'application/json')
        .send(
            'PUT',
            JSON.stringify(markItemsReviewedRequest),
            function(error, response)
            {
                if (error)
                {
                    alert("Review Mark All failed.");
                }
                callback(error, response);
            });
};

rest.getTranslations = function(callback) {
    d3.json('/hoot-services/ingest/customscript/getlist', function (error, resp) {
        if (error) {
            return callback(_alertError(error, "Get Translations failed! For detailed log goto Manage->Log"));
        }
        if(callback){callback(resp);}
    });
};

rest.getExportResources = function(name,callback) {
    d3.text('/hoot-services/job/export/resources', function (error, resp) {
        if (error) {
            return callback(_alertError(error, "Get Exports failed! For detailed log goto Manage->Log"));
        }
        if(callback){callback(resp);}
    });
};


rest.getTranslation = function(name,callback) {
    d3.text('/hoot-services/ingest/customscript/getscript?SCRIPT_NAME='+ name, function (error, resp) {
        if (error) {
            return callback(_alertError(error, "Get Translation failed! For detailed log goto Manage->Log"));
        }
        if(callback){callback(resp);}
    });
};

rest.getDefaultTranslation = function(path,callback) {
    d3.text('/hoot-services/ingest/customscript/getdefaultscript?SCRIPT_PATH='+ path, function (error, resp) {
        if (error) {
            return callback(_alertError(error, "Get Translation failed! For detailed log goto Manage->Log"));
        }
        if(callback){callback(resp);}
    });
};

rest.deleteTranslation = function(name,callback) {
    d3.text('/hoot-services/ingest/customscript/deletescript?SCRIPT_NAME='+name, function (error, resp) {
        if (error) {
            return callback(_alertError(error, "Get Translation failed! For detailed log goto Manage->Log"));
        }
        if(callback){callback(resp);}
    });
};

rest.postTranslation = function(data,callback) {
d3.json('/hoot-services/ingest/customscript/save?SCRIPT_NAME='+data.NAME+'&SCRIPT_DESCRIPTION='+data.DESCRIPTION)
            .header('Content-Type', 'text/plain')
            .post(data.data, function (error, resp) {
                if (error) {
                    return callback(_alertError(error, "Post Translation failed! For detailed log goto Manage->Log"));
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
            return callback(_alertError(error, "Get service version info failed! For detailed log goto Manage->Log"));
        }
        return callback(resp);
    });
};

rest.servicesVersionDetail = function(callback)
{
    d3.json('/hoot-services/info/about/servicesVersionDetail', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, "Get service version detail failed! For detailed log goto Manage->Log"));
        }
        return callback(resp);
    });
};

rest.coreVersionInfo = function(callback)
{
    d3.json('/hoot-services/info/about/coreVersionInfo', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, "Get core version info failed! For detailed log goto Manage->Log"));
        }
        return callback(resp);
    });
};

rest.coreVersionDetail = function(callback)
{
    d3.json('/hoot-services/info/about/coreVersionDetail', function(error, resp)
    {
        if (error) {
            return callback(_alertError(error, "Get core version detail failed! For detailed log goto Manage->Log"));
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
            return callback(_alertError(error, "Get debug log failed! For detailed log goto Manage->Log"));
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
}


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
}

    rest['' + command + ''](data, callback, option);
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
               alert('SUCCESS: but the job has completed with warnings. For detailed log goto Manage->Log');
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
                    alert('SUCCESS: but the job has completed with warnings. For detailed log goto Manage->Log');
                }
            }
        }
    }
};



