iD.actions.DeleteMember = function(relationId, memberIndex) {
	    // Hootenanny review validation
    function isHootReview(entity) {
        if(entity.tags['hoot:review:needs']) {
            return true;
        }
        return false;
    }

    return function(graph) {
        var relation = graph.entity(relationId)
            .removeMember(memberIndex);

        graph = graph.replace(relation);

        if (relation.isDegenerate()){
        	if(isHootReview(relation) === false){
        		graph = iD.actions.DeleteRelation(relation.id)(graph);
        	}           
        }

        return graph;
    };
};
