iD.operations.Gotoreview = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection);

    var operation = function() {
        var annotation = 'Goto related review item';
    };

    operation.available = function() {
        return context.hoot().control.conflicts.isConflictReviewExist();
    };

    operation.disabled = function() {
        
        return false;
    };

    operation.tooltip = function() {
        return 'Goto related review item.';
    };

    

    operation.id = 'gotoreview';
    operation.keys = ['G'];
    operation.title = 'Goto Review';

    return operation;
};
