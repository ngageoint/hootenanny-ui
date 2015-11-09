// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(nodeId) {
    // Hootenanny review validation
    function isHootReview(entity) {
        if(entity.tags['hoot:review:needs']) {
            return true;
        }
        return false;
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
                    // If we are in hoot review mode then do not delete relation
                    // This can happen only during hootenanny POI automerge
                    if(isHootReview(parent) === false){
                       graph = iD.actions.DeleteRelation(parent.id)(graph);
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
