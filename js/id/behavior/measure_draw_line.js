var clickTime = null;
iD.behavior.MeasureDrawLine = function(context,svg) {
    var event = d3.dispatch('move', 'click','cancel', 'finish','dblclick'),
        keybinding = d3.keybinding('drawline'),
        closeTolerance = 4,
        tolerance = 12,
        nodeId=0,
        line,label,rect,
        lastPoint=null,
        totDist=0,
        segmentDist=0;
    
    function ret(element) {
        //reset variables
    	nodeId=0;
    	lastPoint=null;
        totDist=0;  segmentDist=0;
    	d3.event.preventDefault();
        element.on('dblclick',undefined);
        event.finish();
    }
    
    function radiansToMeters(r) {
        // using WGS84 authalic radius (6371007.1809 m)
        return r * 6371007.1809;
    }
   
    function mousedown() {

        function point() {
            var p = element.node().parentNode;
            return touchId !== null ? d3.touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3.mouse(p);
        }

        var element = d3.select(this),
            touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
            time = +new Date(),
            pos = point();

            element.on('dblclick',function(){
            	ret(element);
            });
                        
            element.on('mousemove.drawline', null);

        d3.select(window).on('mouseup.drawline', function() {
            element.on('mousemove.drawline', mousemove);
            if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
                (iD.geo.euclideanDistance(pos, point()) < tolerance &&
                (+new Date() - time) < 500)) {

                // Prevent a quick second click
                d3.select(window).on('click.drawline-block', function() {
                    d3.event.stopPropagation();
                }, true);

                context.map().dblclickEnable(false);

                window.setTimeout(function() {
                    context.map().dblclickEnable(true);
                    d3.select(window).on('click.drawline-block', null);
                }, 500);

                click();
            }
        });
    }

    function displayLength(m){
        var imperial = context.imperial;
    	
    	var d = m * (imperial ? 3.28084 : 1),
	        p, unit;
	
	    if (imperial) {
	        if (d >= 5280) {
	            d /= 5280;
	            unit = 'mi';
	        } else {
	            unit = 'ft';
	        }
	    } else {
	        if (d >= 1000) {
	            d /= 1000;
	            unit = 'km';
	        } else {
	            unit = 'm';
	        }
	    }
	
	    // drop unnecessary precision
	    p = d > 1000 ? 0 : d > 100 ? 1 : 2;
	
	    var retval = String(d.toFixed(p)) + ' ' + unit;
	    return retval.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    function mousemove() {
    	var c = context.projection(context.map().mouseCoordinates());
        if(nodeId>0){
 	    	
 	    	var c = context.projection(context.map().mouseCoordinates());
    	    line.attr("x2", c[0])
    	        .attr("y2", c[1]);
    	    
    	    var distance = d3.geo.distance(lastPoint,context.map().mouseCoordinates());
    	    distance = radiansToMeters(distance);
    	    segmentDist=distance;
    	    var currentDist = segmentDist+totDist;
    	    
    	    label.attr("x", c[0]+10)
	        	.attr("y", c[1]+10)
	        	.text(function(d) { return displayLength(currentDist) });
    	    
    	    /*rect.attr("x", c[0])
        		.attr("y", c[1]-(label.dimensions()[1]/2))
        		.attr("width",label.dimensions()[0]+10)
		        .attr("height",label.dimensions()[1]+10);*/
 	    }
    }
    
    function click() {
    	var c = context.projection(context.map().mouseCoordinates());
    	
    	var newpt=svg.append('g')
			.classed('node point',true)
			.attr('id','measure-vertex-'+nodeId)
			.attr('transform','translate('+c[0]+ ',' + c[1] + ')');

		totDist = totDist + segmentDist;
		segmentDist = 0;
    	
		if(nodeId>=0){
			lastPoint=context.map().mouseCoordinates();
			var g = svg.append('g');
			
			svg.selectAll('g').selectAll('text').remove();
		    label = g.append("text")
                .classed('measure-label-text',true)
		        .attr("x", c[0]+10)
		        .attr("y", c[1]+10)
		        .style("fill","white")
		        .style("font-size","18px")
		        .text(function(d) { return displayLength(totDist)});
			
			line = g.append("line")
				.classed("measure-line-"+nodeId,true)
				.style("stroke","white").style("stroke-width","2px").style("stroke-linecap","round")
	    		.attr("x1", c[0])
		        .attr("y1", c[1])
		        .attr("x2", c[0])
		        .attr("y2", c[1]);
			
			/*svg.selectAll('g').selectAll('rect').remove();
			rect = g.insert("rect",":first-child")
		        .attr("x", c[0])
		        .attr("y", c[1]-(label.dimensions()[1]/2))
		        .attr("width",label.dimensions()[0]+10)
		        .attr("height",label.dimensions()[1]+10)
		        .style("fill","black")
		        .style("fill-opacity","0.5");*/
		} 
		
		nodeId++;
    }

  
    function drawline(selection) {
        selection
            .on('mousedown.drawline', mousedown)
            .on('mousemove.drawline', mousemove);

        return drawline;
    }

    drawline.off = function(selection) {
    	selection
            .on('mousedown.drawline', null)
            .on('mousemove.drawline', null);

        d3.select(window)
            .on('mouseup.drawline', null);
    };

    return d3.rebind(drawline, event, 'on');
};
