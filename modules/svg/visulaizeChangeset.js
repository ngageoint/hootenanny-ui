import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { services } from '../services/index';

export function svgVisualizeChangeset( projection, context, dispatch ) {
    var throttleRedraw = _throttle( function() { dispatch.call('change'); }, 1000 );
    var layer = d3_select(null);
    var _visualizeChangeset;
    var oscService = services;

    function init() {
        if (svgVisualizeChangeset.initialized) return;
        svgVisualizeChangeset.enabled = false;
        svgVisualizeChangeset.initialized = true;
    }

    function getService() {
        if (oscService.oscChangeset && !_visualizeChangeset) {
            _visualizeChangeset = oscService.oscChangeset;
            console.log( _visualizeChangeset );
            //_visualizeChangeset.event.on('visualize-changeset');
        } else if (!services.oscChangeset && _visualizeChangeset) {
            _visualizeChangeset = null;
        }
        return _visualizeChangeset;
    }

    function showLayer() {
        var service = getService();
        if (!service) return;

        service.oscChangeset.loadViewer(context);
    }

    function hideLayer() {
        throttleRedraw.cancel();
    }

    function update() {
        var service = getService();
        var data = (service ? services.entities() : [] );
    }

    function drawChangeset(selection) {
        var enabled = svgVisualizeChangeset.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-visualize-changeset')
            .data( service ? [0] : [] );

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-visualize-changeset')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);
    }

    drawChangeset.enabled = function(_) {
        if (!arguments.length) return svgVisualizeChangeset.enabled;
        svgVisualizeChangeset.enabled = _;
        if (svgVisualizeChangeset.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };

    init();
    return drawChangeset;

}