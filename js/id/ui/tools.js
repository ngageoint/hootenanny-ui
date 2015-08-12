iD.ui.Tools = function(context) {

    function saving() {
        return context.mode().id === 'tools';
    }
    
    function tools() {
    	 var items = [
    	    {title:'Measure Distance',type:'line',icon:'add-line',mode:iD.modes.MeasureAddLine(context)},
    	    {title:'Measure Area',type:'area',icon:'add-area',click:iD.modes.AddArea(context)},
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
            	//context.enter(iD.modes.Measure(context,item));
            	context.enter(item.mode);
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
