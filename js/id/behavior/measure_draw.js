var clickTime = null;
iD.behavior.MeasureDraw = function(context,svg) {
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
        line,label,rect,
        lastPoint=null,
        totDist=0,
        segmentDist=0;
    
    function datum() {
        if (d3.event.altKey) return {};
        else return d3.event.target.__data__ || {};
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
 	    	var c = context.projection(context.map().mouseCoordinates());
    	    line.attr("x2", c[0])
    	        .attr("y2", c[1]);
    	    
    	    //place label at midpoint
    	    var x1 = parseFloat(line.attr('x1'));
    	    var x2 = parseFloat(line.attr('x2'));
    	    var y1 = parseFloat(line.attr('y1'));
    	    var y2 = parseFloat(line.attr('y2'));
    	    
    	    var distance = d3.geo.distance(lastPoint,context.map().mouseCoordinates());
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
		        .attr("x", c[0]+10)
		        .attr("y", c[1]+10)
		        .style("fill","white")
		        .style("font-size","18px")
		        .text(function(d) { return totDist.toFixed(2) + " m" });
			
			line = g.append("line")
				.classed("measure-line-"+nodeId,true)
				.style("stroke","white").style("stroke-width","2px").style("stroke-linecap","round")
	    		.attr("x1", c[0])
		        .attr("y1", c[1])
		        .attr("x2", c[0])
		        .attr("y2", c[1]);
			
			svg.selectAll('g').selectAll('rect').remove();
			rect = g.insert("rect",":first-child")
		        .attr("x", c[0])
		        .attr("y", c[1]-(label.dimensions()[1]/2))
		        .attr("width",label.dimensions()[0]+5)
		        .attr("height",label.dimensions()[1]+5)
		        .style("fill","black")
		        .style("fill-opacity","0.5");
		} 
		
		nodeId++;
		    	    	
       /* var d = datum();
        if (d.type === 'way') {
            if(context.enableSnap){
                var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection),
                edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
                event.clickWay(choice.loc, edge);
            } else {
                event.click(context.map().mouseCoordinates());
            }

        } else if (d.type === 'node') {
            
            var isNodeDblClick = false;
            
            if(clickTime){
                isNodeDblClick = ((+new Date() - clickTime) < 500);
            } 
        
            // use user setting for snapping to point which is the default behavior
            if(context.enableSnap){
                isNodeDblClick = context.enableSnap;
            }
            
            if(isNodeDblClick === true){
                event.clickNode(d);
                
            } else {
                event.click(context.map().mouseCoordinates());
            }
            

        } else {
            event.click(context.map().mouseCoordinates());
        }
        
        clickTime = +new Date();*/
    }

  
    function draw(selection) {
        context.install(hover);
        context.install(edit);

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
