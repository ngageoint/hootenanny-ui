Hoot.model.conflicts = function(context)
{
    var model_conflicts = {};

    var review_mergedElements = null;
    model_conflicts.getReviewMergedElements = function() {
        return review_mergedElements;
    }

    model_conflicts.setReviewMergedElements = function(val) {
        review_mergedElements = val;
    }

    model_conflicts.beginReview = function (layer, callback) {
        var mapid = layer.mapId;
        callback(layer);
    };

    var reloadLayer = function (lyrInfo) {

        context.hoot().model.layers.removeLayer(lyrInfo.name);
        var self = d3.select('.hootView');
        var origHtml = self.html();

        self.html("");

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
                resetForm(self);
                return;
            }

        });
        var key = {
            'name': lyrInfo.name,
            'id':lyrInfo.mapId,
            color: lyrInfo.color
        };

        context.hoot().model.layers.addLayer(key, function(res){
            self.html(origHtml);
            
            d3.select('button.action.trash').on('click',function(){
                conflicts.deactivate();
            	context.hoot().mode('browse');
            	
            	d3.select('[data-layer=' + self.select('span').text() + ']').remove();
                _.each(hoot.loadedLayers, function(d) {
                    hoot.model.layers.removeLayer(d.name);
                    var modifiedId = d.mapId.toString();
                    d3.select('[data-layer="' + modifiedId + '"]').remove();
                    delete loadedLayers[d.name];
                });
            	
                var mapID =  hoot.model.layers.getmapIdByName(self.select('span').text());
                d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
                d3.select('[data-layer="' + mapID + '"]').remove();
                
                hoot.reset();
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
    var removeReviewRefs = function(reviewRefs, idsToRemove)
    {
      //console.log("reviewRefs: " + reviewRefs);
      //console.log("idsToRemove: " + idsToRemove);

      var modifiedReviewRefs = new Array();
      for (var i = 0; i < reviewRefs.length; i++)
      {
        var reviewRef = reviewRefs[i];
        //console.log("reviewRef.id: " + reviewRef.id);
        //console.log("idsToRemove.indexOf(reviewRef.id): " + idsToRemove.indexOf(""+reviewRef.id));
        if (idsToRemove.indexOf(""+reviewRef.id) == -1)
        {
          //console.log("adding reviewRef.id: " + reviewRef.id);
          modifiedReviewRefs.push(reviewRef);
        }
      }
      //console.log("modifiedReviewRefs: " + modifiedReviewRefs);
      return modifiedReviewRefs;
    }


    // This function loads missing and the dependencies
    // Used when we zoom out during review and to operate on the dependencies during delete
    model_conflicts.loadMissingFeatureDependencies = function (mapid, layerName, featureIds, callback) {
        try
        {
            var queryElements = new Array();
        
            _.each(featureIds, function(id){
                var f = context.hasEntity(id);
                if(f && f.type != 'relation'){
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
                          console.log(error);
                          iD.ui.Alert('failed to retrieve review refs.','warning');
                          context.hoot().control.conflicts.setProcessing(false);
                          throw error;
                        }
                        //console.log(response);

                        context.hoot().assert(
                          response.reviewRefsResponses.length == queryElements.length);
                        
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
                                            loadedTypes['node'] = true;
                                        }
                                    } else if(reviewRef.type === 'way'){
                                        fullId = 'w' + reviewRef.id + '_'+ mapid;
                                        if(!context.hasEntity(fullId)){
                                            missingIds[fullId] = 'way';
                                            loadedTypes['way'] = true;
                                        }
                                    } else if(reviewRef.type === 'relation'){
                                        fullId = 'r' + reviewRef.id + '_'+ mapid;
                                        if(!context.hasEntity(fullId)){
                                            missingIds[fullId] = 'relation';
                                            loadedTypes['relation'] = true;
                                        }
                                    }
                                    
                                    var fullRelId = "r" + reviewRef.reviewRelationId + "_" + mapid;
                                    if(!context.hasEntity(fullRelId)){
                                        missingIds[fullRelId] = 'relation';
                                        loadedTypes['relation'] = true;
                                    }
                                }
                            });
                        });
                       
                        if(Object.keys(missingIds).length == 0){
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
                                    if(d.id.charAt(0) == 'n'){
                                        if(loadedTypes['node']){
                                            delete loadedTypes['node'];
                                        }
                                    }

                                    if(d.id.charAt(0) == 'w'){
                                        if(loadedTypes['way']){
                                            delete loadedTypes['way'];
                                        }
                                    }

                                    if(d.id.charAt(0) == 'r'){
                                        if(loadedTypes['relation']){
                                            delete loadedTypes['relation'];
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
                        iD.ui.Alert(getReviewRefsErr,'error');
                        console.error(getReviewRefsErr);
                        if(callback){
                            callback(getReviewRefsErr);
                        }
                    }
                    finally
                    {
                    }
                } );// getreviewRef
        }
        catch(mergeErr)
        {
            iD.ui.Alert(mergeErr,'error');
            console.error(mergeErr);
            if(callback){
                callback(mergeErr);
            }
        }
        finally
        {
        }
    };


    var createNewRelationNodeMeta = function(mergedNodeId, relationId, mergeIndx,currentMapId) {
        var m = new iD.Node();
        m.id = mergedNodeId;
        m.type = "node";
        m.role = "reviewee";
        m.index = mergeIndx;

        var o = {};
        o['id'] = "r" + relationId + "_" + currentMapId;
        o['obj'] = m;
        return o;
    }


    // This function is to store the reference relation items so we can process 
    // when we resolve and save.  We also deletes the merged features.  So what is happening is 
    // we store all reference relations for deleted nodes and delete.
    var processMerge = function(reviewRefs, mapid, queryElement1, queryElement2, 
        feature, featureAgainst, mergedNode, reviewMergeRelationId)
    {
        try
        {
            if(reviewRefs){
                review_mergedElements = [];
                
                var newNodeMeta = createNewRelationNodeMeta(mergedNode.id, reviewMergeRelationId, 0, mapid);
                review_mergedElements.push(newNodeMeta);

                for (var i = 0; i < reviewRefs.length; i++)
                {
                    var fullRelId = "r" + reviewRefs[i].reviewRelationId.toString() + "_" + mapid;
       
                    var reviewRelation = context.hasEntity(fullRelId);

                    if(reviewRelation){
                        var queryElement1Member = null;
                        if(queryElement1){
                            var queryElement1iDid = 
                              "n" + queryElement1.id + "_" + mapid;
                            queryElement1Member = reviewRelation.memberById(queryElement1iDid);
                           
                        }
                        
                        var queryElement2Member = null;

                        if(queryElement2){
                            var queryElement2iDid = 
                              "n" + queryElement2.id + "_" + mapid;
                            queryElement2Member = reviewRelation.memberById(queryElement2iDid);  
                        }

                        var newMemIdx = 0;
                        if (queryElement1Member != null)
                        {
                          newMemIdx = queryElement1Member.index;
                        }
                        else if (queryElement2Member != null)
                        {
                          newMemIdx = queryElement2Member.index;
                        }

                        var newObj = createNewRelationNodeMeta(mergedNode.id, 
                            reviewRefs[i].reviewRelationId, newMemIdx, mapid);
                        review_mergedElements.push(newObj);                     
                    }
                }
                
                var fe = context.hasEntity(feature.id);
                if(fe){
                    fe.hootMeta = {'isReviewDel':true};
                }

                fe = context.hasEntity(featureAgainst.id);
                if(fe){
                    fe.hootMeta = {'isReviewDel':true};
                }

                //Remove the two input entities
                iD.operations.Delete([feature.id, featureAgainst.id], context)();

                var newReviewIds = [];
                _.each(context.hoot().control.conflicts.reviewIds, function(r){
                    if(r !== feature.id && r !== featureAgainst.id){
                        newReviewIds.push(r);
                    }
                });
                newReviewIds.push('r' + reviewMergeRelationId + '_' + mapid);
                context.hoot().control.conflicts.reviewIds = newReviewIds;

                // This validation may be wrong if user performs delete/create/modify
                // outside of review process..
                // For exmaple user deletes a node and presses merge..
                // Disablling
                //validateMergeChangeset();                 

            }//reviewRefs
        }
        catch (err)
        {
            console.error(err);
        }
        finally
        {
            context.hoot().control.conflicts.setProcessing(false);
        }
    }// processMerge

    /*
     * The code in this method is making the assumption that only nodes are merged here, which
     * is currently the case.  If this changes, then the code will need to be updated.
     */
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, 
        mapid, reviewMergeRelationId, callback) 
    {
        try
        {
            context.hoot().control.conflicts.setProcessing(true);
            var layerName = feature.layerName;

            if (!feature && !featureAgainst) {
                iD.ui.Alert('Merge error, one feature is missing','error');
            } else {
                //Check that both features are still in the map graph,
                //and load them if not
                if (!context.hasEntity(feature.id) || !context.hasEntity(featureAgainst.id)) {
                    context.loadMissing([feature.id, featureAgainst.id], function(err, entities) {
                        doMerge();
                        }, layerName);
                } else {
                    doMerge();
                }

                function doMerge() 
                {
                    try
                    {
                        var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                            JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

                        context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

                        //console.log(feature);
                        //console.log(featureAgainst);

                        //newly merged entity
                        var mergedNode = entities[0];
                        //review_mergedNode = mergedNode;

                        //OSM services expect new elements to have version = 0.  I thought iD would handle
                        //this during changeset creation, but it doesn't look like it does.
                        mergedNode.version = 0;
                        //Is this right?  Technically, this new feature was auto-merged from source
                        //1 and 2 features, so should get a conflated status...right?
                        mergedNode.tags['hoot:status'] = 3;
                        context.perform(
                          iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
                        //console.log(mergedNode);

                        //get references to unresolved review data involving the features deleted as a
                        //result of the merge
                        
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
                                      console.log(error);
                                      iD.ui.Alert('failed to retrieve review refs.','warning');
                                      context.hoot().control.conflicts.setProcessing(false);
                                      throw error;
                                    }
                                    //console.log(response);

                                    context.hoot().assert(
                                      response.reviewRefsResponses.length == queryElements.length);
                                    
                                    //console.log(response.reviewRefsResponses[0].reviewRefs);
                                    //console.log(response.reviewRefsResponses[1].reviewRefs);
                                    var reviewRefs = 
                                      _.uniq(
                                        response.reviewRefsResponses[0].reviewRefs.concat(
                                          response.reviewRefsResponses[1].reviewRefs));
                                    //console.log("reviewRefs: " + reviewRefs);
                                    //if either of the two merged features reference each other, remove those
                                    //references from this list
                                    reviewRefs = 
                                      removeReviewRefs(reviewRefs, [queryElement1.id, queryElement2.id]);
                                    //console.log("reviewRefs: " + reviewRefs);
                                    
                                    var reviewRelationIdsMissing = new Array();
                                    for (var i = 0; i < reviewRefs.length; i++)
                                    {
                                        //console.log("reviewRefs.reviewRelationId: " + reviewRefs[i].reviewRelationId);
                                        //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
                                        var fullRelId = "r" + reviewRefs[i].reviewRelationId.toString() + "_" + mapid;
                                        if(!context.hasEntity(fullRelId)){
                                            reviewRelationIdsMissing.push(fullRelId);
                                        }
                                    }

                                    //reviewRelationIds2.push("r" + reviewMergeRelationId + "_" + mapid);
                                    //console.log(reviewRelationIds);
                                   
                                    var isMergeProcessed = false;
                                    //retrieve all the associated review relations
                                    if(reviewRelationIdsMissing.length > 0){
                                        context.loadMissing(reviewRelationIdsMissing,
                                            function(err, entities)
                                            {
                                                try
                                                {
                                                    if(err){
                                                        throw err;
                                                    }
                                                    //console.log("entities.data[0]: " + entities.data[0]);
                                                    //console.log("entities.data: " + entities.data);
                                                    //console.log("entities.data.length: " + entities.data.length);
                                                    //console.log("test3");  
                                                   
                                                    _.each(entities.data, function(ent)
                                                    {
                                                        var idx = reviewRelationIdsMissing.indexOf(ent.id);
                                                        if(idx){
                                                            reviewRelationIdsMissing.splice(idx, 1);
                                                        }
                                                    })

                                                    var nUnloaded = 0;
                                                    _.each(reviewRelationIdsMissing, function(missing){
                                                        var exist = context.hasEntity(missing);
                                                        if(!exist){
                                                            nUnloaded++;
                                                        }                                                        
                                                    })
                                                    // this for preventing stack overflow when there are large numbers of one to many
                                                    // When there is more than 150 missing, then we go into chunck where we load
                                                    // chunk of 150. see connection.loadMultiple
                                                    // Each chunk load calls callback and we need to have way to find if all has been
                                                    // loaded..
                                                    if (nUnloaded == 0 && isMergeProcessed == false) 
                                                    {
                                                        isMergeProcessed = true;
                                                        processMerge(reviewRefs, mapid, queryElement1, 
                                                            queryElement2, feature, featureAgainst, mergedNode, reviewMergeRelationId);
                                                    }

                                                }
                                                catch(loadMissingErr)
                                                {
                                                    iD.ui.Alert(loadMissingErr,'error');
                                                    console.error(loadMissingErr);
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
                                            feature, featureAgainst, mergedNode, reviewMergeRelationId);
                                    }
                                }
                                catch (getReviewRefsErr)
                                {
                                    iD.ui.Alert(getReviewRefsErr,'error');
                                    console.error(getReviewRefsErr);
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
                        iD.ui.Alert(mergeErr,'error');
                        console.error(mergeErr);
                    }
                    finally
                    {
                        if(callback){
                            callback();
                        }
                    }
                }
            }        
        }
        catch(err)
        {
            iD.ui.Alert(err,'error');
            console.error(err);
        }
        finally
        {
            if(callback){
                callback();
            }
        }
    };

    // This validation may be wrong if user performs delete/create/modify
    // outside of review process..
    // For exmaple user deletes a node and presses merge..
    // Disablling
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
      context.hoot().assert(changes.created.length == 1);
      //The modified length will vary depending on the number of review references returned by
      //the features deleted as a result of the merge, but will always at least contain the resolved
      //review of the two features deleted as a result of the merge.
      context.hoot().assert(changes.modified.length >= 1);
      context.hoot().assert(changes.deleted.length == 2);
    }*/

    var logDiff = function()
    {
      var hasChanges = context.history().hasChanges();
      if (hasChanges)
      {
        console.log(
          context.history().changes(iD.actions.DiscardTags(context.history().difference())));
      }
    }

    model_conflicts.getSourceLayerId = function(feature) {
        var mergeLayer = hoot.loadedLayers()[feature.layerName];
        var sourceLayers = mergeLayer.layers;
        var featureLayerName = sourceLayers[parseInt(feature.tags['hoot:status']) - 1];
        var sourceLayer = hoot.loadedLayers()[featureLayerName];
        return (sourceLayer) ? sourceLayer.mapId : null;
    };

    model_conflicts.getFeatureLayer = function(feature) {
        return hoot.loadedLayers()[feature.layerName];
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
}
