/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main reviewable traversing mechanism
// It first gets the available reviewable infor using ReviewGetStatistics
// If there are reviewables then calls get next
// If checks to see if _currentReviewable is populated and if not then
// it thinks it is first time in review session. It calls random reviewable by
// using sequnce offset of -999 where anything less then -1 will get you the random
// reviewable.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.actions.traversereview = function (context)
{
	var _events = d3.dispatch();
    
	var _instance = {};
    var _currentReviewable;
    var _mapid;
    var _nextid;
    var _previd;


    /**
    * @desc Initializes control with id of of next and previous buttons and map id
    * @return returns true when all params are correct else false
    **/
    _instance.initialize = function(opts) {
        if(!opts.nextid || !opts.previd){
            iD.ui.Alert('Traverse control not initialized. Invalid id!', 'Error');
            return false;
        }
        
        if(!opts.mapid){   
            iD.ui.Alert('Traverse control not initialized. Invalid mapid!', 'Error');  
            _instance.disableButton(true);       
            return false;
        }
        _nextid = opts.nextid;
        _previd = opts.previd;
        _mapid = opts.mapid;
        _instance.disableButton(false);
        return true;
    }


    /**
    * @desc jumps to next available reviewable relation.
    * @param direction -  forward |  backward
    **/
    _instance.jumpTo = function(direction) {
        // First check to see if we have all needed params
        if(!_isInitialized()){
            iD.ui.Alert('Traverse control not initialized. Please contact administrator!', 'Error');
            return;
        }

        // if we have unsaved changes then exit.
        // We do this to prevent the miss-match of changeset between backend and 
        // iD entity graph
        var hasChange = context.history().hasChanges();
        if(hasChange === true) {
        	iD.ui.Alert('Please resolve or undo the current feature' + 
                'changes before proceeding to the next review.', 'warning');
            return;
        }

        // Now get the information of all reviewable items for the current map id
        Hoot.model.REST('ReviewGetStatistics', _mapid, function (error, response) {
            if(error){
                iD.ui.Alert('Failed to get review statistics.','warning');
                // there was error so throw error and exit review since this was major melt down?
                return;
            }

            // Store the review statics in metadata so we can show it when we
            // get to the reviewable item. (we wait to get note of a reviewable)
            _parent().info.metadata.setCurrentReviewMeta(response);

            // this handles only for first time
            // Modify to able to handle when pressed next
            var reviewData = {};
            if(_currentReviewable){
                reviewData.mapId = _currentReviewable.mapId;
                reviewData.sequence = _currentReviewable.sortOrder;
                reviewData.direction = direction;
            } else {
                reviewData.mapId = _mapid;
                // something less then -1 will get random reviewable
                reviewData.sequence = -999;
                reviewData.direction = direction;
            }


            Hoot.model.REST('reviewGetNext', reviewData, function (error, response) {
                try {
                    if(error){
                        throw 'Failed to retrieve next set of reviewable features from service!';
                    }


                    if((1*response.resultCount) > 0){
                        _currentReviewable = response;
                        _parent().actions.idgraphsynch.getRelationFeature
                        (reviewData.mapId, response.relationId, function(newReviewItem){
                            _parent().map.featurehighlighter.highlightLayer(newReviewItem.members[0], 
                                newReviewItem.members[1]);

                            // Move this to proper location since highlightLayer is timer asynch
                            _parent().map.featureNavigator.panToEntity(newReviewItem, 
                                true);
                        });

                    } else {
                        iD.ui.Alert('There are no more available features to review. ' + 
                            'Exiting the review session.',
                            'info');
                        _exitReviewSession();
                    }
                }
                catch (ex) {
                    console.error(ex);
                    var r = confirm('Failed to retrieve the next features for review!' +
                        '  Do you want to continue?');
                    if(r === false){
                        _exitReviewSession();
                    }
                } finally {
                   // context.hoot().control.conflicts.setProcessing(false);
                }
            });
        });


    }


    _instance.gotoNext = function() {
        context.flush(true);
        _instance.jumpTo('forward');
    };


    
    _instance.traverseForward = function () {
        var vicheck = _vischeck();
        if(!vicheck){
            return;
        }
        _instance.jumpTo('forward');
    };


    _instance.traverseBackward = function () {
        var vicheck = _vischeck();
        if(!vicheck){
            return;
        }
        _instance.jumpTo('backward');
    };

    _instance.disableButton = function (doDisable){
        if(_nextid && _previd) {
            var btn = d3.select('.' + _nextid);
            if(btn){
                if(doDisable === true){
                    btn.classed('hide', true);
                } else {
                    btn.classed('hide', false);
                }
            }

            btn = d3.select('.' + _previd);
            if(btn){
                if(doDisable === true){
                    btn.classed('hide', true);
                } else {
                    btn.classed('hide', false);
                }
            }
        }
        
    }

    _instance.getCurrentReviewable = function(){
        return _currentReviewable;
    }

    var _isInitialized = function()
    {
        return (_nextid && _previd && _mapid);
    }
    
 
    var _exitReviewSession = function(msg) {
        _parent().deactivate(msg);
        _parent().reviewNextStep();
    }


    var _vischeck = function(){
        return _parent().vischeck();
    };

    var _parent = function() {
        return context.hoot().control.conflicts;
    };


	return d3.rebind(_instance, _events, 'on');
}
