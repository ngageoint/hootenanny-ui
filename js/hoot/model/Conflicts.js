Hoot.model.conflicts = function(context)
{
  var model_conflicts = {};

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
    
    model_conflicts.acceptAll = function (data, callback) {

    	    var items = data.reviewableItems;
            var mapid = data.mapId;
            //drop all review tags from the all reviewed features, since they're all being
            //marked as reviewed
            var flagged = _.uniq(_.flatten(_.map(items, function (d) {
                return [d.type.charAt(0) + d.id + '_' +
                  mapid, d.itemToReviewAgainst.type.charAt(0) + d.itemToReviewAgainst.id + '_' +
                  mapid];
            })));
            var inID = _.filter(flagged, function (d) {
                return context.hasEntity(d);
            });
            _.each(inID, function (d) {
                var ent = context.hasEntity(d);
                if (!ent) {
                    return;
                }
                var tags = ent.tags;
                var newTags = _.clone(tags);
                newTags = _.omit(newTags, function (value, key) {
                    return key.match(/hoot:review/g);
                });
                context.perform(iD.actions.ChangeTags(d, newTags), t('operations.change_tags.annotation'));
            });

            var hasChanges = context.history().hasChanges();
            if (hasChanges) {
                iD.modes.Save(context).save(context, function () {

                    reloadLayer(data);

                    Hoot.model.REST('ReviewGetLockCount', data.mapId, function (resp) {
                        //if only locked by self
                        if(resp.count >= 2) {
                        	iD.ui.Alert("Reviews are being reviewed by other users. Modified features will be saved but will not be marked as resolved.",'warning');
                        }

                        if (callback) {
                            callback();
                        }
                    });
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

    /*
     * The code in this method is making the assumption that only nodes are merged here, which
     * is currently the case.  If this changes, then the code will need to be updated.
     */
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, 
        mapid, reviewMergeRelationId, callback) {

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

                function doMerge() {
                    try
                    {
                        var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                            JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

                        context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

                        //console.log(feature);
                        //console.log(featureAgainst);
                        
                        

                        //newly merged entity
                        var mergedNode = entities[0];

                        //The following tag updates would possibly make more sense done server-side, but
                        //there are severe problems with data consistency client-side when updating tags
                        //on the server, rather than on the client.

                        //OSM services expect new elements to have version = 0.  I thought iD would handle
                        //this during changeset creation, but it doesn't look like it does.
                        mergedNode.version = 0;
                        //TODO: is this right?  Technically, this new feature was auto-merged from source
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
                                    reviewRefs = removeReviewRefs(reviewRefs, [queryElement1.id, queryElement2.id]);
                                    //console.log("reviewRefs: " + reviewRefs);
                                    
                                    var reviewRelationIds = new Array();
                                    for (var i = 0; i < reviewRefs.length; i++)
                                    {
                                      //console.log("reviewRefs.reviewRelationId: " + reviewRefs[i].reviewRelationId);
                                      //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
                                      reviewRelationIds.push(
                                        "r" + reviewRefs[i].reviewRelationId.toString() + "_" + mapid);
                                    }
                                    reviewRelationIds.push("r" + reviewMergeRelationId + "_" + mapid);
                                    //console.log(reviewRelationIds);
                                   
                                    //retrieve all the associated review relations
                                    context.loadMissing(reviewRelationIds,
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
                                                for (var i = 0; i < entities.data.length; i++)
                                                {
                                                  var reviewRelation = entities.data[i];
                                                  //console.log("reviewRelation: " + reviewRelation);
                                                  //console.log("reviewRelation.id: " + reviewRelation.id);
                                                  ///console.log("reviewMergeRelationId: " + reviewMergeRelationId);
                                                  //console.log("reviewRelation members: " + reviewRelation.members);
                                                  if (reviewRelation.id == ("r" + reviewMergeRelationId + "_" + mapid))
                                                  {
                                                    //console.log("test1");
                                                    //add a changeset which resolves this review
                                                    var newTags = _.clone(reviewRelation.tags);
                                                    newTags["hoot:review:needs"] = "no";
                                                    context.perform(
                                                      iD.actions.ChangeTags(reviewRelation.id, newTags), 
                                                      t('operations.change_tags.annotation'));

                                                    // remove all relations member so it does not interact
                                                    // when updating osm in service
                                                    for(var ii=0; ii <reviewRelation.members.length; ii++){
                                                        context.perform(
                                                        iD.actions.DeleteMember(reviewRelation.id, ii),
                                                        t('operations.delete_member.annotation'));
                                                    }
                                                  }
                                                  else
                                                  {
                                                    //console.log("test2");  
                                                    //for all other review relations, update them to point to the newly 
                                                    //created feature as a result of the merge

                                                    //delete the members corresponding to the features deleted as a result 
                                                    //of the merge
                                                    var queryElement1iDid = 
                                                      "n" + queryElement1.id.toString() + "_" + mapid;
                                                    var queryElement1Member = reviewRelation.memberById(queryElement1iDid);
                                                    //console.log("queryElement1Member: " + queryElement1Member);
                                                    if (queryElement1Member != null && context.hasEntity(queryElement1iDid))
                                                    {
                                                      context.perform(
                                                        iD.actions.DeleteMember(reviewRelation.id, queryElement1Member.index),
                                                        t('operations.delete_member.annotation'));
                                                    }
                                                    var queryElement2iDid = 
                                                      "n" + queryElement2.id.toString() + "_" + mapid;
                                                    var queryElement2Member = reviewRelation.memberById(queryElement2iDid);
                                                    //console.log("queryElement2Member: " + queryElement2Member);
                                                    if (queryElement2Member != null && context.hasEntity(queryElement2iDid))
                                                    {
                                                      context.perform(
                                                        iD.actions.DeleteMember(reviewRelation.id, queryElement2Member.index),
                                                        t('operations.delete_member.annotation'));
                                                    }
                                                    
                                                    
                                                    //add the new merged node as a new member
                                                    var newMember = new iD.Node();
                                                    newMember.id = mergedNode.id;
                                                    newMember.type = "node";
                                                    newMember.role = "reviewee";
                                                    //at least one of the query elements should be a member of this relation
                                                    if (queryElement1Member != null)
                                                    {
                                                      newMember.index = queryElement1Member.index;
                                                    }
                                                    else if (queryElement2Member != null)
                                                    {
                                                      newMember.index = queryElement2Member.index;
                                                    }
                                                    context.perform(
                                                      iD.actions.AddMember(reviewRelation.id, newMember, newMember.index),
                                                        t('operations.add.annotation.relation'));
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

                                                //there will always be changes at this point
                                                validateMergeChangeset();                 
                                               /* iD.modes.Save(context).save(context, function () { 
                                                  context.hoot().control.conflicts.setProcessing(false);
                                                });*/
                                                context.hoot().control.conflicts.setProcessing(false);

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
    }

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
