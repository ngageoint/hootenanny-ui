iD.ui.Alert = function(message,type) {
    var alerts = d3.select("#alerts");
    var alertDiv = alerts.append('div').classed('fillD alertDiv',true);
    
    ////// ALERT TYPES //////
    /*
     * warning
     * error
     * notice
     */
    
    if(type=='warning'||type=='error'){alertDiv.classed('red',true);}
    
    alertDiv.append('div')
		.classed('fr _icon x point', true)
		.on('click',function() {this.parentNode.remove();});
	
	alertDiv.append('h3').text(message);
    
    return;
};
