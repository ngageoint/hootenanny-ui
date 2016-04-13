iD.actions.Review = function(ids) {


    var action = function(graph) {
        _performHighlight(graph);
        return graph;
    };

    action.disabled = function(graph) {

        return 'not_review';
    };


    var _performHighlight = function(graph) {
        var feature = graph.entity(ids);

        graph.parentRelations(feature)
            .forEach(function(parent) {
                _.each(parent.members, function(mem){
                    var mid = mem.id;

                    var mFeature = graph.entity(mid);
                    if(mFeature) {
                   
                    }
                        
                });
            });
    }

    return action;
};
