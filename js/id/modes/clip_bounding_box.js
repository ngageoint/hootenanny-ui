iD.modes.ClipBoundingBox = function(context) {
    var mode = {
        id: 'clip-bounding-box',
        key: '8'
    };

   d3.select('.measure-layer').selectAll('g').remove();

    var svg = d3.select('.measure-layer').select('svg');

    var behavior = iD.behavior.Clip(context,svg,'bbox')
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
        d3.select('.measure-layer').selectAll('g').remove();
        context.map().dblclickEnable(true);
        context.uninstall(behavior);
    };

    return mode;
};
