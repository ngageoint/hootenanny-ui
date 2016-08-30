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
    var _currentReviewableEntityId;
    var _mapid;
    var _nextid;
    var _previd;


    /**
    * @desc Initializes control with id of of next and previous buttons and map id
    * @return returns true when all params are correct else false
    **/
    _instance.initialize = function(opts) {
        if(!opts.nextid || !opts.previd){
            iD.ui.Alert('Traverse control not initialized. Invalid id!', 'Error',new Error().stack);
            return false;
        }

        if(!opts.mapid){
            iD.ui.Alert('Traverse control not initialized. Invalid mapid!', 'Error',new Error().stack);
            _instance.disableButton(true);
            return false;
        }
        _nextid = opts.nextid;
        _previd = opts.previd;
        _mapid = opts.mapid;
        _instance.disableButton(false);
        return true;
    };


    /**
    * @desc jumps to next available reviewable relation.
    * @param direction -  forward |  backward
    **/
    _instance.jumpTo = function(direction) {
        try {
            _parent().setProcessing(false);
            _parent().setProcessing(true, 'Please wait while stepping to next review item.');
            // First check to see if we have all needed params
            if(!_isInitialized()){
                throw new Error('Traverse control not initialized. Please contact administrator!');
            }

            // if we have unsaved changes then exit.
            // We do this to prevent the miss-match of changeset between backend and
            // iD entity graph
            var hasChange = context.history().hasChanges();
            if(hasChange === true) {
                _parent().setProcessing(false);
                iD.ui.Alert('Please resolve or undo the current feature ' +
                    'changes before proceeding to the next review.', 'warning',new Error().stack);
                return;
            }

            // Now get the information of all reviewable items for the current map id
            Hoot.model.REST('ReviewGetStatistics', _mapid, function (error, response) {
                try {
                    if(error){
                        throw new Error('Failed to get review statistics.');
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


                    var forcedReviewableItem = context.hoot().view.utilities.reviewbookmarknotes.getForcedReviewableItem();
                    if(forcedReviewableItem){
                        _reviewGetNextHandler(null, forcedReviewableItem);
                        context.hoot().view.utilities.reviewbookmarknotes.setForcedReviewableItem(null);
                    } else {
                        // First check to see if there are any siblings within the relation
                        if(_currentReviewable && _currentReviewableEntityId){
                            _parent().actions.idgraphsynch.getRelationFeature(_currentReviewable.mapId,_currentReviewable.relationId,function(){
                                var feature = context.hasEntity(_currentReviewableEntityId);
                                if(feature){
                                    var nextReviewInRelation = _.find(context.graph().parentRelations(feature),function(item){return item.tags['hoot:review:needs'] === 'yes';});
                                    if(nextReviewInRelation === undefined){
                                        Hoot.model.REST('reviewGetNext', reviewData, _reviewGetNextHandler);
                                    } else{
                                        var nextReview = {
                                            mapId:nextReviewInRelation.mapId,
                                            resultCount:1,
                                            sortOrder:parseInt(nextReviewInRelation.tags['hoot:review:sort_order']),
                                            relationId: parseInt(nextReviewInRelation.origid.replace('r',''))
                                        };
                                        iD.operations.Review([_currentReviewableEntityId],context)();
                                        _reviewGetNextHandler(null, nextReview);
                                    }
                                } else {
                                    Hoot.model.REST('reviewGetNext', reviewData, _reviewGetNextHandler);
                                }
                            });
                        } else {
                            Hoot.model.REST('reviewGetNext', reviewData, _reviewGetNextHandler);
                        }
                    }

                } catch (err) {
                    _handleError(err, true);
                }
            });

        } catch (err) {
            _handleError(err, true);
        }


    };


    var _reviewGetNextHandler = function (error, response) {
        try {
            if(error){
                throw new Error('Failed to retrieve next set of reviewable features from service!');
            }


            if((1*response.resultCount) > 0){
                _currentReviewable = response;
                _parent().actions.idgraphsynch.getRelationFeature(response.mapId, response.relationId,
                    function(newReviewItem){
                        if (newReviewItem && newReviewItem.members && newReviewItem.members.length > 2) {
                          confirm('This review contains more than two members. Use the navigation arrows in the table to cycle through the review members.');
                        }
                        _parent().map.featurehighlighter.highlightLayer(newReviewItem.members[0],
                            newReviewItem.members[1], true);

                    });

            } else {
                iD.ui.Alert('There are no more available features to review. ' +
                    'Exiting the review session.',
                    'info',new Error().stack);
                _exitReviewSession(false);
            }
        }
        catch (ex) {
            iD.ui.Alert(ex,'error',new Error().stack);
            var r = confirm('Failed to retrieve the next features for review!' +
                '  Do you want to continue?');
            if(r === false){
                _exitReviewSession(true);
            }
        } finally {
            // removing this since when connection is
            // done loading tiles we will set Processing to false
           //_parent().setProcessing(false);

        }

    };

    /**
    * @desc public interface for go to next
    **/
    _instance.gotoNext = function() {
        context.flush(true);
        _instance.jumpTo('forward');
    };


    /**
    * @desc  Go forward with layer visibility validation
    **/
    _instance.traverseForward = function () {
        _instance.setCurrentReviewableEntityId(undefined);
        var vicheck = _vischeck();
        if(!vicheck){
            return;
        }
        context.ui().sidebar.hide();        
        _instance.jumpTo('forward');
    };

    /**
    * @desc  Go backward with layer visibility validation
    **/
    _instance.traverseBackward = function () {
        _instance.setCurrentReviewableEntityId(undefined);
        var vicheck = _vischeck();
        if(!vicheck){
            return;
        }
        context.ui().sidebar.hide();
        _instance.jumpTo('backward');
    };

    /**
    * @desc  controls visibility of next and previous button
    * @param doDisable - switch for enable/disable
    **/
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

    };

    /**
    * @desc  controls visibility of next and previous button
    **/
    _instance.getCurrentReviewable = function(){
        return _currentReviewable;
    };

    /**
    * @desc  sets current reviewable item
    **/
    _instance.setCurrentReviewable = function(_){
        _currentReviewable = _;
    };

    /**
    * @desc  gets the current review entity id
    **/
    _instance.getCurrentReviewableEntityId = function(){
        return _currentReviewableEntityId;
    };

    /**
    * @desc  sets the current review entity id
    **/
    _instance.setCurrentReviewableEntityId = function(_){
        _currentReviewableEntityId = _;
    };

    /**
    * @desc  initialization validation
    **/
    var _isInitialized = function()
    {
        return (_nextid && _previd && _mapid);
    };

    /**
    * @desc  Exit review session
    * @param msg - optional message for user
    **/
    var _exitReviewSession = function(removeFromSidebar) {
        _parent().deactivate(!removeFromSidebar);
        _parent().reviewNextStep();
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
    var _vischeck = function(){
        return _parent().vischeck();
    };

    var _parent = function() {
        return context.hoot().control.conflicts;
    };


    return d3.rebind(_instance, _events, 'on');
};
