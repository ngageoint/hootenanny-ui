import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import { drag as d3_drag } from 'd3-drag';
import { utilRebind } from '../util/rebind';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { tooltip } from '../util/tooltip';

export function uiSlider(context) {
    var event = d3_dispatch('change');

    function slider(div, callback, hidden, cls, title) {
        var sld = div
            .attr('id', 'transparency-slider-'+cls)
            .classed('hide', hidden)
            .call(tooltip()
                 .title('Adjust ' + title + ' Opacity')
                 .placement('bottom'));

        var drag = d3_drag()
            .subject(Object)
            .on('drag', dragMove);

        var svg = sld.selectAll('svg')
            .data([0])
            .enter()
            .append('svg');

        var sliderData = [{x: 100, y : 20}];

        var g = svg.selectAll('g')
            .data(sliderData)
            .enter()
            .append('g')
            .attr('height', 200)
            .attr('width', 100);

        g.append('rect')
            .attr('width', 100)
            .attr('height', 12)
            .attr('y', 14)
            .attr('fill', '#c0c0c0')
            .attr('rx', 3)
            .attr('ry', 3);

        g.append('circle')
            .attr('r', 8)
            .attr('cy', function(d) { return d.y; })
            .attr('fill', '#7092ff')
            .call(drag);

        g.select('circle')
            .attr('cx', function(d) { return d.x; });

        var label = g.append('text')
            .attr('x', 110)
            .attr('y', 20)
            .text(function(d) { return d.x + '%';});

        function dragMove(d) {
            var range = Math.max(0, Math.min(100, d3_event.x));
            d3_select(this)
                .attr('cx', d.x = range)
                .attr('cy', d.y = 20);
            label.text(range + '%');
            callback(range);
        }
    }

    return utilRebind(slider, event, 'on');
}
