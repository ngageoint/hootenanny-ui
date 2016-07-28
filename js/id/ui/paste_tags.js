iD.ui.PasteTags = function(context) {
    var commands = [{
        id: 'overwrite',
        icon: 'minus',
        cmd: iD.ui.cmd('⌘⇧V'),
        action: function() { window.console.log('overwrite'); },
        annotation: function() { return 'Overwrite Tags'; }
    }, {
        id: 'append',
        icon: 'plus',
        cmd: iD.ui.cmd('⌘⌥V'),
        action: function() { window.console.log('append'); },
        annotation: function() { return 'Append Tags'; }
    }];

    function hasCopy() {
        return context.copyIDs().length || Object.keys(context.copyTags()).length;
    }

    return function(selection) {
        var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(t(d.id + '.tooltip'));
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

        var keybinding = d3.keybinding('undo')
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
