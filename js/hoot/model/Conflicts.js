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
     * This assumes all features are nodes.
     */
    var removeReviewRefs = function(reviewRefs, iDidsToRemove)
    {
      //console.log(reviewItems);
      //console.log(iDidsToRemove);
      //iD id format: item type first char + item osm id + '_' + map id;
      var idsToRemove = new Array();
      for (var i = 0; i < iDidsToRemove.length; i++)
      {
    	var iDid = iDidsToRemove[i];
    	var elementId = Number(iDid.substring(1, iDid.length - 1).split("_")[0]);
    	idsToRemove.push(elementId);
    	//console.log(elementId);
      }

      var modifiedReviewRefs = new Array();
      for (var i = 0; i < reviewRefs.length; i++)
      {
        var reviewRef = reviewRefs[i];
        //console.log(reviewRef.id);
        if (idsToRemove.indexOf(reviewRef.id) == -1)
        {
          //console.log(reviewRef.id);
          modifiedReviewRefs.push(reviewRef);
        }
      }
      //console.log(modifiedReviewRefs);
      return modifiedReviewRefs;
    }

    /*
     * The code in this method is making the assumption that only nodes are merged here, which
     * is currently the case.  If this changes, then the code will need to be updated.
     */
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, mapid) {
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
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

            	//console.log(feature);
            	//console.log(featureAgainst);
                
                //Remove the two input entities
                iD.operations.Delete([feature.id, featureAgainst.id], context)();

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
                //logDiff();

                //get references to unresolved review data involving the features deleted as a
                //result of the merge
                
                var queryElements = new Array();
                
                var queryElement1 = {};
                queryElement1.mapId = mapid;
                queryElement1.id = feature.id;
                queryElement1.type = feature.type;
                queryElements.push(queryElement1);
                
                var queryElement2 = {};
                queryElement2.mapId = mapid;
                queryElement2.id = featureAgainst.id;
                queryElement2.type = featureAgainst.type;
                queryElements.push(queryElement2);
                
                Hoot.model.REST('getReviewRefs', queryElements,
                  function (error, response)
                  {
                  	if (error)
                    {
                  	  console.log(error);
                  	  iD.ui.Alert('failed to retrieve review refs.','warning');
                      context.hoot().control.conflicts.setProcessing(false);
                      return;
                    }

                  	context.hoot().assert(
                  	  response.reviewRefsResponses.length == queryElements.length);
                  	
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
                  	  reviewRelationIds.push(reviewRefs.reviewRelationId);
                  	}
                  	//TODO: add the review relation ID for the merged features (need to have it
                  	//returned when retrieving reviews)
                  	
                  	//retrieve all the associated review relations
                  	context.loadMissing(reviewRelationIds,
                  	  function(err, entities)
                  	  {
                  		for (var i = 0; i < entities.length; i++)
                  		{
                  		  var reviewRelation = entities[i];
                  	      if (reviewRelation.id != mergeRelation.id)
                  	      {
                  	    	//TODO: add a changeset which resolves this review
                  	    	
                  	    	//logDiff();
                  	      }
                  	      else
                  	      {
                  	    	//TODO: for all other review relations, and update them to point to the 
                          	//newly created feature as a result of the merge
                  	    	 
                  	    	//logDiff();
                  	      }
                  		}
                        
                      	checkMergeChangeset();
                  	  },
                  	  layerName);
                  });
               }, mapid, layerName);
            }
        } 
    };
    
    //only call this at the very end of a node merge operation
    var checkMergeChangeset = function()
    {
      var hasChanges = context.history().hasChanges();
      context.hoot().assert(hasChanges);
      var changes = 
    	context.history().changes(
          iD.actions.DiscardTags(context.history().difference()));
      context.hoot().assert(changes.created.length == 1);
      context.hoot().assert(changes.deleted.length == 2);
      //the modified length will vary depending on the number of review references returned by
      //the features deleted as a result of the merge
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
};