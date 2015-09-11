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
                return [d.type.charAt(0) + d.id + '_' + mapid, d.itemToReviewAgainst.type.charAt(0) + d.itemToReviewAgainst.id + '_' + mapid];
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
    
    /*model_conflicts.RemoveFeature = function (item, mapid) {
        var featureID = item.type.charAt(0) + item.id + '_' + mapid;
        if (!context.hasEntity(featureID)) {
            window.console.log('delete error: ' + featureID);
        } else {
            var toDel = [featureID];
            var delConflicts = iD.operations.Delete([toDel], context);
            delConflicts();
        }
    };*/
    
    var updateMergedFeatureReviewAgainstTag = function(mergedFeature, reviewAgainstItemUuids) 
    {
      console.log(mergedFeature);
      console.log(reviewAgainstItemUuids);
      // add these feature ID's to the hoot:review:uuid tag of the new feature created
      // by the merge
      var mergedFeatureExistingReviewAgainstIdsStr = mergedFeature.tags['hoot:review:uuid'];
      var updatedMergedFeatureReviewAgainstIdsStr = "";
      if (mergedFeatureExistingReviewAgainstIdsStr)
      {
        var mergedFeatureExistingReviewAgainstIds;
        if (mergedFeatureExistingReviewAgainstIdsStr.contains(";"))
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
          updatedMergedFeatureReviewAgainstIdsStr += mergedNFeatureExistingReviewAgainstIds[i] + ";"
        }
      }
      for (var i = 0; i < reviewAgainstItemUuids.length; i++)
      {
        updatedMergedFeatureReviewAgainstIdsStr += reviewAgainstItemUuids[i] + ";";
      }
      mergedFeature.tags['hoot:review:uuid'] = updatedMergedFeatureReviewAgainstIds;
        
      console.log(mergedFeature);
      return mergedFeature;
    }
    
    var updateTagsForFeaturesReferencingFeaturesDeletedByMerge = 
      function(mergedFeature, reviewableItemUuids)
    {
      console.log(mergedFeature);
      console.log(reviewableItemUuids);
      // retrieve the features
      context.connection().loadMultiple(reviewableItemUuids, function(err, entities) 
      {
        console.log(entities.data);
        for (var i = 0; i < reviewableItemUuids.length; i++)
        {
          // add the feature id of the new merged feature to the hoot:review:uuid tag
          // of each of the retrieved features 
            
            
          // create and return a modify request for this...HOW?
          //context.perform(iD.actions.ChangeTags(d, newTags), t('operations.change_tags.annotation'));
        }
      });
    }
    
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, mapid) {
        var layerName = feature.layerName;

        if (!feature && !featureAgainst) {
             window.alert('Merge error, one feature is missing');
        } else {
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {
            	
            	//Add merged entity
                var mergedNode = entities[0];
                //FIXME: Temp hack to set version to 0
                //mergedNode.version = 0;
                //This would possibly make more sense done server-side, but there are severe 
                //problems with data consistency client-side when updating tags on the server, 
                //rather than on the client.
                mergedNode.tags['hoot:status'] = 3;
            	
            	//Remove two input entities
                iD.operations.Delete([feature.id, featureAgainst.id], context)();
                
                //deleted feature tag management
                Hoot.model.REST('getReviewRefs', mapid, feature.id,
                    function (error, response) 
                    {
                  	  if (error)
                      {
                  	    console.log(error);
                        alert('failed to retrieve review refs.');
                        return;
                      }
                      
                      // These are the ID's of all features that the just deleted features, as a 
                      // result of the merge, still reference as needing to be reviewed against (the 
                      // deleted features' hoot:review:uuid tags contain the id's of these features).
                      var reviewAgainstItemUuids1 = response.reviewAgainstItemIds;
                     // These are all ID's of all features that reference the above deleted features,
                      // as a result of the merge, as still needing to be reviewed against (these 
                      // features contain the ID's of the deleted features in their hoot:review:uuid 
                      // tags).
                      var reviewableItemUuids1 = response.reviewableItemIds;
                      
                      Hoot.model.REST('getReviewRefs', mapid, featureAgainst.id,
                          function (error, response) 
                          {
                        	if (error)
                            {
                        	  console.log(error);
                              alert('failed to retrieve review refs.');
                              return;
                            }
                            
                            // see comments above on these data structures
                            var reviewAgainstItemUuids2 = response.reviewAgainstItemIds;
                            var reviewableItemUuids2 = response.reviewableItemIds;
                            
                            //update the review tags on the new merged feature, as well as other
                            //features referencing the deleted features
                            mergedNode = 
                              updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItemUuids1);
                            updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                              mergedNode, reviewableItemUuids1);
                            mergedNode = 
                              updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItemUuids2);
                            updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                              mergedNode, reviewableItemUuids2);
                          });
                    });
                
                console.log(mergedNode);

                context.perform(
                    iD.actions.AddEntity(mergedNode),
                    t('operations.add.annotation.point'));
                
                //Track merged ids in descendents
                //console.log(descendents);
                descendents[feature.id] = mergedNode.id;
                descendents[featureAgainst.id] = mergedNode.id;

                window.setTimeout(function() {
                    context.enter(iD.modes.Select(context, [mergedNode.id]));
                }, 500);

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