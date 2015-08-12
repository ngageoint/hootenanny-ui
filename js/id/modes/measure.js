iD.modes.Measure = function(context,item) {
    var mode = {
        id: 'measure'
    };

    item = item;
    
    var behavior = iD.behavior.Draw(context,item)
    	.on('click', start)
    	.on('cancel', cancel)
        .on('finish', cancel);

    function start(loc) {
    	d3.select('.measure-layer').selectAll('g').remove();
    	
    	console.log(loc);
    	var d = {"type":item.type,"coordinates":loc};
    	var svg = d3.select('.measure-layer').select('svg');
    	var coordinates = context.projection(loc);
    	
    	if(item.type=='point'){
    		addNewPoint(svg,coordinates,0);
        	context.background().updateMeasureLayer(d);
        	context.enter(iD.modes.Browse(context));
    	} else if(item.type=='line'){
    		addNewLine(svg,coordinates,0);
    		context.enter(iD.modes.Browse(context));
    	}
    }
    
    function md(loc){
    	console.log(loc);
    }
    
    function mu(loc){
    	console.log(loc);
    }
    
    function addNewPoint(svg,c,id){
    	var newpt=svg.append('g')
			.classed('node point',true)
			.attr('id','measure-vertex-'+id)
			.attr('transform','translate('+c[0]+ ',' + c[1] + ')');
	
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
    	}
    
    function addNewLine(svg,c,id){
    	var line;
    	var vertexIdx = 0;
    	
    	var c = context.projection(context.map().mouseCoordinates());
		line = svg.append("line")
			.style("stroke","red").style("stroke-width","2px").style("stroke-linecap","round")
    		.attr("x1", c[0])
	        .attr("y1", c[1])
	        .attr("x2", c[0])
	        .attr("y2", c[1]);
		d3.select('#id-container').on('mousemove',mousemove);

    	d3.select('#id-container').on("mousedown",mousedown)
			.on("mouseup",mouseup);
		
    	function mousedown(){
    		var c = context.projection(context.map().mouseCoordinates());
    	    line.attr("x2", c[0])
    	        .attr("y2", c[1]);
    	    addNewPoint(svg,c,1);
    	}
    	
    	function mouseup(){
    		d3.select('#id-container').on('mousedown',undefined)
    			.on('mousemove',undefined)
    			.on('mouseup',undefined);
    		//context.background().updateMeasureLayer(d);
        	context.enter(iD.modes.Browse(context));
    	}
    	
    	function mousemove() {
    	    var c = context.projection(context.map().mouseCoordinates());
    	    line.attr("x2", c[0])
    	        .attr("y2", c[1]);
    	}
    	
    	var newpt=svg.append('g')
			.classed('node point',true)
			.attr('id','measure-vertex-'+id)
			.attr('transform','translate('+c[0]+ ',' + c[1] + ')');
	
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
