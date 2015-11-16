iD.modes.ClipBoundingBox = function(context) {
    var mode = {
        id: 'clip-bounding-box'
    };

   d3.select('.measure-layer').selectAll('g').remove();
    
    var svg = d3.select('.measure-layer').select('svg');
    var id = 0;
    
    var behavior = iD.behavior.Clip(context,svg,'bbox')
    .on('finish',finish);
        
    function finish() {
        d3.event.stopPropagation();
        context.enter(iD.modes.Browse(context));
    }
    
    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
    	context.map().dblclickEnable(true);
    	context.uninstall(behavior);
    };

    return mode;
};
