import _debounce from 'lodash-es/debounce';
import _isEmpty from 'lodash-es/isEmpty';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/index';


export function uiNotice(context) {

    return function(selection) {
        var div = selection
            .append('div')
            .attr('class', 'notice');

        var button = div
            .append('button')
            .attr('class', 'zoom-to notice fillD')
            .on('click', function() {
                context.map().zoomEase(context.minEditableZoom());
            })
            .on('wheel', function(d3_event) {   // let wheel events pass through #4482
                var e2 = new WheelEvent(d3_event.type, d3_event);
                context.surface().node().dispatchEvent(e2);
            });

        button
            .call(svgIcon('#iD-icon-plus', 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .call(t.append('zoom_in_edit'));


        function disableTooHigh() {
            var noLayers = _isEmpty(Hoot.layers.loadedLayers);
            var tooHigh = context.map().zoom() < context.minEditableZoom();
            var tooManyNodes = context.map().tooManyNodes();
            var canEdit = !tooHigh && !tooManyNodes && !noLayers;
            div.style('display', canEdit ? 'none' : 'block');
            button.on('click', function() {
                if (noLayers) {
                    context.map().addDataset();
                } else {
                    context.map().zoomEase(16); //upstream min editable zoom
                }
            });
            button.select('span')
                .text(noLayers ? t('add_dataset_edit') : t('zoom_in_edit'));
        }

        context.map()
            .on('move.notice', _debounce(disableTooHigh, 500));

        context.map()
            .on('toomanynodes', _debounce(disableTooHigh, 500));

        Hoot.events.listen( 'notice', 'loaded-layer-removed', disableTooHigh );


        disableTooHigh();
    };
}
