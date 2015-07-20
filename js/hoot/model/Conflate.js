Hoot.model.conflate = function(context)
{
	var model_conflate = {};

    model_conflate.conflate = function (type, data, callback) {
        var option = {};
        option.queryInterval = iD.data.hootConfig.JobStatusQueryInterval;
        Hoot.model.REST(type, data, function (statusInfo) {

            if(statusInfo.status && statusInfo.status == "requested"){
                var requestStatus = {};
                requestStatus.status = "requested";
                requestStatus.jobid = statusInfo.jobid;
                callback(requestStatus);

            } else {
                if(statusInfo.status == 'failed'){
                    context.hoot().reset();
                    if(statusInfo.error){
                        context.hoot().view.utilities.errorlog.reportUIError(statusInfo.error);
                    }
                } else {

                    Hoot.model.REST('getAvailLayers', function (a) {

                        if(a.status == 'failed'){
                            context.hoot().reset();
                            if(a.error){
                                context.hoot().view.utilities.errorlog.reportUIError(a.error);
                                return;
                            }
                        }

                        context.hoot().model.layers.setAvailLayers(a.layers);
                        var key = {
                            'name': data.OUTPUT_NAME.substring(data.OUTPUT_NAME.lastIndexOf('|')+1), // data.OUTPUT_NAME, <-- updated for conflated layers with path name
                            'color': 'green'
                        };
                        if (callback) {
                            callback(key);
                        }
                    });
                    context.hoot().view.utilities.reports.populateReports();
                }
            }

        }, option);
    };


	return model_conflate;
}