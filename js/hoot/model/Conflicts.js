Hoot.model.conflicts = function(context)
{
  var model_conflicts = {};
  var descendents = {};

    model_conflicts.beginReview = function (layer, callback) {
        var mapid = layer.mapId;
       /* context.hoot().model.layers.refresh(function () {
            callback(layer);
        });*/
        callback(layer);
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

                    Hoot.model.REST('ReviewGetLockCount', data.mapId, function (resp) {
                        //if only locked by self
                        if(resp.count >= 2) {
                        	 alert("Reviews are being reviewed by other users. Modified features will be saved but will not be marked as resolved.");
                        } 

                        if (callback) {
                            callback();
                        }
                    });
                });
            }
            else {
                callback();
            }
        };
    
    var updateMergedFeatureReviewAgainstTag = function(mergedFeature, reviewAgainstItems) 
    {
      //console.log(mergedFeature);
      //console.log(reviewAgainstItems);
      if (reviewAgainstItems.length > 0)
      {
    	// add these feature ID's to the hoot:review:uuid tag of the new feature created
        // by the merge
        var mergedFeatureExistingReviewAgainstIdsStr = mergedFeature.tags['hoot:review:uuid'];
        var updatedMergedFeatureReviewAgainstIdsStr = "";
        if (mergedFeatureExistingReviewAgainstIdsStr)
        {
          var mergedFeatureExistingReviewAgainstIds;
          if (mergedFeatureExistingReviewAgainstIdsStr.indexOf(";") != -1)
          {
            mergedFeatureExistingReviewAgainstIds = 
              mergedFeatureExistingReviewAgainstIdsStr.split(";");
          }
          else
          {
            mergedFeatureExistingReviewAgainstIds = [];
            mergedFeatureExistingReviewAgainstIds[0] = mergedFeatureExistingReviewAgainstIdsStr;
          }
            	 
          for (var i = 0; i < mergedFeatureExistingReviewAgainstIds.length; i++)
          {
            updatedMergedFeatureReviewAgainstIdsStr += mergedFeatureExistingReviewAgainstIds[i] + ";"
          }
        }
        for (var i = 0; i < reviewAgainstItems.length; i++)
        {
          //console.log(reviewAgainstItems[i]);
          updatedMergedFeatureReviewAgainstIdsStr += 
            reviewAgainstItems[i].reviewAgainstItemId + ";";
        }
        //this is a new feature which hasn't been created yet, so we're adding the tag to the 
        //feature object vs calling the ChangeTags action
        mergedFeature.tags['hoot:review:uuid'] = updatedMergedFeatureReviewAgainstIdsStr;  
      }
        
      //console.log(mergedFeature);
      return mergedFeature;
    }
    
    var updateTagsForFeaturesReferencingFeaturesDeletedByMerge = 
      function(mergedFeature, reviewableItems, mapId)
    {
      //console.log(mergedFeature);
      //console.log(reviewableItems);
      if (reviewableItems.length > 0)
      {
    	//create iD feature ID's
        var reviewableItemiDFeatureIds = [];
        for (var i = 0; i < reviewableItems.length; i++)
        {
          //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
          var reviewableItem = reviewableItems[i];
          //console.log(reviewableItem);
          var elementTypeAbbrev = reviewableItem.type.substring(0, 1);
          reviewableItemiDFeatureIds[i] = elementTypeAbbrev + reviewableItem.id + '_' + mapId;
        }
        //console.log(revieableItemiDFeatureIds);
        // retrieve the features
        context/*.connection()*/.loadMultiple(reviewableItemiDFeatureIds, function(err, entities) 
        {
          //console.log(entities.data);
          for (var i = 0; i < entities.data.length; i++)
          {
            var entityToUpdate = entities.data[i];
            //console.log(entityToUpdate);
            // add the feature id of the new merged feature to the hoot:review:uuid tag
            // of each of the retrieved features 
            var featureReviewAgainstIdsStr = entityToUpdate.tags['hoot:review:uuid'];
            if (!featureReviewAgainstIdsStr)
            {
              featureReviewAgainstIdsStr = ""; 
            }
            for (var j = 0; j < reviewableItems.length; j++)
            {
              featureReviewAgainstIdsStr = featureReviewAgainstIdsStr + ";" + mergedFeature.id; 
            }
            var tags = entityToUpdate.tags;
            var newTags = _.clone(tags);
            newTags['hoot:review:uuid'] = featureReviewAgainstIdsStr;
            //console.log(newTags);
            entityToUpdate.tags = newTags;
              
            //var remoteGraph = iD.Graph(context.history().base(), true);
            //remoteGraph.replace(entityToUpdate);
            //context.graph().replace(entityToUpdate);
            //context.loadEntity(entityToUpdate.id);
            //console.log(context.graph());
            
            /*if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.graph().rebase(entityToUpdate, [context.graph()], true);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.history().graph().rebase(entityToUpdate, [context.graph()], true);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.history().merge(entityToUpdate);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            //iD.actions.MergeRemoteChanges(
              //entityToUpdate.id, context.graph(), iD.Graph(history.base(), true));
            //console.log(context.hasEntity(entityToUpdate.id));
            context.replace(entityToUpdate);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.graph().replace(entityToUpdate);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.history().graph().replace(entityToUpdate);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}*/
            //context.graph().replace(entityToUpdate);
            //context.graph().put(entityToUpdate);
            /*if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}*/
            /*if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            context.history().graph().put(entityToUpdate);
            if (context.graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}
            if (context.history().graph().hasEntity(entityToUpdate.id))
        	{
        	  console.log("true");	
        	}*/
            
            //context.perform(
              //iD.actions.AddEntity(entityToUpdate), t('operations.add.annotation.point'));
            
            context.perform(
              iD.actions.ChangeTags(
                entityToUpdate.id, newTags, context.graph()), t('operations.change_tags.annotation'));
          }
        });  
      }
    }
    
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, mapid) {
        var layerName = feature.layerName;

        if (!feature && !featureAgainst) {
             window.alert('Merge error, one feature is missing');
        } else {
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {
            	
            	//newly merged entity
                var mergedNode = entities[0];
            	
            	//Remove two input entities
                iD.operations.Delete([feature.id, featureAgainst.id], context)();
                
                //deleted feature tag management
                Hoot.model.REST('getReviewRefs', mapid, feature.id,
                  function (error, response) 
                  {
                	  //console.log(response);
                  	  if (error)
                      {
                  	    console.log(error);
                        alert('failed to retrieve review refs.');
                        return;
                      }
                      
                      // These are the all features that the just deleted features, as a 
                      // result of the merge, still reference as needing to be reviewed against (the 
                      // deleted features' hoot:review:uuid tags contain the id's of these features).
                      var reviewAgainstItems1 = response.reviewAgainstItems;
                      //console.log(reviewAgainstItems1);
                      // These are all features that reference the above deleted features,
                      // as a result of the merge, as still needing to be reviewed against (these 
                      // features contain the ID's of the deleted features in their hoot:review:uuid 
                      // tags).
                      var reviewableItems1 = response.reviewableItems;
                      //console.log(reviewableItems1);
                      
                      Hoot.model.REST('getReviewRefs', mapid, featureAgainst.id,
                        function (error, response) 
                        {
                    	  //console.log(response);
                          if (error)
                          {
                        	console.log(error);
                            alert('failed to retrieve review refs.');
                            return;
                          }
                            
                          //console.log(reviewAgainstItems1);
                          //console.log(reviewableItems1);
                          
                          // see comments above on these data structures
                          var reviewAgainstItems2 = response.reviewAgainstItems;
                          //console.log(reviewAgainstItems2);
                          var reviewableItems2 = response.reviewableItems;
                          //console.log(reviewableItems2);
                            
                          //update the review tags on the new merged feature, as well as other
                          //features referencing the deleted features
                          mergedNode = 
                            updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItems1);
                          updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                            mergedNode, reviewableItems1, mapid);
                          mergedNode = 
                            updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItems2);
                          updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                            mergedNode, reviewableItems2, mapid);

                          //FIXME: Temp hack to set version to 0
                          //mergedNode.version = 0;
                          //This would possibly make more sense done server-side, but there are severe 
                          //problems with data consistency client-side when updating tags on the server, 
                          //rather than on the client.
                          mergedNode.tags['hoot:status'] = 3;
                          console.log(mergedNode);
                          context.perform(
                            iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
                          
                          var hasChanges = context.history().hasChanges();
                          if (hasChanges)
                          {
                            console.log(
                              context.history().changes(
                                iD.actions.DiscardTags(context.history().difference())));
                            console.log(
                              context.history().changes(
                                iD.actions.ChangeTags(context.history().difference())));
                            console.log(context.history().difference());
                          }
                          
                          //Track merged ids in descendents
                          //console.log(descendents);
                          descendents[feature.id] = mergedNode.id;
                          descendents[featureAgainst.id] = mergedNode.id;

                          window.setTimeout(function() {
                              context.enter(iD.modes.Select(context, [mergedNode.id]));
                          }, 500);
                        });
                    });
            }, mapid, layerName);
        }
    };

    model_conflicts.findDescendent = function(id) {
        var descId = descendents[id];
        if (typeof descId !== 'undefined') {
            return model_conflicts.findDescendent(descId);
        } else {
            return id;
        }
    };

    model_conflicts.updateDescendent = function(xhr, mapId) {
        var nodes = xhr.getElementsByTagName('node');
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.hasAttribute('new_id')) {
                //TODO: if we support merging ways and relations
                //we'll have to update the id generation pattern
                var oldid = 'n' + n.getAttribute('old_id') + '_' + mapId;
                var newid = 'n' + n.getAttribute('new_id') + '_' + mapId;
                descendents[oldid] = newid;
            }
        }
    };

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

  return model_conflicts;
};