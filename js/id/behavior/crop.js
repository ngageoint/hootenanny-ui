var clickTime = null;
iD.behavior.crop = function(context,svg,type) {
    var event = d3.dispatch('move', 'click','cancel', 'finish','dblclick'),
        keybinding = d3.keybinding('croparea'),
        rect,
        lastPoint=null,firstPoint=null;
    
    function ret(element) {
        d3.event.preventDefault();
        element.on('dblclick',undefined);
        event.finish();
    }
    
    function mousedown(){
    	var element = d3.select(this);
    	element.on('dblclick',function(){
    		ret(element);
    	});
    	
    	element.on('mousemove.croparea',null);
    	
    	d3.select(window).on('mouseup.croparea',function(){
    		element.on('mousemove.croparea',mousemove);
    		
    		// Prevent a quick second click
    		d3.select(window).on('click.croparea-block',function(){
    			d3.event.stopPropagation();
    		},true);
    		
    		context.map().dblclickEnable(false);
    		
            window.setTimeout(function() {
                context.map().dblclickEnable(true);
                d3.select(window).on('click.croparea-block', null);
            }, 500);

            click();
    	});
    }
    
    function mousemove() {
    	var c = context.projection(context.map().mouseCoordinates());
    	
    	//var rect = svg.select('rect');
    	if(!rect.empty()){
    		var d = {
                    x       : parseInt( rect.attr( "x"), 10),
                    y       : parseInt( rect.attr( "y"), 10),
                    width   : parseInt( rect.attr( "width"), 10),
                    height  : parseInt( rect.attr( "height"), 10)
                },
                move = {
                    x : p[0] - d.x,
                    y : p[1] - d.y
                };
    		
    		if( move.x < 1 || (move.x*2<d.width)) {
                d.x = p[0];
                d.width -= move.x;
            } else {
                d.width = move.x;       
            }

            if( move.y < 1 || (move.y*2<d.height)) {
                d.y = p[1];
                d.height -= move.y;
            } else {
                d.height = move.y;       
            }
           
            rect.attr( d);
    	}
    }
    
    function click() {
    	console.log('click');
    	svg.select( "rect").remove();
    }
    
    function croparea(selection){
    	var g = svg.append('g');
    	rect = g.append('rect');
    }
    
};
