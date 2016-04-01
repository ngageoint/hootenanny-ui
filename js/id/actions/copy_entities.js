iD.actions.CopyEntities = function(ids, fromGraph, deep) {
    var copies = {};

    var action = function(graph) {
        ids.forEach(function(id) {
            fromGraph.entity(id).copy(deep, fromGraph, copies);
        });

        for (var id in copies) {
            graph = graph.replace(copies[id]);
        }

        return graph;
    };

    action.copies = function() {
        return copies;
    };

    return action;
};
