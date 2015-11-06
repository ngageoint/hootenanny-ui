iD.ui.Tools = function(context) {

    function saving() {
        return context.mode().id === 'tools';
    }
    
    function tools() {
    	 var items = [
    	    {title:'Measure Length',type:'line',icon:'add-line',mode:iD.modes.MeasureAddLine(context)},
    	    {title:'Measure Area',type:'area',icon:'add-area',mode:iD.modes.MeasureAddArea(context)},
    	    {title:'Clip to Visual Extent',type:'area',icon:'add-area',action:'clipVisualExtent'},
    	    {title:'Clip to Bounding Box',type:'area',icon:'add-area',mode:iD.modes.ClipBoundingBox(context)},
    	    //{title:'Clip to Custom Area',type:'area',icon:'add-area',mode:iD.modes.ClipCustomArea(context)}
    	  ];
        
        d3.select('html').append('div').attr('class', 'tools-menu');
               
        var toolsItem =  d3.selectAll('.tools-menu')
    		.html('')
            .append('ul')
            .selectAll('li')
            .data(items).enter()
            .append('li')
            .attr('class',function(item){return item.icon + ' measure-distance';})
            .on('click' , function(item) { 
            	if(item.mode){
                	context.enter(item.mode);	
            	} else if (item.action=='clipVisualExtent'){
            		//Call clip map
            		if(!_.isEmpty(hoot.model.layers.getLayers())){
            			console.log("This is where we would call clipmap.")
                		var params = [];
            			//Provide input ID(s) of dataset(s)
            			_.each(hoot.model.layers.getLayers(),function(d){
            				var param = {};
            				param.id = d.id;
            				
            				//create name, ensuring it is unique
            				var uniquename = false;
            				var name = d.name + '_clip';
            				var i = 1;
            				while (uniquename==false){
            					if(context.hoot().model.layers.getLayers()[name]){
            						name = d.name + '_clip_' + i.toString();
            						i++;
            					} else {
            						uniquename = true;
            					}
            				}
            				param.name = name;            				
            				param.bbox = id.map().extent();
            				params.push(param);
            			});
            			
            			console.log(params);
            		}
            	}
            	d3.select('.tools-menu').remove();
              });
        
            toolsItem.append('span').attr("class",function(item){return item.icon + " icon icon-pre-text"});
            toolsItem.append('span').text(function(item) { return item.title; });
           	
        d3.select('.tools-menu').style('display', 'none');
        
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
