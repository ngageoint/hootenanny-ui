iD.modes.Measure = function(context,item) {
    var mode = {
        id: 'measure'
    };

    var behavior = iD.behavior.Draw(context)
    	.on('click', start)
    	.on('cancel', cancel)
        .on('finish', cancel);

    function start(loc) {
    	console.log(loc);
    	var d = {"type":item.type,"coordinates":loc};
    	
    	var svg = d3.select('.measure-layer').select('svg');
    	
    	var coordinates = context.projection(loc);
	    /*svg.append('circle')
	        .attr('cx', coordinates[0])
	        .attr('cy', coordinates[1])
	        .attr('r', 5)
	        .attr('fill','red');*/
    	
    	var newpt=svg.append('g')
    		.classed('node point',true)
    		.attr('transform','translate('+coordinates[0]+ ',' + coordinates[1] + ')');

    	newpt.append('path')
    		.classed('shadow',true)
    		.attr('transform','translate(-8,-23)')
    		.attr('d','M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
    	
    	newpt.append('path')
			.classed('stroke',true)
			.attr('transform','translate(-8,-23)')
			.attr('d','M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
		
    	newpt.append('use')
    		.classed('icon',true)
    		.attr('transform','translate(-6,-20)')
    		.attr('clip-path','url(#clip-square-12)');
    	
    	
   		context.background().updateMeasureLayer(d);
    	context.enter(iD.modes.Browse(context));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
    	context.uninstall(behavior);
    };
    
    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    return mode;
};
