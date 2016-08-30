/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.model.conflicts provides functions to handle conflict resolution by connection to service REST endpoint.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.conflicts = function(context)
{
    var model_conflicts = {};

    var review_mergedElements = null;
    model_conflicts.getReviewMergedElements = function() {
        return review_mergedElements;
    };

    model_conflicts.setReviewMergedElements = function(val) {
        review_mergedElements = val;
    };

    model_conflicts.beginReview = function (layer, callback) {
        callback(layer);
    };

    var reloadLayer = function (lyrInfo) {

        context.hoot().model.layers.removeLayer(lyrInfo.name);
        var self = d3.select('.hootView');
        var origHtml = self.html();

        self.html('');

        self.append('div')
        .classed('contain keyline-all round controller', true)
        .html('<div class="pad1 inline _loading"><span></span></div>' +
            '<span class="strong pad1x">Refreshing &#8230;</span>' +
            '<button class="keyline-left action round-right inline _icon trash"></button>')
        .select('button')
        .on('click', function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (window.confirm('Are you sure you want to delete?')) {
                //resetForm(self);
                return;
            }

        });
        var key = {
            'name': lyrInfo.name,
            'id':lyrInfo.mapId,
            color: lyrInfo.color
        };

        context.hoot().model.layers.addLayer(key, function(){
            self.html(origHtml);

            d3.select('button.action.trash').on('click',function(){
                context.hoot().control.conflicts.actions.deactivate();
                context.hoot().mode('browse');

                d3.select('[data-layer=' + self.select('span').text() + ']').remove();
                _.each(context.hoot().loadedLayers, function(d) {
                    context.hoot().model.layers.removeLayer(d.name);
                    var modifiedId = d.mapId.toString();
                    d3.select('[data-layer="' + modifiedId + '"]').remove();
                    delete context.hoot().loadedLayers[d.name];
                });

                var mapID =  context.hoot().model.layers.getmapIdByName(self.select('span').text());
                d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
                d3.select('[data-layer="' + mapID + '"]').remove();

                context.hoot().reset();
            });
        });

    };

    model_conflicts.acceptAll = function (data, callback)
    {
            var hasChanges = context.history().hasChanges();
            if (hasChanges) {
                iD.modes.Save(context).save(context, function ()
                {
                    reloadLayer(data);
                });
            }
            else {
              reloadLayer(data);
                callback();
            }
    };

    /*
     * Removes any items reviewRefs whose element id matches the element id passed in idsToRemove
     */
    var removeReviewRefs = function(reviewRefs, idsToRemove, relationId)
    {
     /* var modifiedReviewRefs = new Array();
      for (var i = 0; i < reviewRefs.length; i++)
      {
        var reviewRef = reviewRefs[i];
        if (idsToRemove.indexOf(''+reviewRef.id) === -1)
        {
          modifiedReviewRefs.push(reviewRef);
        }

      }*/
      var modifiedReviewRefs = new Array();
       _.each(reviewRefs, function(r){
            if((idsToRemove.indexOf(''+r.id) === -1) || (r.reviewRelationId !== relationId)){
                modifiedReviewRefs.push(r);
            }
        });
       return modifiedReviewRefs;
    };


    // This function loads missing and the dependencies
    // Used when we zoom out during review and to operate on the dependencies during delete
    model_conflicts.loadMissingFeatureDependencies = function (mapid, layerName, featureIds, callback) {
        try
        {
            var queryElements = new Array();

            _.each(featureIds, function(id){
                var f = context.hasEntity(id);
                if(f && f.type !== 'relation'){
                    var queryElement = {};
                    queryElement.mapId = mapid;
                    queryElement.id = f.origid.substring(1);
                    queryElement.type = f.type;
                    queryElements.push(queryElement);
                }
            });

            if(queryElements.length === 0){
                return;
            }
            Hoot.model.REST('getReviewRefs', queryElements,
                function (error, response)
                {
                    try
                    {
                        if (error)
                        {
                          iD.ui.Alert('failed to retrieve review refs.','warning',new Error().stack);
                          throw new Error(error);
                        }

                        context.hoot().assert(
                          response.reviewRefsResponses.length === queryElements.length);

                        var loadedTypes = {};

                        var missingIds = {};
                        _.each(response.reviewRefsResponses, function(r){

                            _.each(r.reviewRefs, function(reviewRef){
                                if(reviewRef){
                                    var fullId = null;
                                    if(reviewRef.type === 'node'){
                                        fullId = 'n' + reviewRef.id + '_'+ mapid;
                                        if(!context.hasEntity(fullId)){
                                            missingIds[fullId] = 'node';
                                            loadedTypes.node = true;
                                        }
                                    } else if(reviewRef.type === 'way'){
                                        fullId = 'w' + reviewRef.id + '_'+ mapid;
                                        if(!context.hasEntity(fullId)){
                                            missingIds[fullId] = 'way';
                                            loadedTypes.way = true;
                                        }
                                    } else if(reviewRef.type === 'relation'){
                                        fullId = 'r' + reviewRef.id + '_'+ mapid;
                                        if(!context.hasEntity(fullId)){
                                            missingIds[fullId] = 'relation';
                                            loadedTypes.relation = true;
                                        }
                                    }

                                    var fullRelId = 'r' + reviewRef.reviewRelationId + '_' + mapid;
                                    if(!context.hasEntity(fullRelId)){
                                        missingIds[fullRelId] = 'relation';
                                        loadedTypes.relation = true;
                                    }
                                }
                            });
                        });

                        _.each(Object.keys(missingIds),function(q){
                            if(_.find(context.history().changes().deleted,{id: q})){
                                delete missingIds[q];
                            }
                        });

                        if(Object.keys(missingIds).length === 0){
                            if(callback){
                                callback();
                            }
                            return;
                        }

                        context.loadMissing(Object.keys(missingIds),
                            function(err, entities)
                            {
                                if(err){
                                    if(callback) {
                                        callback();
                                    }
                                    return;
                                }
                                _.each(entities.data, function(d){
                                    delete missingIds[d.id];
                                    if(d.id.charAt(0) === 'n'){
                                        if(loadedTypes.node){
                                            delete loadedTypes.node;
                                        }
                                    }

                                    if(d.id.charAt(0) === 'w'){
                                        if(loadedTypes.way){
                                            delete loadedTypes.way;
                                        }
                                    }

                                    if(d.id.charAt(0) === 'r'){
                                        if(loadedTypes.relation){
                                            delete loadedTypes.relation;
                                        }
                                    }
                                });

                                if(Object.keys(missingIds).length === 0 || Object.keys(loadedTypes).length === 0 ){
                                    if(callback) {
                                        callback();
                                    }
                                }

                            }, // loadMissing callback
                          layerName);
                    }
                    catch (getReviewRefsErr)
                    {
                        iD.ui.Alert(getReviewRefsErr,'error',new Error().stack);
                        if(callback){
                            callback(getReviewRefsErr);
                        }
                    }
                    finally
                    {//
                    }
                } );// getreviewRef
        }
        catch(mergeErr)
        {
            iD.ui.Alert(mergeErr,'error',new Error().stack);
            if(callback){
                callback(mergeErr);
            }
        }
        finally
        {//
        }
    };

    var createNewRelationNodeMeta = function(mergedNodeId, relationId, mergeIndx) {
        var m = new iD.Node();
        m.id = mergedNodeId;
        m.type = 'node';
        m.role = 'reviewee';
        m.index = mergeIndx;

        var o = {};
        o.id =  relationId;
        o.obj = m;
        return o;
    };

