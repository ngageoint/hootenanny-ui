// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(nodeId) {
    // Hootenanny review validation
    function isHootReview(entity) {
        if(entity.tags['hoot:review:needs']) {
            return true;
        }
        return false;
    }

    // Mark the hoot reviewable resolved
    // May be we should move hoot functions to hoot modules
    // but this seems to be low level tag ops which may make
    // sense to leave it here
    function updateHootReviewTags(entity, graph) {
        var tags = entity.tags;
        //console.log(tags);
        var newTags = _.clone(tags);
        newTags['hoot:review:needs'] = 'no';
        return iD.actions.ChangeTags(entity.id, newTags)(graph);

    }


    var action = function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node)
            .forEach(function(parent) {
                parent = parent.removeNode(nodeId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = iD.actions.DeleteWay(parent.id)(graph);
                }
            });

        graph.parentRelations(node)
            .forEach(function(parent) {
                parent = parent.removeMembersWithID(nodeId);
                graph = graph.replace(parent);

                
                if (parent.isDegenerate()) {
                    /* Removing previous code to delete empty point relation */
                    /* --- OLD CODE (commit c4d4b5be) --- */
                    // If we are in hoot review mode then do not delete relation
                    // This can happen only during hootenanny POI automerge
                    /*if(isHootReview(parent) === false){*/
                   graph = iD.actions.DeleteRelation(parent.id)(graph);
                   /* } else {
                        graph = updateHootReviewTags(parent, graph);

                    }*/
                } else {
                    if(!node.hootMeta || (node.hootMeta && !node.hootMeta.isReviewDel)){
                        graph = updateHootReviewTags(parent, graph);
                    }
                }
            });

        return graph.remove(node);
    };

    action.disabled = function() {
        return false;
    };

    return action;
};
