iD.ui.Coordinates = function(context){
	var projection = context.projection;
	
	function DDtoDMS(coords){
		var lat = coords[1];
		var lng = coords[0];
		
		var degrees = new Array(0,0);
    	var minutes = new Array(0,0);
    	var seconds = new Array(0,0);
    	var direction = new Array(' ',' ');
    	var hundreths = new Array(0.0,0.0);
    	
    	var LatCardinal = ((lat>0)?"N":"S");
    	var LngCardinal = ((lng>0)?"E":"W");
    	
    	degrees[0]=Math.abs(parseInt(lat));
    	degrees[1]=Math.abs(parseInt(lng));
    	
    	var lat_leftover = (Math.abs(lat)-degrees[0])*60;
    	var lng_leftover = (Math.abs(lng)-degrees[1])*60;
    	
    	minutes[0] = parseInt(lat_leftover);
    	minutes[1] = parseInt(lng_leftover);
    	
    	lat_leftover = (lat_leftover-minutes[0])*60;
    	lng_leftover = (lng_leftover-minutes[1])*60;
    	
    	seconds[0] = parseInt(lat_leftover);
    	hundreths[0] = parseInt(lat_leftover-seconds[0])*100;
    	
    	seconds[1] = parseInt(lng_leftover);
    	hundreths[1] = parseInt(lng_leftover-seconds[1])*100;
    	
    	return degrees[0]+'°' + minutes[0] + "'" + seconds[0] + '.' + hundreths[0] + '" ' + LatCardinal + "  " + degrees[1]+ '°' + minutes[1] + "'" + seconds[1] + '.' + hundreths[1] + '" ' + LngCardinal;
	}
	
	function update(selection,coords) {
		selection.text(DDtoDMS(coords));
	}
	
	return function(selection){
		var center = projection.invert(context.map().center());
		update(selection,center);
		//selection.text();
		
		context.map().surface.on('mousemove',function() {
			var coords = projection.invert(context.map().mouse());
			update(selection,coords);
		});			
	};	
} ;