iD.ui.Warning = function(context,status,message) {
    return function(selection) {
        if(status){
        	selection.style('opacity',1.0);
        	selection.append('img')
	            .attr('src', context.imagePath('warning.png'))
	            .style('opacity', 1.0)
	            .attr('title',message);
        } else {
        	selection.style('opacity',0.0);
        	selection.selectAll('img').remove();
        }
    };
};
