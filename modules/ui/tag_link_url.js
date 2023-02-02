/* eslint-disable no-undef */
import {
    select as d3_select
} from 'd3-selection';
import { svgIcon } from '../svg';
import { t } from '../util/locale';

export function uiTagLinkUrl(tag) {
    var tagLinkUrl = {};
    var _button = d3_select(null);
    var _showing;
    var _body = d3.select(null);

    function hide() {
        _body
            .transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0')
            .on('end', function () {
                _body.classed('expanded', false);
            });

        _showing = false;
    }

    tagLinkUrl.button = function(selection) {
        _button = selection.selectAll('.tag-reference-button')
            .data([0]);

        _button = _button.enter()
            .append('button')
            .attr('class', 'tag-reference-button')
            .attr('tabindex', -1)
            .merge(_button);

        _button
            .attr('title', t('icons.open_link'))
            .call(svgIcon('#iD-icon-out-link', 'smaller'))
            .on('click', function (d3_event) {
                d3_event.stopPropagation();
                d3_event.preventDefault();

                window.open(tag.url, '_blank');

            });
    };

    tagLinkUrl.body = function(selection) {
        var tagid = tag.url;
        _body = selection.selectAll('.tag-reference-body')
            .data([tagid], function(d) { return d; });

        _body.exit()
            .remove();

        _body = _body.enter()
            .append('div')
            .attr('class', 'tag-reference-body cf')
            .style('max-height', '0')
            .style('opacity', '0')
            .merge(_body);

        if (_showing === false) {
            hide();
        }
    };

    tagLinkUrl.showing = function(_) {
        if (!arguments.length) return _showing;
        _showing = _;
        return tagLinkUrl;
    };

    return tagLinkUrl;
}