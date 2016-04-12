iD.modes.MeasureAddArea = function(context) {
    var mode = {
        id: 'measure-add-area',
        key: '7'
    };

    d3.select('.measure-layer').selectAll('g').remove();

    var svg = d3.select('.measure-layer').select('svg');

    var behavior = iD.behavior.MeasureDrawArea(context,svg)
    .on('finish',finish);

    function finish() {
        d3.event.stopPropagation();
        context.enter(iD.modes.Browse(context));
    }

    mode.enter = function() {
        d3.select('.measure-layer').selectAll('g').remove();
        context.install(behavior);
    };

    mode.exit = function() {
        context.map().dblclickEnable(true);
        context.uninstall(behavior);
    };

    return mode;
};
