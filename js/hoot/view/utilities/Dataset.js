/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.dataset is Datasets view in Manage tab where user can view all ingested Hootenanny layers
//  and performs CRUD operations.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.dataset = function(context)
{
    var hoot_view_utilities_dataset = {};
    
    hoot_view_utilities_dataset.createContent = function(form){

    	fieldDiv = form.append('div').classed('pad1y col12', true);
    	
        fieldset = fieldDiv.append('a')
            .attr('href', '#')
            .text('Add Dataset')
            .classed('dark fl button loud pad2x big _icon plus', true)
            .style('margin-right','5px')
	        .on('click', function () {
	            //importData.classed('hidden', false);
	             Hoot.model.REST('getTranslations', function (d) {
	                 if(d.error){
	                     context.hoot().view.utilities.errorlog.reportUIError(d.error);
	                     return;
	                 }
	                context.hoot().control.utilities.importdataset.importDataContainer(d);
	             });
	        })
            .on("contextmenu",function(d,i){
                d3.event.stopPropagation();
                d3.event.preventDefault();
            	//Create context menu to offer bulk option
                var items = [{title:'Bulk Import',icon:'plus',action:'bulkImport'}];
	            d3.select('html').append('div').attr('class', 'dataset-options-menu');
	                    
	             var menuItem =  d3.selectAll('.dataset-options-menu')
	             	.html('')
	                .append('ul')
	                .selectAll('li')
	                .data(items).enter()
	                .append('li')
	                .attr('class',function(item){return item.icon + ' dataset-option';})
	                .on('click' , function(item) { 
	                	switch (item.action) {
						case 'bulkImport': hoot_view_utilities_dataset.importDatasets(); break;
						default: break;
						}
	                 	d3.select('.dataset-options-menu').remove();
                   });
	             
	             menuItem.append('span').attr("class",function(item){return item.icon + " icon icon-pre-text"});
	             menuItem.append('span').text(function(item) { return item.title; });
	                	
	             d3.select('.dataset-options-menu').style('display', 'none');
	             
	             // show the context menu
	             d3.select('.dataset-options-menu')
	             	.style('left', function(){return d3.event.clientX +'px'||'0px'})
	                 .style('top', function(){return d3.event.clientY +'px'||'0px'})
	                 .style('display', 'block');
	
	             //close menu
	             var firstOpen = true;
	             d3.select('html').on('click.dataset-options-menu',function(){
	                 if(firstOpen){
	                    firstOpen=false;     
	                 } else {
	                     d3.select('.dataset-options-menu').style('display', 'none');
	                 }
	             });
            });
        fieldDiv.append('a')
	        .attr('href', '#')
	        .text('Add Folder')
	        .classed('dark fl button loud pad2x big _icon plus', true)
	        .style('margin-right','5px')
	        .on('click', function () {
	        	context.hoot().control.utilities.folder.importFolderContainer(0);
	        });
        fieldDiv.append('a')
	        .attr('href', '#')
	        .text('')
	        .classed('dark fl button loud pad2x big _icon refresh', true)
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
            .classed('col12 fill-white small strong row10 overflow keyline-all', true)
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
	    rectNode.classed('sel',false);
      
        var datasets2remove = [];
        if(d.type=='folder'){
    		var folderId = d.id;
        	context.hoot().model.layers.setLayerLinks();
        	datasets2remove = _.filter(context.hoot().model.layers.getAvailLayers(),function(lyr){
        		return lyr.folderId==folderId;
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
	        	iD.ui.Alert('Can not remove the layer in use: ' + dataset.name,'warning',new Error().stack);
	        	rectNode.style('fill',currentFill);
	        	return;
	        }
	        
	        //select the rect using lyr-id
	        try {
		        // If the folder is closed, you will not be able to change the rect color...
                var selNode;
                if(!container.selectAll("text[lyr-id='" + dataset.id + "']").empty()){
                    selNode  = container.selectAll("text[lyr-id='" + dataset.id + "']").node().parentNode;
                    var selRect = d3.select(selNode).select('rect'); 
                    var currentFill = selRect.style('fill');
                    selRect.style('fill','rgb(255,0,0)');
                }
                			    
				d3.select('.context-menu').style('display', 'none');
			    
			    context.hoot().model.layers.deleteLayer(dataset,function(resp){
			    	if(resp==true){
			    		if(selNode){selNode.remove();}
			    	}
			    	
				    if(i>=datasets2remove.length-1){
				    	hoot.model.layers.refresh(function(){
			        		hoot.model.folders.refreshLinks(function(){context.hoot().model.import.updateTrees();})        		
			        	});
				    	
			    		//remove folder
				    	if(d.type=='folder'){
				        	context.hoot().model.folders.deleteFolder(d.id,function(resp){
				        		if(resp==false){iD.ui.Alert('Unable to delete folder.','error',new Error().stack);}
			                	hoot.model.folders.refresh(function () {context.hoot().model.import.updateTrees();});	
				        	});
				    	}
				    }
			    });
			} catch (e) {
				iD.ui.Alert('Unable to delete dataset ' + dataset.name + '. ' + e,'error',new Error().stack)
			} 
	    }//,container);    
        
        if(datasets2remove.length==0){
        	context.hoot().model.folders.deleteFolder(d.id,function(resp){
        		if(resp==false){iD.ui.Alert('Unable to delete folder.','error',new Error().stack);}
            	hoot.model.folders.refresh(function () {context.hoot().model.import.updateTrees();});	
        	});
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
                exportData = context.hoot().control.utilities.exportdataset.exportDataContainer(d, trans);
            });
        });
    }
    
    hoot_view_utilities_dataset.deleteDatasets = function(d,container) {
    	if(d.length==0){return;}
    	else if(d.length==1){
    		var dataset = _.find(context.hoot().model.layers.getAvailLayers(),{id:d[0]});
    		if(dataset==undefined){
    			iD.ui.Alert("Could not locate dataset with id: " + d[0].toString() + ".",'error',new Error().stack);
    			return;
    		} else {
    			dataset.type='dataset';
    		}
    		hoot_view_utilities_dataset.deleteDataset(dataset, container);
    	} else {
        	d3.event.stopPropagation();
            d3.event.preventDefault();
           
            var warningMsg = "You are about to delete " + d.length + " datasets.  Do you want to proceed?"
            if(!window.confirm(warningMsg)){return;}
            
            // Populate datasets2remove
            var availLayers = context.hoot().model.layers.getAvailLayers();
            var selectedLayers = context.hoot().model.layers.getSelectedLayers();
            var datasets2remove = [];
            _.each(selectedLayers,function(f){if(_.find(availLayers,{id:f})){datasets2remove.push(_.find(availLayers,{id:f}))}})
            
            for(var i=0;i<=datasets2remove.length-1;i++){
            	var dataset = datasets2remove[i];
            	var exists = context.hoot().model.layers.getLayers()[dataset.name];
    	        if(exists){
    	        	iD.ui.Alert('Can not remove the layer in use: ' + dataset.name,'warning',new Error().stack);
    	        	return;
    	        }
    	        
    	        //select the rect using lyr-id
    	        var selNode  = container.selectAll("text[lyr-id='" + dataset.id + "']").node().parentNode;
    	        var selRect = d3.select(selNode).select('rect'); 
    		    var currentFill = selRect.style('fill');
    		    selRect.style('fill','rgb(255,0,0)');
    		    selRect.classed('sel',false);
    		    
    			d3.select('.context-menu').style('display', 'none');
    		    
    		    context.hoot().model.layers.deleteLayer(dataset,function(resp){
    		    	if(resp==true){
    		    		selNode.remove();
    		    	}
    		    	
    			    if(i>=datasets2remove.length-1){
    			    	hoot.model.layers.refresh(function(){
    		        		hoot.model.folders.refreshLinks(function(){context.hoot().model.import.updateTrees();})        		
    		        	});
    			    }
    		    });
    	    }//,container);    
    	}
    }
    
    hoot_view_utilities_dataset.importDatasets = function(d) {
    	Hoot.model.REST('getTranslations', function (d) {
            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }
           context.hoot().control.utilities.bulkimportdataset.bulkImportDataContainer(d);
        });
    }
    
    hoot_view_utilities_dataset.moveDatasets = function(d) {
    	modifyName = context.hoot().control.utilities.bulkmodifydataset.bulkModifyContainer(d);
    }
    
    hoot_view_utilities_dataset.modifyDataset = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    	
    	var data = {};
    	data.inputType=d.type;
    	data.mapid=d.id;
    	
    	if(d.type=='dataset'){
    		modifyName = context.hoot().control.utilities.modifydataset.modifyNameContainer(d);
    	} else if(d.type=='folder'){
    		modifyName = context.hoot().control.utilities.folder.modifyNameContainer(d);
    	}
    }
    

    hoot_view_utilities_dataset.populateDatasetsSVG = function(container) {
		context.hoot().control.utilities.folder.createFolderTree(container);
    }
    
    return hoot_view_utilities_dataset;
}