/*    var containsRelationMemberMeta = function(memberMeta, arr)
    {
      for (var i = 0; i < arr.length; i++)
      {
        var arrMember = arr[i];
        if (arrMember.obj.id === memberMeta.obj.id)
        {
          return true;
        }
      }
      return false;
    };
*/
    // This function is to store the reference relation items so we can process
    // when we resolve and save.  We also deletes the merged features.  So what is happening is
    // we store all reference relations for deleted nodes and delete.
    var processMerge = function(reviewRefs, mapid, queryElement1, queryElement2,
        featureToDelete, mergedNode, reviewMergeRelationId)
    {
        try
        {
            if (reviewRefs){
                review_mergedElements = [];

                // Some times we have relation identical to to merged
                // Except in sequence order. This is core bug but until
                // it gets fixed we will mark it reviewed..
                _.each(reviewRefs, function(rfid){
                    var rf = context.hasEntity('r' + rfid.reviewRelationId + '_' + mapid);
                    var mergedRel = context.hasEntity('r' +reviewMergeRelationId+ '_' + mapid);
                    if(rf.members.length === mergedRel.members.length){
                        var foundCnt = 0;
                        _.each(rf.members, function(rm){
                            var found = _.find(mergedRel.members, function(mem){
                                return mem.id === rm.id;
                            });
                            if(found){
                                foundCnt++;
                            }
                        });
                        // same as target relation
                        if(foundCnt === rf.members.length){

                            rf.tags['hoot:review:needs'] = 'no';
                            context.perform(
                              iD.actions.ChangeTags(rf.id, rf.tags),
                              t('operations.change_tags.annotation'));
                        }
                    }
                });


                for (var i = 0; i < reviewRefs.length; i++)
                {
                    var fullRelId = 'r' + reviewRefs[i].reviewRelationId.toString() + '_' + mapid;

                    var reviewRelation = context.hasEntity(fullRelId);

                    if(reviewRelation){
                        // find if the relation contains the deleted then
                        // add meta with index of deleted so it will be
                        // switched with merged
                        // We do this since references may contain merged as member

                        var refRelationMember = reviewRelation.memberById(featureToDelete.id);
                        if(refRelationMember) {

                            var exists = _.find(review_mergedElements, {id:reviewRelation.id});
                            if(exists && exists.obj){
                                exists = exists.obj.id === mergedNode.id;
                            }

                            if(!exists) {
                                if(!reviewRelation.memberById(mergedNode.id)) {
                                    var newObj =
                                      createNewRelationNodeMeta(
                                        mergedNode.id, reviewRelation.id, refRelationMember.index);
                                    review_mergedElements.push(newObj);
                                }

                            }

                        } else {
//
                        }


                    }
                }

                var fe = context.hasEntity(featureToDelete.id);
                if(fe){
                    fe.hootMeta = {'isReviewDel':true};
                }


                //delete the review feature not being updated with the merged
                iD.operations.Delete([featureToDelete.id], context)();


                // Synchronize the deleted feature and relation ids
                // May not be needed but better to be containing
                // correct list
                // context.hoot().control.conflicts.reviewIds is used to
                // render review table and load missing when zoomed out
                var currReviewIds = context.hoot().control.conflicts.reviewIds;

                var newReviewIds = [];
                _.each(currReviewIds, function(r){
                    if(r !== featureToDelete.id ){
                        newReviewIds.push(r);
                    }
                });
                var curMergedRelId = 'r' + reviewMergeRelationId + '_' + mapid;
                if(currReviewIds &&
                    currReviewIds.indexOf(curMergedRelId) === -1){
                    newReviewIds.push(curMergedRelId);
                }

                context.hoot().control.conflicts.reviewIds = newReviewIds;

                // This validation may be wrong if user performs delete/create/modify
                // outside of review process..
                // For exmaple user deletes a node and presses merge..
                // Disablling
                //validateMergeChangeset();

                window.setTimeout(function() {
                    //context.hoot().control.conflicts.setProcessing(false);
                    context.enter(iD.modes.Select(context, [mergedNode.id]));
                  }, 500);
            }//reviewRefs
        }
        catch (err)
        {
            iD.ui.Alert(err,'warning',new Error().stack);
        }
        finally
        {
            //context.hoot().control.conflicts.setProcessing(false);
        }
    };// processMerge

    /*
     * The code in this method is making the assumption that only nodes are merged here, which
     * is currently the case.  If this changes, then the code will need to be updated.
     */
    model_conflicts.autoMergeFeature = function (feature, featureAgainst,
        mapid, reviewMergeRelationId, callback)
    {
        try
        {
            //context.hoot().control.conflicts.setProcessing(true);
            var layerName = feature.layerName;

            if (!feature && !featureAgainst) {
                throw new Error('Merge error, one feature is missing');
            } else {
                                //Check that both features are still in the map graph,
                //and load them if not
                if (!context.hasEntity(feature.id) || !context.hasEntity(featureAgainst.id)) {
                    context.loadMissing([feature.id, featureAgainst.id], function() {
                        doMerge(layerName, feature, featureAgainst, mapid, reviewMergeRelationId, callback);
                        }, layerName);
                } else {
                    doMerge(layerName, feature, featureAgainst, mapid, reviewMergeRelationId, callback);
                }
            }
        }
        catch(err)
        {
            context.hoot().control.conflicts.setProcessing(false);
            iD.ui.Alert(err,'error',new Error().stack);
        }
        finally
        {
            if(callback){
                callback();
            }
        }
    };


    var doMerge = function(layerName, feature, featureAgainst, mapid, reviewMergeRelationId, callback) {
        try
        {
            var features = [JXON.stringify(feature.asJXON()), JXON.stringify(featureAgainst.asJXON())];
            var reverse = d3.event.ctrlKey;
            if (reverse) features = features.reverse();
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'hootenanny\'>' +
                features.join('') + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

            //get references to unresolved review data involving the features deleted as a
            //result of the merge
            var featureToDelete;
            var queryElements = new Array();

            var queryElement1 = {};
            queryElement1.mapId = mapid;
            queryElement1.id = feature.origid.substring(1);
            queryElement1.type = feature.type;
            queryElements.push(queryElement1);

            var queryElement2 = {};
            queryElement2.mapId = mapid;
            queryElement2.id = featureAgainst.origid.substring(1);
            queryElement2.type = featureAgainst.type;
            queryElements.push(queryElement2);

            Hoot.model.REST('getReviewRefs', queryElements,
                function (error, response)
                {
                    try
                    {
                        if (error)
                        {
                          iD.ui.Alert('failed to retrieve review refs.','warning',new Error().stack);
                          throw new Error(error);
                        }

                        context.hoot().assert(
                          response.reviewRefsResponses.length === queryElements.length);

                        //newly merged entity
                        var mergedNode = entities[0];
                        var featureToUpdate = feature;
                        featureToDelete = featureAgainst;
                        //change the node to update if merge direction is reversed
                        if (reverse)
                        {
                          featureToUpdate = featureAgainst;
                          featureToDelete = feature;
                        }
                        mergedNode.tags['hoot:status'] = 3;
                        context.perform(
                          iD.actions.ChangeTags(featureToUpdate.id, mergedNode.tags),
                          t('operations.change_tags.annotation'));



                        var reviewRefs =
                          _.uniq(
                            response.reviewRefsResponses[0].reviewRefs.concat(
                              response.reviewRefsResponses[1].reviewRefs));




                        //if either of the two merged features reference each other, remove those
                        //references from this list
                        reviewRefs =
                          removeReviewRefs(reviewRefs, [queryElement1.id, queryElement2.id], reviewMergeRelationId);

                        var reviewRelationIdsMissing = new Array();
                        for (var i = 0; i < reviewRefs.length; i++)
                        {
                            //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
                            var fullRelId = 'r' + reviewRefs[i].reviewRelationId.toString() + '_' + mapid;
                            if(!context.hasEntity(fullRelId)){
                                reviewRelationIdsMissing.push(fullRelId);
                            }
                        }

                        var isMergeProcessed = false;
                        //retrieve all the associated review relations
                        if(reviewRelationIdsMissing.length > 0){
                            context.loadMissing(reviewRelationIdsMissing,
                                function(err, entities)
                                {
                                    try
                                    {
                                        if(err){
                                            throw new Error(err);
                                        }




                                        _.each(entities.data, function(ent)
                                        {
                                            var idx = reviewRelationIdsMissing.indexOf(ent.id);
                                            if(idx){
                                                reviewRelationIdsMissing.splice(idx, 1);
                                            }
                                        });

                                        var nUnloaded = 0;
                                        _.each(reviewRelationIdsMissing, function(missing){
                                            var exist = context.hasEntity(missing);
                                            if(!exist){
                                                nUnloaded++;
                                            }
                                        });
                                        // this for preventing stack overflow when there are large numbers of one to many
                                        // When there is more than 150 missing, then we go into chunck where we load
                                        // chunk of 150. see connection.loadMultiple
                                        // Each chunk load calls callback and we need to have way to find if all has been
                                        // loaded..
                                        if (nUnloaded === 0 && isMergeProcessed === false)
                                        {
                                            isMergeProcessed = true;
                                            processMerge(reviewRefs, mapid, queryElement1,
                                                queryElement2, featureToDelete, featureToUpdate, reviewMergeRelationId);
                                        }
                                    }
                                    catch(loadMissingErr)
                                    {
                                        context.hoot().control.conflicts.setProcessing(false);
                                        iD.ui.Alert(loadMissingErr,'error',new Error().stack);
                                    }
                                    finally
                                    {
                                        if(callback) {
                                            callback();
                                        }
                                    }
                                }, // loadMissing callback
                              layerName);
                        } else {
                            // We have all feature loaded so don't do loadMissing
                            isMergeProcessed = true;
                            processMerge(reviewRefs, mapid, queryElement1, queryElement2,
                                featureToDelete, featureToUpdate, reviewMergeRelationId);
                        }
                    }
                    catch (getReviewRefsErr)
                    {
                        context.hoot().control.conflicts.setProcessing(false);
                        iD.ui.Alert(getReviewRefsErr,'error',new Error().stack);
                    }
                    finally
                    {
                        if(callback) {
                            callback();
                        }
                    }
                } );// getreviewRef
           }, mapid, layerName);
        }
        catch(mergeErr)
        {
            context.hoot().control.conflicts.setProcessing(false);
            iD.ui.Alert(mergeErr,'error',new Error().stack);
        }
        finally
        {
            if(callback){
                callback();
            }
        }
    };



    // This validation may be wrong if user performs delete/create/modify outside of review process..
    // For exmaple user deletes a node and presses merge..Disablling
    /*
    //only call this at the very end of a node merge operation
    var validateMergeChangeset = function()
    {
      var hasChanges = context.history().hasChanges();
      context.hoot().assert(hasChanges);
      var changes =
        context.history().changes(
          iD.actions.DiscardTags(context.history().difference()));
      //console.log(changes);
      //console.log(JXON.stringify(context.connection().osmChangeJXON(1, changes)));
      context.hoot().assert(changes.created.length === 1);
      //The modified length will vary depending on the number of review references returned by
      //the features deleted as a result of the merge, but will always at least contain the resolved
      //review of the two features deleted as a result of the merge.
      context.hoot().assert(changes.modified.length >= 1);
      context.hoot().assert(changes.deleted.length === 2);
    }*/

