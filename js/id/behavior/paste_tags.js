iD.behavior.PasteTags = function(context) {
    var keybinding = d3.keybinding('paste_tags');

    function omitTag(v, k) {
        return (
//Paste all tags for now, they will overwrite existing tags
//            k === 'phone' ||
//            k === 'fax' ||
//            k === 'email' ||
//            k === 'website' ||
//            k === 'url' ||
//            k === 'note' ||
//            k === 'description' ||
//            k.indexOf('name') !== -1 ||
//            k.indexOf('wiki') === 0 ||
//            k.indexOf('addr:') === 0 ||
//            k.indexOf('contact:') === 0 ||
            //For Hoot
            k.indexOf('hoot') === 0 ||
            k === 'error:circular' ||
            k === 'source:datetime' ||
            k === 'source:ingest:datetime' ||
            k === 'uuid'

        );
    }

    function doPasteTags() {
        d3.event.preventDefault();

        var oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            selectedIDs = context.selectedIDs(),
            selectEntity,
            eid, i;

        if (!oldIDs.length) return;

        //console.log(selectedIDs);
        for (eid in selectedIDs) {
            selectEntity = oldGraph.entity(selectedIDs[eid]);
            for (i = 0; i < oldIDs.length; i++) {
                var oldEntity = oldGraph.entity(oldIDs[i]);

                //console.log(_.omit(oldEntity.tags, omitTag));
                selectEntity = selectEntity.mergeTags(_.omit(oldEntity.tags, omitTag), true/*overwrite*/);
            }
            context.perform(iD.actions.ChangeTags(selectEntity.id, selectEntity.tags),
                            t('operations.change_tags.annotation'));
        }
        context.enter(iD.modes.Select(context, selectedIDs));
    }

    function pasteTags() {
        keybinding.on(iD.ui.cmd('⌘⇧V'), doPasteTags);
        d3.select(document).call(keybinding);
        return pasteTags;
    }

    pasteTags.off = function() {
        d3.select(document).call(keybinding.off);
    };

    return pasteTags;
};
