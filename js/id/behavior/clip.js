var clickTime = null;
iD.behavior.Clip = function(context,svg,type) {
	 var event = d3.dispatch('move', 'click','cancel', 'finish','dblclick'),
     keybinding = d3.keybinding('cliparea'),
     closeTolerance = 4,
     tolerance = 12,
     nodeId=0,
     rect,anchorPt,
     lastPoint=null,firstPoint=null;
 
 function ret(element) {
     d3.event.preventDefault();
     element.on('dblclick',undefined);
     event.finish();
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
         
         element.on('mousemove.cliparea', null);

     d3.select(window).on('mouseup.cliparea', function() {
         element.on('mousemove.cliparea', mousemove);
         if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
             (iD.geo.euclideanDistance(pos, point()) < tolerance &&
             (+new Date() - time) < 500)) {

             // Prevent a quick second click
             d3.select(window).on('click.cliparea-block', function() {
                 d3.event.stopPropagation();
             }, true);

             context.map().dblclickEnable(false);

             window.setTimeout(function() {
                 context.map().dblclickEnable(true);
                 d3.select(window).on('click.cliparea-block', null);
             }, 500);

             click();
         }
     });
 }


 function mousemove() {
 	var c = context.projection(context.map().mouseCoordinates());
 	 	
	    if(nodeId>0){
	    	var x = parseFloat(rect.attr('x')),
	    		y = parseFloat(rect.attr('y'));
	    	
	    	var width = Math.abs(c[0]-anchorPt[0]), 
	    	height = Math.abs(c[1]-anchorPt[1]);
	    	
	    	if(c[0]<anchorPt[0]){
	    		rect.attr('x',c[0]);
	    	} else {
	    		rect.attr('x',anchorPt[0]);
	    	}
	    	
	    	if(c[1]<anchorPt[1]){
	    		rect.attr('y',c[1]);
	    	} else {
	    		rect.attr('y',anchorPt[1]);
	    	}
	    	
	    	rect.attr('width',width).attr('height',height);
	    }
 }
 
 function click() {
 	var c = context.projection(context.map().mouseCoordinates());
 	 	
 	if(nodeId==0){
 		anchorPt = c;
 		rect.attr("x",c[0]).attr("y",c[1]);
 	}
 	else{
 		var clip2bbox = window.confirm("Do you want to clip to this bounding box?");
 		if(clip2bbox){
    		if(!_.isEmpty(hoot.model.layers.getLayers())){
        		//var params = [];
    			//Provide input ID(s) of dataset(s)
    			_.each(hoot.model.layers.getLayers(),function(d){
    				var param = {};
    				param.INPUT_NAME = d.name;
    				
    				//create name, ensuring it is unique
    				var uniquename = false;
    				var name = d.name + '_clip';
    				var i = 1;
    				while (uniquename==false){
    					if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == name}))){
    						name = d.name + '_clip_' + i.toString();
    						i++;
    					} else {
    						uniquename = true;
    					}
    				}
    				param.OUTPUT_NAME = name;
    				
    				var bboxPt1 = context.projection.invert([parseFloat(rect.attr('x')),parseFloat(rect.attr('y'))]).toString();
    				var bboxPt2 = context.projection.invert([parseFloat(rect.attr('x'))+parseFloat(rect.attr('width')),parseFloat(rect.attr('y'))+parseFloat(rect.attr('height'))]).toString();
    				param.BBOX = bboxPt1.concat(',',bboxPt2);
          			
    				Hoot.model.REST('clipDataset', param, function (a,outputname) {
                    	if(a.status=='complete'){iD.ui.Alert("Success: " + outputname + " has been created!",'success');}
                    });
    			});
    		}
 		}
 		ret(d3.select("#surface"));
 	}
 	    	
	nodeId++;
 }


 function cliparea(selection) {
     //create rect
     var g = svg.append('g');
     rect = g.append("rect")
			.classed("measure-area",true)
			.style("stroke","white")
			.style("stroke-width","2px")
			.style("stroke-linecap","round")
			.style("fill","black")
		    .style("fill-opacity","0.3")
		    .attr("x",0)
		    .attr("y",0)
		    .attr("width","0")
		    .attr("height","0");
         
     selection
         .on('mousedown.cliparea', mousedown)
         .on('mousemove.cliparea', mousemove);

     return cliparea;
 }

 cliparea.off = function(selection) {
     selection
         .on('mousedown.cliparea', null)
         .on('mousemove.cliparea', null);

     d3.select(window)
         .on('mouseup.cliparea', null);
 };

 return d3.rebind(cliparea, event, 'on');
};
