Hoot.demo = function(context) {
        
	//see #7278 for instructions on how to run this
	
	var layerName = "AllDataTypesOut"; //TODO: change this based on your dataset
	var mapId = 1195; //TODO: change this based on your dataset
	//iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
	reviewMergeRelationId = "r2_" + mapId.toString();
	
	//fake a merged node
	var mergedNode = new iD.Node();
	mergedNode.id = iD.Entity.id("node") + "_" + mapId.toString();  //TODO: fix?
    mergedNode.version = 0;
    mergedNode.tags = {};
    mergedNode.tags['uuid'] = "{a44f5118-15f6-46ce-a175-7939853ef310}";
    mergedNode.tags['hoot:status'] = 3;
    mergedNode.loc = [];
    mergedNode.loc[0] = 0;
    mergedNode.loc[1] = 0;
    context.perform(
      iD.actions.AddEntity(mergedNode), t('operations.add.annotation.point'));
	
    var queryElements = new Array();
    
    var queryElement1 = {};
    queryElement1.mapId = mapId;
    queryElement1.id = 5;
    queryElement1.type = "node";
    queryElements.push(queryElement1);
    
    var queryElement2 = {};
    queryElement2.mapId = mapId;
    queryElement2.id = 140;
    queryElement2.type = "node";
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
      	console.log(response);

      	context.hoot().assert(
      	  response.reviewRefsResponses.length == queryElements.length);
      	
      	console.log(response.reviewRefsResponses[0].reviewRefs);
      	console.log(response.reviewRefsResponses[1].reviewRefs);
      	var reviewRefs = 
          _.uniq(
            response.reviewRefsResponses[0].reviewRefs.concat(
              response.reviewRefsResponses[1].reviewRefs));
      	console.log("reviewRefs: " + reviewRefs);
        //if either of the two merged features reference each other, remove those
      	//references from this list
      	reviewRefs = removeReviewRefs(reviewRefs, [queryElement1.id, queryElement2.id]);
        console.log("reviewRefs: " + reviewRefs);
      	
      	var reviewRelationIds = new Array();
      	for (var i = 0; i < reviewRefs.length; i++)
      	{
      	  console.log("reviewRefs.reviewRelationId: " + reviewRefs[i].reviewRelationId);
      	  //iD feature ID: <OSM element type first char> + <OSM element ID> + '_' + <mapid>;
      	  reviewRelationIds.push(
      	    "r" + reviewRefs[i].reviewRelationId.toString() + "_" + mapId.toString());
      	}
      	reviewRelationIds.push(reviewMergeRelationId);
      	console.log(reviewRelationIds);
      	
      	//retrieve all the associated review relations
      	context.loadMissing(reviewRelationIds,
      	  function(err, entities)
      	  {
      		console.log("entities.data[0]: " + entities.data[0]);
      		console.log("entities.data: " + entities.data);
      		console.log("entities.data.length: " + entities.data.length);
      		console.log("test3");  
      		for (var i = 0; i < entities.data.length; i++)
      		{
      		  var reviewRelation = entities.data[i];
      		  console.log("reviewRelation: " + reviewRelation);
      		  console.log("reviewRelation.id: " + reviewRelation.id);
      		  console.log("reviewMergeRelationId: " + reviewMergeRelationId);
      		  console.log("reviewRelation members: " + reviewRelation.members);
      	      if (reviewRelation.id == reviewMergeRelationId)
      	      {
      	    	console.log("test1");
      	    	//add a changeset which resolves this review
      	    	var newTags = _.clone(reviewRelation.tags);
                newTags["hoot:review:needs"] = "no";
                context.perform(
                  iD.actions.ChangeTags(reviewRelation.id, newTags), 
                  t('operations.change_tags.annotation'));
      	      }
      	      else
      	      {
      	    	console.log("test2");  
      	    	//for all other review relations, update them to point to the newly 
      	    	//created feature as a result of the merge
                	
      	    	//delete the members corresponding to the features deleted as a result 
      	    	//of the merge
      	    	var queryElement1iDid = "n" + queryElement1.id.toString() + "_" + mapId.toString();
      	    	var queryElement1Member = reviewRelation.memberById(queryElement1iDid);
      	    	console.log("queryElement1Member: " + queryElement1Member);
      	    	if (queryElement1Member != null)
      	    	{
      	    	  context.perform(
        	        iD.actions.DeleteMember(reviewRelation.id, queryElement1Member.index),
        	        t('operations.delete_member.annotation'));
      	    	}
      	    	var queryElement2iDid = "n" + queryElement2.id.toString() + "_" + mapId.toString();
      	    	var queryElement2Member = reviewRelation.memberById(queryElement2iDid);
      	    	console.log("queryElement2Member: " + queryElement2Member);
      	    	if (queryElement2Member != null)
      	    	{
      	    	  context.perform(
            	    iD.actions.DeleteMember(reviewRelation.id, queryElement2Member.index),
            	    t('operations.delete_member.annotation'));
      	    	}
      	    	
      	    	//add the new merged node as a new review relation member
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
            
          	validateMergeChangeset();
      	  },
      	  layerName);
      });
    
    /*
     * Removes any items reviewRefs whose element id matches the element id passed in idsToRemove
     */
    var removeReviewRefs = function(reviewRefs, idsToRemove)
    {
      console.log("reviewRefs: " + reviewRefs);
      console.log("idsToRemove: " + idsToRemove);

      var modifiedReviewRefs = new Array();
      for (var i = 0; i < reviewRefs.length; i++)
      {
        var reviewRef = reviewRefs[i];
        console.log("reviewRef.id: " + reviewRef.id);
        console.log("idsToRemove.indexOf(reviewRef.id): " + idsToRemove.indexOf(reviewRef.id));
        if (idsToRemove.indexOf(reviewRef.id) == -1)
        {
          console.log("adding reviewRef.id: " + reviewRef.id);
          modifiedReviewRefs.push(reviewRef);
        }
      }
      console.log("modifiedReviewRefs: " + modifiedReviewRefs);
      return modifiedReviewRefs;
    }
    
    //only call this at the very end of a node merge operation
    var validateMergeChangeset = function()
    {
      var hasChanges = context.history().hasChanges();
      context.hoot().assert(hasChanges);
      var changes = 
    	context.history().changes(
          iD.actions.DiscardTags(context.history().difference()));
      console.log(changes);
      console.log(JXON.stringify(context.connection().osmChangeJXON(1, changes)));
      context.hoot().assert(changes.created.length == 1);
      //The modified length will vary depending on the number of review references returned by
      //the features deleted as a result of the merge, but will always at least contain the resolved
      //review of the two features deleted as a result of the merge.
      context.hoot().assert(changes.modified.length >= 1);
      //you won't see these deletion in the changeset in this demo example, but will during an
      //actual merge
      //context.hoot().assert(changes.deleted.length == 2);
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
};