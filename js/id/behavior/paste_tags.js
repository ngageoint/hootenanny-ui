iD.behavior.PasteTags = function(context) {
    var keybindingOverwrite = d3.keybinding('paste_tags_overwrite');
    var keybindingAppend = d3.keybinding('paste_tags_append');

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

    function doPasteTags(/*overwrite*/) {
        d3.event.preventDefault();

        var copyTags = context.copyTags(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            selectedIDs = context.selectedIDs(),
            selectEntity,
            eid, i;

        if (!copyTags && !oldIDs.length) return;

        //console.log(selectedIDs);
        for (eid in selectedIDs) {
            selectEntity = oldGraph.entity(selectedIDs[eid]);
            if (copyTags) { //use copied tags
                selectEntity = selectEntity.mergeTags(_.omit(copyTags, omitTag), d3.event.shiftKey /*overwrite*/);
            } else { //use copied features
                for (i = 0; i < oldIDs.length; i++) {
                    var oldEntity = oldGraph.entity(oldIDs[i]);
                    selectEntity = selectEntity.mergeTags(_.omit(oldEntity.tags, omitTag), d3.event.shiftKey /*overwrite*/);
                }
            }
            context.perform(iD.actions.ChangeTags(selectEntity.id, selectEntity.tags),
                            t('operations.change_tags.annotation'));
        }
        context.enter(iD.modes.Select(context, selectedIDs));
    }

    function pasteTags() {
        keybindingOverwrite.on(iD.ui.cmd('⌘⇧V'), doPasteTags);
        d3.select(document).call(keybindingOverwrite);
        keybindingAppend.on(iD.ui.cmd('⌘⌥V'), doPasteTags);
        d3.select(document).call(keybindingAppend);
        return pasteTags;
    }

    pasteTags.off = function() {
        d3.select(document).call(keybindingOverwrite.off);
        d3.select(document).call(keybindingAppend.off);
    };

    return pasteTags;
};
