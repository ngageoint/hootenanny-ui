Hoot.view.utilities.dataset = function(context)
{
    var hoot_view_utilities_dataset = {};
    
    hoot_view_utilities_dataset.createContent = function(form){

    	fieldDiv = form.append('div').classed('pad1y pad2x keyline-bottom col12', true);
    	
        fieldset = fieldDiv.append('a')
            .attr('href', '#')
            .text('Add Dataset')
            .classed('dark fr button loud pad2x big _icon plus', true)
	        .on('click', function () {
	            //importData.classed('hidden', false);
	             Hoot.model.REST('getTranslations', function (d) {
	                 if(d.error){
	                     context.hoot().view.utilities.errorlog.reportUIError(d.error);
	                     return;
	                 }
	                context.hoot().control.utilities.dataset.importDataContainer(d);
	             });
	        });
        fieldDiv.append('a')
	        .attr('href', '#')
	        .text('Add Folder')
	        .classed('dark fr button loud pad2x big _icon plus', true)
	        .style('margin-right','5px')
	        .on('click', function () {
	        	context.hoot().control.utilities.folder.importFolderContainer(0);
	        });
        fieldDiv.append('a')
	        .attr('href', '#')
	        .text('')
	        .classed('dark fr button loud pad2x big _icon refresh', true)
	        .style('margin-right','5px')
	        .on('click', function () {
	            hoot.model.folders.refresh(function () {
	            	hoot.model.layers.refresh(function(){
	            		hoot.model.folders.refreshLinks(function(){
	            			context.hoot().model.import.updateTrees();
	            		})        		
	            	});
	            });
	        });
        fieldset = form.append('div')
        .attr('id','datasettable')
            .classed('col12 fill-white small strong row10 overflow', true)
            .call(hoot_view_utilities_dataset.populateDatasetsSVG);
    };
        
    hoot_view_utilities_dataset.deleteDataset = function(d,container){
    	d3.event.stopPropagation();
        d3.event.preventDefault();
       
        var warningMsg = d.type =='folder'? 'folder and all data?' : 'dataset?';
        if(!window.confirm("Are you sure you want to remove the selected " + warningMsg)){return;}
        
        var mapId = d.id;//d3.select(this.parentNode).datum().name;
        
	    var parentNode;
	    if(d.type=='dataset'){
	    	parentNode = container.selectAll("text[lyr-id='" + d.id + "']").node().parentNode;
	    } else {
	    	parentNode = container.selectAll("text[fldr-id='" + d.id + "']").node().parentNode;
	    }
	    if(!parentNode){return;}
	    
	    var rectNode = d3.select(parentNode).select('rect'); 
	    var currentFill = rectNode.style('fill');
	    rectNode.style('fill','rgb(255,0,0)');
      
        var datasets2remove = [];
        if(d.type=='folder'){
    		var folderId = d.id;
        	context.hoot().model.layers.setLayerLinks();
        	datasets2remove = _.filter(context.hoot().model.layers.getAvailLayers(),function(lyr){
        		return lyr.folderId==folderId;
        	});
        	context.hoot().model.folders.deleteFolder(d.id,function(resp){
        		if(resp==false){console.log('Unable to delete folder.  Will delete datasets now.');}
        		hoot.model.folders.refresh(function () {});
        	});
        } else {
        	var availLayers = context.hoot().model.layers.getAvailLayers();
            datasets2remove=_.filter(availLayers,function(n){return n.id==mapId;});
        }

    	//datasets2remove.forEach(function(dataset){
        for(var i=0;i<=datasets2remove.length-1;i++){
        	var dataset = datasets2remove[i];
        	var exists = context.hoot().model.layers.getLayers()[dataset.name];
	        if(exists){
	        	alert('Can not remove the layer in use: ' + dataset.name);
	        	rectNode.style('fill',currentFill);
	        	return;
	        }
	        
	        //select the rect using lyr-id
	        var selNode  = container.selectAll("text[lyr-id='" + dataset.id + "']").node().parentNode;
	        var selRect = d3.select(selNode).select('rect'); 
		    var currentFill = selRect.style('fill');
		    selRect.style('fill','rgb(255,0,0)');
		    
			d3.select('.context-menu').style('display', 'none');
		    
		    context.hoot().model.layers.deleteLayer(dataset,function(resp){
		    	selNode.remove();
		    	
			    if(i>=datasets2remove.length-1){
			    	hoot.model.layers.refresh(function(){
		        		hoot.model.folders.refreshLinks(function(){context.hoot().model.import.updateTrees();})        		
		        	});
			    }
		    });

	    }//,container);    
        
        if(datasets2remove.length==0){
        	context.hoot().model.import.updateTrees();
        }
    } 
    
    hoot_view_utilities_dataset.exportDataset = function(d,container) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var mapid = context.hoot().model.layers.getmapIdByName(d.name);
        Hoot.model.REST('getMapSize', mapid,function (sizeInfo) {
//
            if(sizeInfo.error){
                return;
            }
            var expThreshold = 1*iD.data.hootConfig.export_size_threshold;
            var totalSize = 1*sizeInfo.size_byte;

            if(totalSize > expThreshold)
            {
                var thresholdInMb = Math.floor((1*expThreshold)/1000000);
                var res = window.confirm("Export data size is greater than " + thresholdInMb 
                    +"MB and export may encounter problem." +
                    " Do you wish to continue?");
                if(res === false) {
                    
                    return;
                }
            }

            Hoot.model.REST('getTranslations', function (trans) {
                if(trans.error){
                    context.hoot().view.utilities.errorlog.reportUIError(trans.error);
                    return;
                }
                exportData = context.hoot().control.utilities.dataset.exportDataContainer(d, trans);
            });
        });
    }
    
    hoot_view_utilities_dataset.modifyDataset = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    	
    	var data = {};
    	data.inputType=d.type;
    	data.mapid=d.id;
    	
    	if(d.type.toLowerCase()=='dataset'){
    		modifyName = context.hoot().control.utilities.dataset.modifyNameContainer(d);	
    	} else if(d.type.toLowerCase()=='folder'){
    		modifyName = context.hoot().control.utilities.folder.modifyNameContainer(d);
    	}
    }
    

    hoot_view_utilities_dataset.populateDatasetsSVG = function(container) {
    	var _svg = container.select('svg');
		if(!_svg.empty()){_svg.remove();
		}
		context.hoot().control.utilities.folder.createFolderTree(container);
    }
    
    return hoot_view_utilities_dataset;
}


