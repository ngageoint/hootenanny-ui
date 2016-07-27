iD.ui.PasteTags = function(context) {
    var commands = [{
        id: 'overwrite',
        cmd: iD.ui.cmd('⌘⇧V'),
        action: function() { window.console.log('overwrite'); },
        annotation: function() { return 'Overwrite Tags'; }
    }, {
        id: 'append',
        cmd: iD.ui.cmd('⌘⌥V'),
        action: function() { window.console.log('append'); },
        annotation: function() { return 'Append Tags'; }
    }];

    function hasCopy() {
        return context.copyIDs() || context.copyTags();
    }

    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(d.annotation() ?
                    t(d.id + '.tooltip', {action: d.annotation()}) :
                    t(d.id + '.nothing'), d.cmd);
            });

        var buttons = selection.selectAll('button')
            .data(commands)
            .enter().append('button')
            .attr('class', 'col6 disabled')
            .on('click', function(d) { return d.action(); })
            .call(tooltip);

        buttons.each(function(d) {
            d3.select(this)
                .call(iD.svg.Icon('#icon-' + d.id));
        });

        var keybinding = d3.keybinding('undo')
            .on(commands[0].cmd, function() { d3.event.preventDefault(); commands[0].action(); })
            .on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

        d3.select(document)
            .call(keybinding);

        context
            .on('copy.paste_tags', update);

        function update() {
            // if(!context.history().hasChanges()){
            //     if(context.hoot().control.conflicts){
            //         context.hoot().control.conflicts.actions.poimerge.updateMergeButton();
            //     }

            // }

            buttons
                .property('disabled', hasCopy())
                .classed('disabled', function(d) { return !d.annotation(); })
                .each(function() {
                    var selection = d3.select(this);
                    if (selection.property('tooltipVisible')) {
                        selection.call(tooltip.show);
                    }
                });
        }
    };
};
