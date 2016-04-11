iD.operations.Toggle = function(selectedIDs, context) {

    function operation() {
        context.hoot().model.layers.layerSwap();
    }

    operation.available = function() {
        var mergedLayer = context.hoot().model.layers.getMergedLayer();
        return mergedLayer.length > 0;
    };

    operation.disabled = function() {
        var reason;
        var mergedLayer = context.hoot().model.layers.getMergedLayer();

        if (mergedLayer.length <= 0) {
            reason = 'no merged layer available';
        }
        return false || reason;
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.toggle.' + disable) :
            t('operations.toggle.description');
    };

    operation.id = 'toggle';
    operation.keys = [t('operations.toggle.key')];
    operation.title = t('operations.toggle.title');

    return operation;
};