/*    var logDiff = function()
    {
      var hasChanges = context.history().hasChanges();
      if (hasChanges)
      {
        var message = context.history().changes(iD.actions.DiscardTags(context.history().difference()));
        context.hoot().view.utilities.errorlog.reportUIError(message,new Error().stack);
      }
    };*/

    model_conflicts.getSourceLayerId = function(feature) {
        var mergeLayer = context.hoot().loadedLayers()[feature.layerName];
        var sourceLayers = mergeLayer.layers;
        var featureLayerName = sourceLayers[parseInt(feature.tags['hoot:status']) - 1];
        var sourceLayer = context.hoot().loadedLayers()[featureLayerName];
        if(!sourceLayer){
            // try using tags of mergeLayer, which is loaded
            if(context.hoot().model.layers.getLayers()[mergeLayer.name]){
                var tags = _.clone(context.hoot().model.layers.getLayers()[mergeLayer.name].tags);
                for(var prop in tags) {
                    if(tags.hasOwnProperty(prop)) {
                        if(tags[prop] === featureLayerName && featureLayerName != null) {
                            sourceLayer = _.find(context.hoot().model.layers.getAvailLayers(),{'name':featureLayerName});
                            return sourceLayer.id;
                        }
                    }
                }
            }
        }

        // If sourceLayer is still undefined, see if it is a layer that is no longer loaded
        if(!sourceLayer){
            return mergeLayer.unloaded[parseInt(feature.tags['hoot:status']) - 1];
        }

        return (sourceLayer) ? sourceLayer.mapId : null;
    };

    model_conflicts.getFeatureLayer = function(feature) {
        return context.hoot().loadedLayers()[feature.layerName];
    };

    model_conflicts.mergeDisplayBounds = function(a, b) {
        var c = a.split(','),
            d = b.split(',');
        return [Math.min(c[0], d[0]), Math.min(c[1], d[1]), Math.max(c[2], d[2]), Math.max(c[3], d[3])].join(',');
    };

    //Expand the first bounding box to include the second
    //bounding box, then buffer it a bit more
    model_conflicts.expandDisplayBounds = function(a, b) {
        var c = a.split(','),
            d = b.split(',');
        var dx = Math.max(Math.abs(c[0] - d[2]), Math.abs(c[2] - d[0])) * 1.25,
            dy = Math.max(Math.abs(c[1] - d[3]), Math.abs(c[3] - d[1])) * 1.75;
        var buffer = Math.max(dx, dy);

        return [(1*c[0] - buffer), (1*c[1] - buffer), (1*c[2] + buffer), (1*c[3] + buffer)].join(',');
    };

  return model_conflicts;
};
