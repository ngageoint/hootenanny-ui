Hoot.control.utilities.folder = function(context) {

	var hoot_control_utilities_folder = {};

    hoot_control_utilities_folder.createFolderTree = function(container) {
    	// http://bl.ocks.org/mbostock/1093025 - Collapsible Indented Tree
    	    	
    	//var folders = context.hoot().model.layers.getAvailLayersWithFolders();
    	var folders = context.hoot().model.folders.getAvailFoldersWithLayers();
    	folders= JSON.parse('{"name":"Datasets","id":"Datasets","children":' + JSON.stringify(folders) +'}');
	
    	var margin = {top: 10, right: 20, bottom: 30, left: 0},
	        width = '100%',
	        height = '100%',
	        barHeight = 20,
	        barWidth = 100;
    	
    	var x = d3.scale.linear()
	    	.domain([0, 0])
	    	.range([0, 0]);
	
	    var y = d3.scale.linear()
	    	.domain([0, 10])
	    	.range([20, 0]);
	    
	    var zoom = d3.behavior.zoom()
			.scaleExtent([1, 2])
			.x(x)
			.y(y)
			.on("zoom", zoomed);
    	
	    var i = 0,
	        duration = 400,
	        root;
	
	    var tree = d3.layout.tree()
	        .nodeSize([0, 20]);
	
	    var diagonal = d3.svg.diagonal()
	        .projection(function(d) { return [d.y, d.x]; });
	
	    var svg = container.append("svg")
	        .attr("width", width)// + margin.left + margin.right)
	        .attr("height", height)// + margin.left + margin.right)
	      .append("g")
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	        .call(zoom);
	   
		folders.x0=0;
		folders.y0=0;
		update(root=folders);
		
		function zoomed() {
			var svgHt = svg.node().getBoundingClientRect().width; 
			var rectHt = 20*(svg.selectAll('rect')[0].length-1);
			var tx = 0,
				ty = Math.min(10, Math.max(-rectHt,rectHt-svgHt,  d3.event.translate[1]));
			zoom.translate([tx, ty]);
			svg.attr("transform", "translate(" + [tx,ty] + ")scale(" + d3.event.scale + ")");
		}
	
	    function update(source) {
	
	      // Compute the flattened node list. TODO use d3.layout.hierarchy.
	      var nodes = tree.nodes(root);
	
	      var height = Math.max(400, nodes.length * barHeight + margin.top + margin.bottom);
	
	      d3.select("svg").transition()
	          .duration(duration)
	          .attr("height", height);
	
	      d3.select(self.frameElement).transition()
	          .duration(duration)
	          .style("height", height + "px");
	
	      // Compute the "layout".
	      nodes.forEach(function(n, i) {
	        n.x = i * barHeight;
	      });
	
	      // Update the nodes…
	      var node = svg.selectAll("g.node")
	          .data(nodes, function(d) {
	        	  if(d.type){return d.type.charAt(0) + d.id || d.id || (d.id = ++i);}
	        	  else{return d.id || (d.id = ++i);}
	        	  });
	
	      var nodeEnter = node.enter().append("g")
	          .attr("class", "node")
	          .attr("transform", function(d) { return "translate(" + 0 + "," + source.x0 + ")"; })
	          .style("opacity", 1e-6);
	      	      
	      // Enter any new nodes at the parent's previous position.
	      nodeEnter.append("rect")
	          .attr("y", -barHeight / 2)
	          .attr("height", barHeight)
	          .attr("width", function(d){
	        	  return '100%';})
	          .style("fill", color)
	          .attr("class", rectClass)
	          .on("click", click);
	          
	      nodeEnter.append("text")
	          .attr("dy", 3.5)
	          .attr("dx", function(d){
	        	  if(d.type){return  25.5+(11*d.depth);}
	        	  else{return 11*d.depth;}})	//5.5
	          .text(function(d) { return d.name; })
	          .each(function(d){
	        	  var rectNode = d3.select(this);
	        	  if(d.type=='dataset'){
	        		  rectNode.attr('lyr-id',function(d){return d.id;})
	        	 } else if (d.type=='folder'){
	        		 rectNode.attr('fldr-id',function(d){return d.id;})
	        	 }
	          });
	          //.attr('lyr-id',function(d){return d.id;})
            
	      nodeEnter.append("g")
	      	  .append('svg:foreignObject')
		      .attr("width", 20)
		      .attr("height", 20)
		      .attr("transform", function(d) { 
		    	  var dy=5.5+(11*d.depth);
		    	  return "translate("+ dy +",-11)"; })
		      .html(function(d){
		    	  if (d.type == 'folder'){return '<i class="_icon folder"></i>'}
		      });
	      
	      // Transition nodes to their new position.
	      nodeEnter.transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + d.x + ")"; })
	          .style("opacity", 1);
	
	      node.transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + d.x + ")"; })
	          .style("opacity", 1)
	        .select("rect")
	          .style("fill", color)
	          .attr("class", rectClass);
	
	      // Transition exiting nodes to the parent's new position.
	      node.exit().transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + source.x + ")"; })
	          .style("opacity", 1e-6)
	          .remove();
	
	      // Update the links…
	      var link = svg.selectAll("path.link")
	          .data(tree.links(nodes), function(d) { return d.target.id; });
	
	      // Enter any new links at the parent's previous position.
	      link.enter().insert("path", "g")
	          .attr("class", "link")
	          .attr("d", function(d) {
	            var o = {x: source.x0, y: source.y0};
	            return diagonal({source: o, target: o});
	          })
	        .transition()
	          .duration(duration)
	          .attr("d", diagonal);
	
	      // Transition links to their new position.
	      link.transition()
	          .duration(duration)
	          .attr("d", diagonal);
	
	      // Transition exiting nodes to the parent's new position.
	      link.exit().transition()
	          .duration(duration)
	          .attr("d", function(d) {
	            var o = {x: source.x, y: source.y};
	            return diagonal({source: o, target: o});
	          })
	          .remove();
	
	      // Stash the old positions for transition.
	      nodes.forEach(function(d) {
	        d.x0 = d.x;
	        d.y0 = d.y;
	      });

	      if(container.attr('id')=='datasettable'){
	    	  container.selectAll('rect').on("contextmenu",function(d,i){
	              var items = [];
	    		  if(!isNaN(parseInt(d.id))){
	            	  //http://jsfiddle.net/1mo3vmja/2/
	            	  items = [
		        	      {title:'Export',icon:'export',click:'context.hoot().view.utilities.dataset.exportDataset(d,container)'},
		        	      {title:'Delete',icon:'trash',click:'context.hoot().view.utilities.dataset.deleteDataset(d,container)'},
		        	      {title:'Modify',icon:'info',click:'context.hoot().view.utilities.dataset.modifyDataset(d)'},
		        	  ]; } else if (d.id != 'Datasets') {
	        		  items = [
	 		        	      {title:'Delete',icon:'trash',click:'context.hoot().view.utilities.dataset.deleteDataset(d,container)'},
	 		        	      {title:'Modify',icon:'info',click:'context.hoot().view.utilities.dataset.modifyDataset(d)'},
	 		        	  ];
		        	  } else {
		        		  d3.select('.context-menu').style('display', 'none');	              
			              d3.event.preventDefault();
			              return;
		        	  }
		        	  
		        	  // create the div element that will hold the context menu
		              d3.selectAll('.context-menu').data([1])
		              	.enter()
		                .append('div')
		                .attr('class', 'context-menu');
		              // close menu
		              d3.select('body').on('click.context-menu', function() {d3.select('.context-menu').style('display', 'none');});
		              // this gets executed when a contextmenu event occurs
		              d3.selectAll('.context-menu')
		              	.html('')
		                .append('ul')
		                .selectAll('li')
		                .data(items).enter()
		                .append('li')
		                .on('click' , function(item) { 
		                	eval(item.click); })
		                .attr("class",function(item){return "_icon " + item.icon})
	            		.text(function(item) { return item.title; });
		              	d3.select('.context-menu').style('display', 'none');
		              // show the context menu
		              d3.select('.context-menu')
		                .style('left', (d3.event.pageX - 2) + 'px')
		                .style('top', (d3.event.pageY - 2) + 'px')
		                .style('display', 'block');
	              //} else {d3.select('.context-menu').style('display', 'none');}	              
	              d3.event.preventDefault();
	          });
	      } else {container.selectAll('rect').on("contextmenu",function(d,i){d3.event.preventDefault();})}
	    }
	
	    // Toggle children on click.
	    // If no children, consider it a dataset!
	    function click(d) {
	      var nodes = tree.nodes(root);
	      _.each(nodes,function(n){n.selected=false;});
	    	
	      if (d.children) {
	        d._children = d.children;
	        d.children = null;
	        d.selected = false;
	      } else {
	        d.children = d._children;
	        d._children = null;
	        //change color to signify selected
	        if(d.type=='dataset'){d.selected=true;}
	      }
	      update(d);
	    }
	
	    function color(d) {
	      //return d.selected ? "#ffff99" : d._children ? "#3182bd" : "#c6dbef";
	    	//http://meyerweb.com/eric/tools/color-blend
	    	var gradient = ['#84B3D9','#8DB9DC','#97BEDF','#A0C4E2','#AACAE6','#B3D0E9','#BDD5EC','#C6DBEF']
	    	return d._children ? "#3182bd" : d.depth<=gradient.length-1 ? gradient[d.depth] : gradient[gradient.length-1];
	    }
	    
	    function rectClass(d) {
		      return d.selected ? "sel" : d._children ? "more" : "flat";
		    }
	    
	    function getWidth(d) {
	    	return '100%';
	    }
    }

	return hoot_control_utilities_folder;
};