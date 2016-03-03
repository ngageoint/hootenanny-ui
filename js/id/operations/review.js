iD.operations.Review = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection);

    var operation = function() {
        var annotation = 'Show review relations for this feature';
        //context.perform(action, annotation);
        _performHighlight(context.graph());
    };

    operation.available = function() {
        return context.hoot().control.conflicts.isConflictReviewExist();
    };

    operation.disabled = function() {
        
        return false;
    };

    operation.tooltip = function() {
        return 'Show review relations for this feature';
    };

    var _performHighlight = function(graph) {
        var feature = context.hasEntity(entityId);

        var multiLines = [];
        graph.parentRelations(feature)
            .forEach(function(parent) {
                _.each(parent.members, function(mem){
                    var mid = mem.id;

                    var mFeature = context.hasEntity(mid);
                    if(mFeature && (entityId != mid)) {
                        var coord = [ feature.loc, mFeature.loc];
                        multiLines.push(coord);
                    }
                        
                });
            });

        _loadArrow('', multiLines);
    }

    var _loadArrow = function(mode, multiLines) {
        //if (d3.event) d3.event.preventDefault();
        if(!context.graph()){
            
            return;
        }
        
        var gj = {
            "type": "MultiLineString",
            "coordinates": multiLines
        };
        if (mode === 'remove') gj = {};
        context.background().updateArrowLayer(gj);

    }

    operation.id = 'review';
    operation.keys = ['R'];
    operation.title = 'Review';

    return operation;
};
