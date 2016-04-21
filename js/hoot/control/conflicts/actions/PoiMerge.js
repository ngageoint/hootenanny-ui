/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.actions.poimerge provides poi merge related controls where it
// 1. Provides auto merge operation for 2 POIS
// 2. POI merge button enable/ disable
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.actions.poimerge = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};
    var _mergeFeatures;
    // @TODO: get rid of f  + f against concept after getting concensus
    var _feature;
    var _againstFeature;


    /**
    * @desc enable/disable merge feature operation by toggling the function handler
    * @param doEnable - switch
    * @param r - feature (Tobe deprecated)
    * @param ra - against feature (Tobe deprecated)
    **/
    _instance.enableMergeFeature = function(doEnable, r, ra) {
        _feature = r;
        _againstFeature = ra;



        if(doEnable === true){
            _mergeFeatures = function() {
                if(context.graph().entities[_feature.id] && context.graph().entities[_againstFeature.id]){
                    try {
                        _instance.disableMergeButton(true);
                        var currentReviewable = _parent().actions.traversereview.getCurrentReviewable();
                        context.hoot().model.conflicts.autoMergeFeature(
                          _feature, _againstFeature, currentReviewable.mapId, currentReviewable.relationId,
                          function(){
                            _parent().setProcessing(false);
                          }
                        );
                    } catch (err) {
                        _handleError(err, true);
                    }


                } else {
                    _parent().setProcessing(false);
                    iD.ui.Alert('Nothing to merge.','notice');
                    return;
                }
            };
        } else {
             _mergeFeatures = function() {};
        }
    };

    /**
    * @desc Performs auto merge
    **/
	_instance.autoMerge = function() {
        context.background().updateReviewLayer({});
        _parent().setProcessing(true, 'Please wait while merging review items.');
        try{
            d3.event.stopPropagation();
            d3.event.preventDefault();
            //Overridden in highlightLayer
            _mergeFeatures();
        } catch (err) {
            _handleError(err, true);
        }

    };

    /**
    * @desc Merge button toggle
    * @param doDisable - switch
    **/
    _instance.disableMergeButton = function (doDisable){
        d3.select('.merge').classed('hide', doDisable);
    };

    /**
    * @desc Updates merge button based on type and tag
    **/
    _instance.updateMergeButton = function(){
        var currentReviewable = _parent().actions.traversereview.getCurrentReviewable();
        if(currentReviewable){
            var relId = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
            var rel = context.hasEntity(relId);
            var isReview = null;
            var isPoiReview = true;
            if(rel){
                isReview = rel.tags['hoot:review:needs'];
                if(rel.members.length > 1){
                    for(var i=0; i<rel.members.length; i++){
                        var mem = rel.members[i];
                        if(mem.type !== 'node'){
                            isPoiReview = false;
                            break;
                        }

                    }
                }
            }

            if(isPoiReview){
                if(rel && rel.members.length > 1 && (isReview && isReview === 'yes')){
                    if(context.graph().entities[rel.members[0].id] &&
                        context.graph().entities[rel.members[1].id]){
                            _instance.disableMergeButton(false);
                        } else {
                            //disableMergeButton(true);
                        }
                } else {
                    //disableMergeButton(true);
                }
            } else {
                _instance.disableMergeButton(true);
            }

        }
    };

    /**
    * @desc Helper function for error handling. Logs error cleans out screen lock and alerts user optionally
    * @param err - the error message
    * @param doAlertUser - switch to show user alert
    **/
    var _handleError = function(err, doAlertUser) {
        _parent().setProcessing(false);
        if(doAlertUser === true) {
            iD.ui.Alert(err,'error',new Error().stack);
        }
    };

    var _parent = function() {
        return context.hoot().control.conflicts;
    };

    return d3.rebind(_instance, _events, 'on');

};