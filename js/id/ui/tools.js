iD.ui.Tools = function(context) {
    var history = context.history(),
        key = iD.ui.cmd('⌘T');

    function saving() {
        return context.mode().id === 'tools';
    }

    function tools() {
        var items = [
      	    {title:'Measure Distance',icon:'add-line',click:'console.log("measure distance");'},
      	    {title:'Measure Area',icon:'add-area',click:'console.log("measure area");'},
      	  ];
        
        d3.select('html').append('div').attr('class', 'tools-menu');
               
        var toolsItem =  d3.selectAll('.tools-menu')
    		.html('')
            .append('ul')
            .selectAll('li')
            .data(items).enter()
            .append('li')
            .on('click' , function(item) { 
            	eval(item.click);
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
      /*  var tooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(t('tools.title'), key));*/
        
        var button = selection.append('button')
        	.attr('class', 'tools col12')
            .attr('tabindex', -1)
            .on('click', tools);
            //.call(tooltip);
        
        button.append('span')
	        .attr('class', 'label')
	        .text(t('tools.title'));
        
        var keybinding = d3.keybinding('undo-redo')
            .on(key, tools, true);

        d3.select(document)
            .call(keybinding);

        var numChanges = 0;
    };
};
