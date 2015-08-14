iD.modes.MeasureAddArea = function(context) {
    var mode = {
        id: 'measure-add-area'
    };

    var svg = d3.select('.measure-layer').select('svg');
    var id = 0;
    
    
    var behavior = iD.behavior.MeasureDraw(context,svg,'area');
    d3.select('.measure-layer').selectAll('g').remove();
    
    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
    	context.uninstall(behavior);
    };

    return mode;
};
