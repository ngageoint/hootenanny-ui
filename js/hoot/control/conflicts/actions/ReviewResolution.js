/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.actions.reviewresolution provide resolve and accept all operations
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.actions.reviewresolution = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};

    /**
       * @desc This function resolves a reviewable item
    **/
    _instance.retainFeature = function () {
        try {
            // Related to hootenanny-ui/issues/284
            // When user merges and presses resolve since in control/Conflicts.js
            // call to context.enter(iD.modes.Select(context, [mergedNode.id])); locks in select mode
            // and ends up element not found error
            context.exit();
            context.ui().sidebar.hide();

            _parent().setProcessing(true, 'Please wait while resolving review item.');
            var vicheck = _vischeck();
            if(!vicheck){
                _parent().setProcessing(false);
                return;
            }
            var currentReviewable = _parent().actions.traversereview.getCurrentReviewable();
            if(currentReviewable) {

                var fid = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
                var reviewableRelEntity = context.hasEntity(fid);

                for(var i=0; i<reviewableRelEntity.members.length; i++) {
                    var itemKlass = reviewableRelEntity.members[i].id;
                    var classid = 'activeReviewFeature';
                    if(i > 0) {
                        classid += '' + (i + 1);
                    }
                    d3.selectAll('.' + itemKlass)
                        .classed(classid, false);
                }
                d3.select('div.tag-table').remove();


                _parent().actions.idgraphsynch.updateReviewTagsForResolve(reviewableRelEntity);

                var hasChanges = context.history().hasChanges();
                if (hasChanges) {
                    _parent().setProcessing(false);
                    iD.modes.Save(context).save(context, function () {
                        try {
                            _parent().actions.traversereview.jumpTo('forward');

                        } catch (err) {
                            _handleError(err, true);
                        }


                    });
                } else {
                        _parent().actions.traversereview.jumpTo('forward');
                }
            } else {
                iD.ui.Alert("Nothing to review.",'notice');
            }
        } catch (err) {
            _handleError(err, true);
        } finally {
//            Conflict.setProcessing(false);
        }
    };


    /**
    * @desc Checks for any unsaved item and then resolves all reviewables
    * @param data - resolved items
    **/
    _instance.acceptAll = function(data) {
        var doProceed = true;

        var hasChanges = context.history().hasChanges();
        if (hasChanges) {
            _parent().setProcessing(false);
            iD.modes.Save(context).save(context, function () {
                try {
                    _performAcceptAll(data);

                } catch (err) {
                    _handleError(err, true);
                }


            });
        } else {
            _performAcceptAll(data);
        }
    }

    /**
    * @desc Resolves all reviewables
    * @param data - resolved items
    **/
    _performAcceptAll = function(data) {
        try{
            _parent().setProcessing(true, 'Please wait while resolving all review items.');
            Hoot.model.REST('resolveAllReviews', data.mapId, function (error, response)
            {
                try {
                     _parent().deactivate(true);
                    d3.select('body').call(iD.ui.Processing(context,true,"Resolving all reviewable features..."));
                    // removed event.acceptAll(data) and brought in to direct call below
                    context.hoot().mode('browse');
                    context.hoot().model.conflicts.acceptAll(data, function () {
                        try {
                            _parent().reviewNextStep();
                        } catch (err) {
                            _handleError(err, true);
                        }

                    });
                } catch (err) {
                    _handleError(err, true);
                }

            });
        } catch (err) {
            _handleError(err, true);
        }
    }


    /**
    * @desc layer visibility check operation
    **/
    var _vischeck = function(){
        return _parent().vischeck();
    };


    /**
    * @desc Helper function for error handling. Logs error cleans out screen lock and alerts user optionally
    * @param err - the error message
    * @param doAlertUser - switch to show user alert
    **/
    var _handleError = function(err, doAlertUser) {
        console.error(err);
        _parent().setProcessing(false);
        if(doAlertUser === true) {
            iD.ui.Alert(err,'error',new Error().stack);
        }
    }
    var _parent = function() {
        return context.hoot().control.conflicts;
    }
    return d3.rebind(_instance, _events, 'on');
}