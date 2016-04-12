iD.ui.TagCopy = function(tag, context) {
    var tagCopy = {},
        button,
        body;

    tagCopy.button = function(selection) {
        button = selection.selectAll('.tag-reference-button')
            .data([0]);

        var enter = button.enter().append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-reference-button');

        enter.append('span');
        button.selectAll('span')
            .attr('class', 'icon apply light');

        button.on('click', function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var span = button.select('span');
            span.classed('light', !span.classed('light'));

            //Build the tag list and copy to buffer
            var seltags = d3.selectAll('li.tag-row').filter(function() {
                return d3.select(this).selectAll('span.icon.apply:not(.light)').size() === 1;
            }).data().reduce(function(m, d) {
                m[d.key] = d.value;
                return m;
            }, {});
            //console.log(JSON.stringify(seltags));
            context.copyTags(seltags);
        });
    };

    tagCopy.body = function(selection) {
        body = selection.selectAll('.tag-reference-body')
            .data([0]);

        body.enter().append('div')
            .attr('class', 'tag-reference-body cf')
            .style('max-height', '0')
            .style('opacity', '0');
    };

    return tagCopy;
};