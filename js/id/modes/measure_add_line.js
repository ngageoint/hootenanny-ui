iD.modes.MeasureAddLine = function(context) {
    var mode = {
        id: 'measure-add-line',
        key: '6'
    };

    var svg = d3.select('.measure-layer').select('svg');

    var behavior = iD.behavior.MeasureDrawLine(context,svg,'line')
        .on('finish',finish);

    d3.select('.measure-layer').selectAll('g').remove();

    function finish() {
        d3.event.stopPropagation();
        context.enter(iD.modes.Browse(context));
    }

    mode.enter = function() {
        d3.select('.measure-layer').selectAll('g').remove();
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
};
