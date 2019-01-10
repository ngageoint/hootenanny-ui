/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.model.conflate REST call to conflate hoot service where it my take in different types of conflation
//  like horizontal or reference.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.conflate = function(context)
{
    var model_conflate = {};

    model_conflate.conflate = function (type, data, callback) {
        var option = {};
        option.queryInterval = iD.data.hootConfig.JobStatusQueryInterval;
        Hoot.model.REST(type, data, function (statusInfo) {

            if(statusInfo.status && statusInfo.status === 'requested'){
                var requestStatus = {};
                requestStatus.status = 'requested';
                requestStatus.jobid = statusInfo.jobid;
                callback(requestStatus);

            } else {
                if(statusInfo.status === 'failed'){
                    context.hoot().reset();
                    if(statusInfo.error){
                        window.console.error(statusInfo.error);
                    }
                } else {

                    Hoot.model.REST('getAvailLayers', function (a) {

                        if(a.status === 'failed'){
                            context.hoot().reset();
                            if(a.error){
                                window.console.error(a.error);
                                return;
                            }
                        }

                        context.hoot().model.layers.setAvailLayers(a.layers);
                        var key = {
                            'name': data.OUTPUT_NAME,
                            'color': 'green'
                        };
                        if (callback) {
                            callback(key);
                        }
                    });
                }
            }

        }, option);
    };


    return model_conflate;
};