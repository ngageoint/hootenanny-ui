Hoot.model.conflicts = function(context)
{
  var model_conflicts = {};
  //var descendents = {};

    model_conflicts.beginReview = function (layer, callback) {
        var mapid = layer.mapId;
       /* context.hoot().model.layers.refresh(function () {
            callback(layer);
        });*/
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
                        	 alert("Reviews are being reviewed by other users. Modified features will be saved but will not be marked as resolved.");
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
     * Updates the review against tag for the merged feature with the contents of the review
     * against items
     */
    var updateMergedFeatureReviewAgainstTag =
      function(mergedFeature, reviewAgainstItems)
    {
      //console.log(mergedFeature);
      //console.log(reviewAgainstItems);
      if (reviewAgainstItems.length > 0)
      {
    	// add these feature ID's to the hoot:review:uuid tag of the new feature created
        // by the merge; the new merged feature shouldn't have any hoot:review:uuid's so don't
    	// check for that tag
    	var updatedMergedFeatureReviewAgainstIdsStr = "";
        for (var i = 0; i < reviewAgainstItems.length; i++)
        {
          var reviewAgainstItemId = reviewAgainstItems[i].reviewAgainstItemId;
          //console.log(reviewAgainstItemId);
          if (updatedMergedFeatureReviewAgainstIdsStr.indexOf(reviewAgainstItemId) == -1 &&
        	  reviewAgainstItemId && reviewAgainstItemId != "" && reviewAgainstItemId != "undefined")
          {
        	updatedMergedFeatureReviewAgainstIdsStr += reviewAgainstItemId + ";";
          }
        }
        if (updatedMergedFeatureReviewAgainstIdsStr != "")
        {
          //this is a new feature which hasn't been created yet, so we're adding the tag to the
          //feature object vs calling the ChangeTags action
          mergedFeature.tags['hoot:review:uuid'] = updatedMergedFeatureReviewAgainstIdsStr;
          mergedFeature.tags['hoot:review:needs'] = "yes";
        }
      }
      //console.log(mergedFeature);
      return mergedFeature;
    }

    /*
     * Converts reviewable items to iD feature ID's
     */
    var reviewableItemsToIdFeatureIds = function(reviewableItems, mapId)
    {
      //console.log(reviewableItems);
      var reviewableItemiDFeatureIds = [];
      if (reviewableItems.length > 0)
      {
      	//create iD feature ID's
        for (var i = 0; i < reviewableItems.length; i++)
        {
          //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
          var reviewableItem = reviewableItems[i];
          //console.log(reviewableItem);
          var elementTypeAbbrev = reviewableItem.type.substring(0, 1);
          reviewableItemiDFeatureIds[i] = elementTypeAbbrev + reviewableItem.id + '_' + mapId;
        }
      }
      //console.log(reviewableItemiDFeatureIds);
      return reviewableItemiDFeatureIds;
    }

    /*
     * Adds the id of the merged feature to the review against tag of the features passed in for
     * update; also removes any id in the uuidsToRemove list from the features passed in
     */
    var updateTagsForFeaturesReferencingFeaturesDeletedByMerge =
      function(mergedFeature, featuresToUpdate, uuidsToRemove)
    {
      //console.log(featuresToUpdate.data);
      for (var i = 0; i < featuresToUpdate.data.length; i++)
      {
    	var featureUpdated = false;
        var featureToUpdate = featuresToUpdate.data[i];

        //console.log(featureToUpdate);

        var featureReviewAgainstIdsStr = featureToUpdate.tags['hoot:review:uuid'];

        //remove the ids in the remove list if they are present
        if (!featureReviewAgainstIdsStr || typeof featureReviewAgainstIdsStr == 'undefined' ||
        	featureReviewAgainstIdsStr == 'undefined')
        {
          featureReviewAgainstIdsStr = "";
        }
        else if (featureReviewAgainstIdsStr.indexOf(";") != -1)
        {
          var featureReviewAgainstIdsArr = featureReviewAgainstIdsStr.split(";");
          featureReviewAgainstIdsStr = "";
          for (var j = 0; j < featureReviewAgainstIdsArr.length; j++)
          {
        	var id = featureReviewAgainstIdsArr[j];
            if (uuidsToRemove.indexOf(id) == -1 && id && id != "" && id != "undefined")
            {

              if(j == 0) {
                featureReviewAgainstIdsStr += id;
              } else {
                featureReviewAgainstIdsStr += ";" + id;
              }
              featureUpdated = true;
            }
          }
        }
        else
        {
          if (uuidsToRemove.indexOf(featureReviewAgainstIdsStr) != -1)
          {
        	featureReviewAgainstIdsStr = "";
        	featureUpdated = true;
          }
        }

        // add the feature id of the new merged feature to the hoot:review:uuid tag
        // of each of the retrieved features
        //We would have a big problem here if we weren't replacing the uuid on the merged
        //feature b/c the mergedFeature would have had a concatenated uuid made up of the
        //deleted uuid's, which would cause review back end problems later on.
        var mergedFeatureUuid = mergedFeature.tags["uuid"];
        //console.log(mergedFeatureUuid);
        //don't think there is any way the feature would contained the new merged feature's uuid,
        //or be in the uuidsToRemove list, but let's check anyway
        if (featureReviewAgainstIdsStr.indexOf(mergedFeatureUuid) == -1 &&
        	uuidsToRemove.indexOf(mergedFeatureUuid) == -1)
        {
          if (featureReviewAgainstIdsStr != "" && featureReviewAgainstIdsStr && 
        	  featureReviewAgainstIdsStr != "undefined")
          {
        	featureReviewAgainstIdsStr = featureReviewAgainstIdsStr + ";" + mergedFeatureUuid;
          }
          else
          {
        	featureReviewAgainstIdsStr = mergedFeatureUuid;
          }
          featureUpdated = true;
        }

        if (featureReviewAgainstIdsStr == "")
        {
          //nothing left to review against, so drop all review tags
          featureToUpdate.tags =
        	_.omit(featureToUpdate.tags,
        		   function (value, key)
        		   {
                     return key.match(/hoot:review/g);
                   });
          featureUpdated = true;
        }
        else
        {
          featureToUpdate.tags["hoot:review:uuid"] = featureReviewAgainstIdsStr;
          featureToUpdate.tags['hoot:review:needs'] = "yes";
        }
        //console.log(featureToUpdate);

        if (featureUpdated)
        {
          context.perform(
            iD.actions.ChangeTags(
              featureToUpdate.id, featureToUpdate.tags), t('operations.change_tags.annotation'));
        }
      }
    }

    /*
     * This assumes all features are nodes; I'm sure there's a more succinct js way to do this...
     */
    var removeItems = function(reviewItems, iDidsToRemove)
    {
      //iD id format: item type first char + item osm id + '_' + map id;
      var idsToRemove = new Array();
      for (var i = 0; i < iDidsToRemove.length; i++)
      {
    	var iDid = iDidsToRemove[i];
    	var elementId = Number(iDid.substring(1, iDid.length - 1).split("_")[0]);
    	idsToRemove.push(elementId);
    	//console.log(elementId);
      }

      var modifiedReviewItems = new Array();
      for (var i = 0; i < reviewItems.length; i++)
      {
        var reviewItem = reviewItems[i];
        //console.log(reviewItem.id);
        if (idsToRemove.indexOf(reviewItem.id) == -1)
        {
          //console.log(reviewItem.id);
          modifiedReviewItems.push(reviewItem)
        }
      }
      return modifiedReviewItems;
    }

    function guid() {
    	  function s4() {
    	    return Math.floor((1 + Math.random()) * 0x10000)
    	      .toString(16)
    	      .substring(1);
    	  }
    	  return "{" + s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    	    s4() + '-' + s4() + s4() + s4() + "}";
    	}

    /*
     * The code in this method is making the assumption that only nodes are merged here, which
     * is currently the case.  If this changes, then the code will need to be updated.
     */
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, mapid) {
        context.hoot().control.conflicts.setProcessing(true);
        var layerName = feature.layerName;

        if (!feature && !featureAgainst) {
             window.alert('Merge error, one feature is missing');
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
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

            	//Remove two input entities
                //console.log("test9");
                //grab these uuid's before the delete happens
                var uuidsToRemove = new Array();
                uuidsToRemove.push(context.entity(feature.id).tags["uuid"]);
                uuidsToRemove.push(context.entity(featureAgainst.id).tags["uuid"]);
                iD.operations.Delete([feature.id, featureAgainst.id], context)();
                //logDiff();

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
                //The new feature should start out with no review against tags.  It may pick some
                //up later as we update references to the deleted nodes.
                mergedNode.tags['hoot:review:uuid'] = "";
                //TODO: hack - The UUID of the merged node made of up the UUID's of the deleted
                //merged in items is going to wreak havoc in the review back end down the line.
                //For now, replacing it with a new one...unfortunately will lose provenance...but
                //since the merged in elements are deleted anyway, does it really matter?
                mergedNode.tags['uuid'] = guid();
                //console.log(mergedNode);

                //manage the tags for the deleted feature and those who ref them

                //get references to review data for the reviewable feature
                Hoot.model.REST('getReviewRefs', mapid, feature.id,
                  function (error, response)
                  {
                	//console.log(response);
                  	if (error)
                    {
                  	  console.log(error);
                      alert('failed to retrieve review refs.');
                      context.hoot().control.conflicts.setProcessing(false);
                      return;
                    }

                    // These are the all features that the just deleted features, as a
                    // result of the merge, still reference as needing to be reviewed against (the
                    // deleted features' hoot:review:uuid tags contain the id's of these features).
                    var reviewAgainstItems1 = response.reviewAgainstItems;
                    //go through and remove any references to the two features being deleted, since
                    //we no longer care about any review tag updates involving them
                    //console.log("reviewAgainstItems1: " + reviewAgainstItems1);
                    reviewAgainstItems1 =
                      removeItems(reviewAgainstItems1, [feature.id, featureAgainst.id]);
                    //console.log("reviewAgainstItems1: " + reviewAgainstItems1);
                    // These are all features that reference the above deleted features, as a
                    // result of the merge, as still needing to be reviewed against (these
                    // features contain the ID's of the deleted features in their hoot:review:uuid
                    // tags).
                    var reviewableItems1 = response.reviewableItems;
                    //console.log("reviewableItems1: " + reviewableItems1);
                    reviewableItems1 =
                      removeItems(reviewableItems1, [feature.id, featureAgainst.id]);
                    //console.log("reviewableItems1: " + reviewableItems1);

                    //get references to review data for the review against feature
                    Hoot.model.REST('getReviewRefs', mapid, featureAgainst.id,
                      function (error, response)
                      {
                    	//console.log(response);
                        if (error)
                        {
                          console.log(error);
                          alert('failed to retrieve review refs.');
                          context.hoot().control.conflicts.setProcessing(false);
                          return;
                        }

                        // see comments above on these data structures
                        var reviewAgainstItems2 = response.reviewAgainstItems;
                        //console.log("reviewAgainstItems2: " + reviewAgainstItems2);
                        reviewAgainstItems2 =
                          removeItems(reviewAgainstItems2, [feature.id, featureAgainst.id]);
                        //console.log("reviewAgainstItems2: " + reviewAgainstItems2);
                        var reviewableItems2 = response.reviewableItems;
                        //console.log("reviewableItems2: " + reviewableItems2);
                        reviewableItems2 =
                          removeItems(reviewableItems2, [feature.id, featureAgainst.id]);
                        //console.log("reviewableItems2: " + reviewableItems2);

                        //update the review tags on the new merged feature; exclude the feature/
                        //feature against uuid's from being added to review tags, since those
                        //features will no longer exist after the changeset delete
                        mergedNode =
                          updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItems1);
                        mergedNode =
                          updateMergedFeatureReviewAgainstTag(mergedNode, reviewAgainstItems2);

                        var mergedNodeReviewAgainstIds = mergedNode["hoot:review:uuid"];
                        if (!mergedNodeReviewAgainstIds ||
                        	typeof mergedNodeReviewAgainstIds == 'undefined' ||
                        	mergedNodeReviewAgainstIds == 'undefined' ||
                        	mergedNodeReviewAgainstIds == "")
                        {
                          //nothing left to review against, so drop all review tags
                          mergedNode.tags =
                            _.omit(mergedNode.tags,
                              function (value, key)
                              {
                                return key.match(/hoot:review/g);
                              });
                        }

                        //console.log(mergedNode);
                        //console.log("test1");
                        //logDiff();

                        //TODO: There is some duplicated logic here, but having it was the only
                        //way I could get the events to trigger properly, since loadMultiple
                        //doesn't seem to execute at all if you pass an empty set of ID's to it.
                        //Need to clean this up

                        var reviewableItemiDFeatureIds1 =
                          reviewableItemsToIdFeatureIds(reviewableItems1, mapid);
                        if (reviewableItemiDFeatureIds1.length > 0)
                        {
                          //console.log("test2");
                          //console.log(reviewableItemiDFeatureIds1);
                          //HACK alert:
                          //TODO: come up with a better way to manage the active layer name
                          var layerNames = d3.entries(hoot.loadedLayers()).filter(function(d) {
                             return 1*d.value.mapId === 1*mapid;
                          });
                          var layerName = layerNames[0].key;
                          // retrieve the features
                          context.loadMissing(reviewableItemiDFeatureIds1,
                            function(err, entities1)
                          {
                        	//console.log("test3");
                            //add the merged node tag to the review tags for features
                            //referencing the deleted features - see note above about excluding
                        	//feature/featureAgainst uuids
                            updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                              mergedNode, entities1, uuidsToRemove);
                            //logDiff();

                            var reviewableItemiDFeatureIds2 =
                              reviewableItemsToIdFeatureIds(reviewableItems2, mapid);
                            if (reviewableItemiDFeatureIds2.length > 0)
                            {
                              //console.log("test4");
                              context.connection().loadMultiple(reviewableItemiDFeatureIds2,
                                function(err, entities2)
                                {
                                  //console.log("test5");
                                  updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                                    mergedNode, entities2, uuidsToRemove);

                                  context.perform(
                                    iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
                                  //logDiff();

                                   //Track merged ids in descendents
                                   //descendents[feature.id] = mergedNode.id;
                                   //descendents[featureAgainst.id] = mergedNode.id;

                                   window.setTimeout(function() {
                                    context.hoot().control.conflicts.setProcessing(false);
                                     context.enter(iD.modes.Select(context, [mergedNode.id])); }, 500);
                                });
                            }
                         },
                         layerName);
                        }
                        else
                        {
                          //console.log("test6");
                          var reviewableItemiDFeatureIds2 =
                            reviewableItemsToIdFeatureIds(reviewableItems2, mapid);
                          if (reviewableItemiDFeatureIds2.length > 0)
                          {
                        	//console.log("test7");
                        	context.loadMissing(reviewableItemiDFeatureIds2,
                              function(err, entities2)
                              {
                        		//console.log("test8");
                                updateTagsForFeaturesReferencingFeaturesDeletedByMerge(
                                  mergedNode, entities2, uuidsToRemove);

                                context.perform(
                                  iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
                                //logDiff();

                                //Track merged ids in descendents
                                //descendents[feature.id] = mergedNode.id;
                                //descendents[featureAgainst.id] = mergedNode.id;

                                window.setTimeout(function() {
                                  context.hoot().control.conflicts.setProcessing(false);
                                  context.enter(iD.modes.Select(context, [mergedNode.id])); 
                                  
                                }, 500);
                              },
                              layerName);
                          }
                          else
                          {
                        	//console.log("test10");
                        	context.perform(
                              iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
                            //logDiff();

                            window.setTimeout(function() {
                              context.hoot().control.conflicts.setProcessing(false);
                              context.enter(iD.modes.Select(context, [mergedNode.id])); }, 500);
                          }
                        }
                   });
               });
            }, mapid, layerName);
            }
        }
    };

    var logDiff = function()
    {
      var hasChanges = context.history().hasChanges();
      if (hasChanges)
      {
        console.log(
          context.history().changes(
            iD.actions.DiscardTags(context.history().difference())));
      }
    }

    //test comment
    /*model_conflicts.findDescendent = function(id) {
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
    };*/

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
};