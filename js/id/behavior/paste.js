iD.behavior.Paste = function(context) {
    var keybinding = d3.keybinding('paste');

    function doPaste() {
        d3.event.preventDefault();

        var baseGraph = context.graph(),
            mouse = context.mouse(),
            projection = context.projection,
            viewport = iD.geo.Extent(projection.clipExtent()).polygon();

        if (!iD.geo.pointInPolygon(mouse, viewport)) return;

        var extent = iD.geo.Extent(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            newIDs = [];

        if (!oldIDs.length) return;

        var action = iD.actions.CopyEntities(oldIDs, oldGraph, true);
        context.perform(action);

        var copies = action.copies();
        for (var id in copies) {
            var oldEntity = oldGraph.entity(id),
                newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));
            newIDs.push(newEntity.id);
            context.perform(iD.actions.ChangeTags(newEntity.id, newEntity.tags));
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(iD.actions.Move(newIDs, delta, projection));
        context.enter(iD.modes.Move(context, newIDs, baseGraph));
    }

    function paste() {
        keybinding.on(iD.ui.cmd('⌘V'), doPaste);
        d3.select(document).call(keybinding);
        return paste;
    }

    paste.off = function() {
        d3.select(document).call(keybinding.off);
    };

    return paste;
};
