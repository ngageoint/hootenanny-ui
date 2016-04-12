/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.actions.idgraphsynch provides operations to load missing reviewable relation
// members and their dependent entities. Also it updates review tags when it is resolved.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.actions.idgraphsynch = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};

    var _relTreeIdx = {};
    var _currentFid = null;


    /**
    * @desc it searches for all members of relation in entity graph and if not found
    *       then loads from backend.
    * @param mapid - target map id
    * @param relationid - the relation id to load if missing
    * @param callback - callback function to invoke when done
    **/
    _instance.getRelationFeature  = function(mapid, relationid, callback){

        _relTreeIdx = {};
        var fid = 'r' + relationid + '_' + mapid;
        var f = context.hasEntity(fid);
        _currentFid = fid;

        if(f) {
            // for merged automerge should have loaded relation and members to ui
            // at this point so it will not try to reload..

            var nMemCnt = _getLoadedRelationMembersCount(fid) ;

            if(nMemCnt > 0){
                // loaded members count not matching the entity members count
                if(nMemCnt !== f.members.length){
                    _loadMissingFeatures(mapid, fid, callback);
                } else {
                    if(nMemCnt === 1){
                        _parent().actions.poimerge.disableMergeButton(true);
                    }
                    callback(f);
                }

            }
        } else {
            _loadMissingFeatures(mapid, fid, callback);
        }
    }



    /**
    * @desc Updates hoot:review:needs tag when resolved
    * @param reviewRelationEntity - target relation
    **/
    _instance.updateReviewTagsForResolve = function(reviewRelationEntity)
    {
            var tags = reviewRelationEntity.tags;
            //console.log(tags);
            var newTags = _.clone(tags);
            newTags['hoot:review:needs'] = 'no';
            context.perform(
              iD.actions.ChangeTags(reviewRelationEntity.id, newTags),
              t('operations.change_tags.annotation'));

    }

    /**
    * @desc Checks for the numbers of relation members that already exist in entity graph
    * @param Relation id
    **/
    var _getLoadedRelationMembersCount = function(fid){
        var nCnt = 0
        try
        {
            var f = context.hasEntity(fid);
            if(f){
                for(var i=0; i<f.members.length; i++){
                    if(context.hasEntity(f.members[i].id)){
                        nCnt++;
                    }
                }
            }
        }
        catch(error)
        {
            console.log(error);
        }


        return nCnt;
    }


    /**
    * @desc Load missing handler where it recursively load missing members
    * if the member is another relation
    * @param err - error object
    * @param entities - loaded entities list
    **/
    var _loadMissingHandler = function(err, entities, currentCallback) {
        try
        {
            if(err){
                throw 'Failed to load missing features.';
            }

            // Make sure we do not go into infinite loop
            if(Object.keys(_relTreeIdx).length > 500){
                throw 'Review relation tree size is too big.  Maybe went into an infinite loop?';
            }

            if (entities.data.length) {
                var curReviewItem = _parent().actions.traversereview.getCurrentReviewable();
                var currLayerName = context.hoot().model.layers.getNameBymapId(curReviewItem.mapId);

                // first check to see if anyone is relation
                var relFound = _.find(entities.data, function(e){
                    return e.type == 'relation';
                });

                // if there is one or more relation then recurse
                if(relFound){
                    _.each(entities.data, function(f){
                        // if feature type is relation recurse to load
                        // if not do nothing since it has been loaded properly
                        if(f.type == 'relation'){
                            _relTreeIdx[f.id] = f.members.length;
                            _.each(f.members, function(m){
                                if(!context.hasEntity(m.id) || m.type === 'relation') {
                                    context.loadMissing([m.id], function(err, ent){
                                        _loadMissingHandler(err,ent,currentCallback);
                                    }, currLayerName);
                                } else {
                                    _updateParentRelations(m.id);
                                }

                            });

                        }
                    });

                } else { // if there no relations then reduce child count

                    _.each(entities.data, function(f){
                        _updateParentRelations(f.id);
                    });//_.each(entities.data, function(f){
                }



            } else {
                throw 'Failed to load missing features.';
            }
        }
        catch (err)
        {
            iD.ui.Alert(err,'error',new Error().stack);
        }
        finally
        {

            if(Object.keys(_relTreeIdx).length == 0){
                // Done so do final clean ups
                _validateMemberCnt(_currentFid, currentCallback);
            }
        }
    }

    /**
    * @desc we do not care about way or node parent
    * since all reviews are in relations
    * @param fid target relation id
    **/
    var _updateParentRelations = function(fid) {
       var f = context.hasEntity(fid);
        var parents = context.graph().parentRelations(f);
        if(parents){
            // go through each parents and if it is in
            // relation index then update member counts
            // or remove if the unprocessed member count goes to 0
            _.each(parents, function(p){
                if(_relTreeIdx[p.id]){
                    var nParentChildsCnt = 1*_relTreeIdx[p.id];
                    if(nParentChildsCnt > 1){
                        _relTreeIdx[p.id] = (nParentChildsCnt-1);
                    } else {
                        // now zero or less so remove from queue
                        delete _relTreeIdx[p.id];
                        var pps = context.graph().parentRelations(p);

                        // We traverse the parent tree and update
                        // index for relation in relation
                        var cleanOutParentTree = function(pps) {
                            _.each(pps, function(pp){
                                var ppIdxCnt = _relTreeIdx[pp.id];
                                if(ppIdxCnt !== undefined){
                                    if(ppIdxCnt > 1){
                                        _relTreeIdx[pp.id] = ppIdxCnt - 1;
                                    } else {
                                        delete _relTreeIdx[pp.id];
                                    }
                                    var curPps = context.graph().parentRelations(pp);
                                    if(curPps){
                                        cleanOutParentTree(curPps);
                                    }
                                }
                            });
                        }
                        cleanOutParentTree(pps);

                    }

                }

            });
        }

    }

    /**
    * @desc final handler afte loading relation memebrs validates and pan to loaded
    * @param fid - target relation id
    * @param fnc - callback
    **/
    var _validateMemberCnt = function(fid, fnc) {
        var nMemCnt = _getLoadedRelationMembersCount(fid) ;
        var f = context.hasEntity(fid);
        if(nMemCnt > 0){
            if(nMemCnt === 1){
                _parent().actions.poimerge.disableMergeButton(true);
            }
            fnc(f);
        } else {
            iD.ui.Alert('There are no members in the review relation.','warning',new Error().stack);
        }
    }

    /**
    * @desc load any missing features from backend
    * @param mapid - target map id
    * @param fid - the feature id
    **/
    var _loadMissingFeatures = function(mapid, fid, callback) {
        var layerNames = d3.entries(hoot.loadedLayers()).filter(function(d) {
            return 1*d.value.mapId === 1*mapid;
        });

        if(!_.isEmpty(layerNames)){
            var layerName = layerNames[0].key;
            context.loadMissing([fid], function(err, ent){
                _loadMissingHandler(err,ent,callback);
            }, layerName);
        }
    }

    var _parent = function() {
        return context.hoot().control.conflicts;
    }
    return d3.rebind(_instance, _events, 'on');
}