iD.ui.Processing = function(context,status) {
    return function(selection) {
        if(status){
        	var modalbg = selection.append('div')
            	.attr('id','processingDiv')
            	.classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        	var processingDiv = modalbg.append('div')
            	.classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        	processingDiv.append('h1')
        		.text('Processing...');
        	processingDiv.append('img')
            	.attr('src', context.imagePath('loader-white.gif'))
            	.style({'display': 'block','margin': 'auto'});
        } else {
        	d3.selectAll('#processingDiv').remove();
        }
    };
};
