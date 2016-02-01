iD.ui.Tools = function(context) {

    function saving() {
        return context.mode().id === 'tools';
    }
    
    function tools() {
    	 // If in review mode, do not include Clip tools
         var items = [];
         items.push({title:'Measurement Tools',icon:'add-line',group:'measure',items:[          
                {title:'Measure Length',tooltip:'Shortcut: 6',group:'measure',type:'line',icon:'add-line',mode:iD.modes.MeasureAddLine(context)},
                {title:'Measure Area',tooltip:'Shortcut: 7',group:'measure',type:'area',icon:'add-area',mode:iD.modes.MeasureAddArea(context)},
            ]});

        if (!hoot.control.conflicts.isConflictReviewExist()) {
            items.push({title:'Clip Tools',icon:'scissors',group:'clip',items:[
                {title:'Clip to Visual Extent',tooltip:'Shortcut: 9',group:'clip',type:'area',icon:'scissors',action:'clipVisualExtent'},
                {title:'Clip to Bounding Box',tooltip:'Shortcut: 8',group:'clip',type:'area',icon:'scissors',mode:iD.modes.ClipBoundingBox(context)}
            ]})
        };
        
        d3.select('html').append('div').attr('class', 'tools-menu');
               
        var toolsItem =  d3.selectAll('.tools-menu')
    		.html('')
            .append('ul')
            .selectAll('li')
            .data(items).enter()
            .append('li')
            .attr('class',function(item){return item.icon + ' tools-' + item.group;})
            .on('mouseenter',function(item){
            	if(!item.items){return;}
            	var itemHeight = d3.select('.tools-'+item.group).node().offsetTop+116+'px';
            	d3.select('.tools-menu.sub-menu').remove();
            	d3.select('html').append('div').attr('class','tools-menu sub-menu');
            	var subTools = d3.selectAll('.tools-menu.sub-menu')
            		.style('left', function(){
            			var menuWidth = d3.select('.tools-menu').node().offsetWidth+1;
            			return menuWidth+d3.select('button.tools').property('offsetLeft')+'px'||'0px'})
            		.style('top', itemHeight)
            		.style('display', 'block')	
            		.html('')
            		.append('ul')
            		.selectAll('li')
            		.data(item.items).enter()
            		.append('li')
            		.attr('class',function(item){
            			return item.icon + ' tools-' + item.group;})
                    .on('click' , function(item) { 
                    	if(item.items){return;}
                    	if(item.mode){
                        	context.enter(item.mode);	
                    	} else if (item.action=='clipVisualExtent'){
                    		//Call clip map
                    		if(!_.isEmpty(hoot.model.layers.getLayers())){
                    			hoot.control.utilities.dataset.clipDatasetContainer('visualExtent');                    			
                    		} else {
                    			iD.ui.Alert("Add data to map before clipping.","notice");
                    		}
                    	}
                    	d3.select('.tools-menu').remove();
                    	d3.select('.sub-menu').remove();
                      });
            	
            	subTools.append('span').attr("class",function(item){return item.icon + " icon icon-pre-text"});
            	subTools.append('span').text(function(item) { return item.title; }).attr('title',(function(item){return item.tooltip||'';}));
            });
        
            toolsItem.append('span').attr("class",function(item){return "icon-pre-text"});
            toolsItem.append('span').text(function(item) { return item.title; });
           	
        d3.select('.tools-menu').style('display', 'none');
        d3.select('.sub-menu').style('display', 'none');
        
        // show the context menu
        d3.select('.tools-menu')
        	.style('left', function(){return d3.select('button.tools').property('offsetLeft')+'px'||'0px'})
            .style('top', '120px')
            .style('display', 'block');

        //close menu
        var firstOpen = true;
        d3.select('html').on('click.tools-menu',function(){
            if(firstOpen){
               firstOpen=false;     
            } else {
                d3.select('.tools-menu').style('display', 'none');
                d3.select('.sub-menu').style('display', 'none');
            }
        });
        
        d3.event.preventDefault();
    }

    return function(selection) {
        var button = selection.append('button')
        	.attr('class', 'tools col12')
            .attr('tabindex', -1)
            .on('click', tools);
        
        button.append('span')
	        .attr('class', 'label')
	        .text(t('tools.title'));
        
        var numChanges = 0;
    };
};
