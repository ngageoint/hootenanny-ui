iD.modes.MeasureAddLine = function(context) {
    var mode = {
        id: 'measure-add-line'
    };

    var svg = d3.select('.measure-layer').select('svg');
    var id = 0;
    
    
    var behavior = iD.behavior.MeasureDrawLine(context,svg,'line')
    	.on('finish',finish);
    
    d3.select('.measure-layer').selectAll('g').remove();
    
    function finish() {
        d3.event.stopPropagation();
        context.enter(iD.modes.Browse(context));
    }
    
    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
    	context.uninstall(behavior);
    };

    return mode;
};
