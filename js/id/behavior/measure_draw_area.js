var clickTime = null;
iD.behavior.MeasureDrawArea = function(context,svg) {
    var event = d3.dispatch('move', 'click', 'clickWay',
        'clickNode', 'undo', 'cancel', 'finish','dblclick'),
        keybinding = d3.keybinding('draw'),
        hover = iD.behavior.Hover(context)
            .altDisables(true)
            .on('hover', context.ui().sidebar.hover),
        tail = iD.behavior.Tail(),
        edit = iD.behavior.Edit(context),
        closeTolerance = 4,
        tolerance = 12,
        nodeId=0,
        polygon,label,rect,
        points="",
        lastPoint=null,
        totDist=0,
        segmentDist=0;
    
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

            element.on('dblclick',function(){context.enter(iD.modes.Browse(context));});
            
            element.on('mousemove.draw', null);

        d3.select(window).on('mouseup.draw', function() {
            element.on('mousemove.draw', mousemove);
            if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
                (iD.geo.euclideanDistance(pos, point()) < tolerance &&
                (+new Date() - time) < 500)) {

                // Prevent a quick second click
                d3.select(window).on('click.draw-block', function() {
                    d3.event.stopPropagation();
                }, true);

                context.map().dblclickEnable(false);

                window.setTimeout(function() {
                    context.map().dblclickEnable(true);
                    d3.select(window).on('click.draw-block', null);
                }, 500);

                click();
            }
        });
    }

    function mousemove() {
    	var c = context.projection(context.map().mouseCoordinates());
 	    if(nodeId>0){
 	    	polygon.attr("points",points.concat(" " + c.toString()));
 	    	
    	    var distance =d3.geo.distance(lastPoint,context.map().mouseCoordinates());
    	    distance = (distance * 6371007.1809);
    	    segmentDist=distance;
    	    var currentDist = segmentDist+totDist;
    	        	    
    	    label.attr("x", c[0]+10)
	        	.attr("y", c[1]+10)
	        	.text(function(d) { return currentDist.toFixed(2) + " m" });
    	    
    	    rect.attr("x", c[0])
        		.attr("y", c[1]-(label.dimensions()[1]/2))
        		.attr("width",label.dimensions()[0]+5)
		        .attr("height",label.dimensions()[1]+5);
 	    }
    }
    
    function click() {
    	var c = context.projection(context.map().mouseCoordinates());
    	
    	points = points + " " + c;
    	
    	var newpt=svg.append('g')
			.classed('node point',true)
			.attr('id','measure-vertex-'+nodeId)
			.attr('transform','translate('+c[0]+ ',' + c[1] + ')');

		totDist = totDist + segmentDist;
		segmentDist = 0;
    	
		if(nodeId>=0){
			lastPoint=context.map().mouseCoordinates();
			
			label.attr("x", c[0]+10)
		        .attr("y", c[1]+10)
		        .style("fill","white")
		        .style("font-size","18px")
		        .text(function(d) { return totDist.toFixed(2) + " m" });
				
			//rect = g.insert("rect",":first-child")
		      rect.attr("x", c[0])
		        .attr("y", c[1]-(label.dimensions()[1]/2))
		        .attr("width",label.dimensions()[0]+5)
		        .attr("height",label.dimensions()[1]+5)
		        .style("fill","black")
		        .style("fill-opacity","0.5");
			
			lastPoint=context.map().mouseCoordinates();
		} else {
			
		}		
		nodeId++;
    }

  
    function draw(selection) {
        context.install(hover);
        context.install(edit);
        
        //create polygon, label
        var g = svg.append('g');
        polygon = g.append("polygon")
			.classed("measure-area",true)
			.style("stroke","white")
			.style("stroke-width","2px")
			.style("stroke-linecap","round")
			.style("fill","black")
		    .style("fill-opacity","0.3")
			.attr("points","");

        label = g.append("text")
	        .style("fill","white")
	        .style("font-size","18px");
		
		rect = g.insert("rect",":first-child")
	        .style("fill","black")
	        .style("fill-opacity","0.5");
        
        selection
            .on('mousedown.draw', mousedown)
            .on('mousemove.draw', mousemove);

        return draw;
    }

    draw.off = function(selection) {
        context.uninstall(hover);
        context.uninstall(edit);

        selection
            .on('mousedown.draw', null)
            .on('mousemove.draw', null);

        d3.select(window)
            .on('mouseup.draw', null);
    };

    return d3.rebind(draw, event, 'on');
};
