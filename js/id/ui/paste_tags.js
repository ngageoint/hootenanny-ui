iD.ui.PasteTags = function(context) {
    var commands = [{
        id: 'overwrite',
        icon: 'paste-tags-overwrite',
        cmd: iD.ui.cmd('⌘⇧V'),
        action: function() { doPasteTags(true); },
        annotation: function() { return 'Overwrite Tags'; }
    }, {
        id: 'append',
        icon: 'paste-tags-append',
        cmd: iD.ui.cmd('⌘⌥V'),
        action: function() { doPasteTags(false); },
        annotation: function() { return 'Append Tags'; }
    }];

    function hasCopy() {
        return context.copyIDs().length || Object.keys(context.copyTags()).length;
    }

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

    function doPasteTags(overwrite) {
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
            if (Object.keys(copyTags).length > 0) { //use copied tags
                selectEntity = selectEntity.mergeTags(_.omit(copyTags, omitTag), d3.event.shiftKey || overwrite);
            } else { //use copied features
                for (i = 0; i < oldIDs.length; i++) {
                    var oldEntity = oldGraph.entity(oldIDs[i]);
                    selectEntity = selectEntity.mergeTags(_.omit(oldEntity.tags, omitTag), d3.event.shiftKey || overwrite);
                }
            }
            context.perform(iD.actions.ChangeTags(selectEntity.id, selectEntity.tags),
                            t('operations.change_tags.annotation'));
        }
        context.enter(iD.modes.Select(context, selectedIDs));
    }

    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(t(d.id + '.tooltip'), d.cmd);
            });

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter().append('button')
            .attr('class', 'col6 disabled')
            .on('click', function(d) { return d.action(); })
            .call(tooltip);

        buttons.each(function(d) {
            d3.select(this)
                .call(iD.svg.Icon('#icon-' + d.icon));
        });

        var keybinding = d3.keybinding('paste_tags')
            .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

        d3.select(document)
            .call(keybinding);

        context
            .on('enter.paste_tags', update);

        function update(mode) {
            //Disable paste tags if there are no features or tags copied
            //or if there is no feature(s) selected
            var disabled = !hasCopy() || !( (mode.id === 'select') && mode.selectedIDs().length );

            buttons
                .property('disabled', disabled)
                .classed('disabled', disabled)
                .each(function() {
                    var selection = d3.select(this);
                    if (selection.property('tooltipVisible')) {
                        selection.call(tooltip.show);
                    }
                });
        }
    };
};
