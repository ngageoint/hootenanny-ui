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
        fieldDiv.append('div').style({'display':'inline-block','margin-right':'5px'})
        	.classed('dark fr button big dark loud big',true)
        	.append('button')
        	.attr('class', 'options loud dark big pad2x col12')
            .attr('tabindex', -1)
            .on('click', function(){
            	d3.event.stopPropagation();
                d3.event.preventDefault();
                
                var items = [
	         	    {title:'Refresh',icon:'redo',action:'refresh();'},
	         	    {title:'Select Multiple Datasets',icon:'layers',action:'select(true);'}
	         	  ];
	             
	             d3.select('html').append('div').attr('class', 'dataset-options-menu');
	                    
	             var menuItem =  d3.selectAll('.dataset-options-menu')
	         		.html('')
	                 .append('ul')
	                 .selectAll('li')
	                 .data(items).enter()
	                 .append('li')
	                 .attr('class',function(item){return item.icon + ' dataset-option';})
	                 .on('click' , function(item) { 
	                 	eval(item.action);
	                 	d3.select('.dataset-options-menu').remove();
	                   });
	             
	             menuItem.append('span').attr("class",function(item){return item.icon + " icon icon-pre-text"});
	             menuItem.append('span').text(function(item) { return item.title; });
	                	
	             d3.select('.dataset-options-menu').style('display', 'none');
	             
	             // show the context menu
	             d3.select('.dataset-options-menu')
	             	.style('left', function(){return d3.select('button.options').property('offsetLeft')+'px'||'0px'})
	                 .style('top', function(){return (185 + d3.select('button.options').property('offsetTop'))+'px'||'0px'})
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
            	})
            .append('span')
	        .attr('class', 'label').style('font-size','14px')
	        .text('Options');

        fieldset = form.append('div')
        .attr('id','datasettable')
            .classed('col12 fill-white small strong row10 overflow', true)
            .call(hoot_view_utilities_dataset.populateDatasetsSVG);
        
        subfieldset = form.append('div')
        	.attr('id','optionsdiv')
        	.classed('pad1y pad2x keyline-bottom col12 hidden',true);
        
        subfieldset.append('a')
	        .attr('href', '#')
	        .text('Cancel')
	        .classed('dark fr button loud pad2x big dataset-option', true)
	        .on('click', function () {
	        	select(false);
	        	//d3.select('#optionsdiv').classed('hidden',true);
	        });
        subfieldset.append('a')
	        .attr('href', '#')
	        .text('Delete')
	        .classed('dark fr button loud pad2x big dataset-option', true)
	        .on('click', function () {
	            //get list of checked datasets
	        	
	        });
        subfieldset.append('a')
	        .attr('href', '#')
	        .text('Move')
	        .classed('dark fr button loud pad2x big dataset-option', true)
	        .on('click', function () {
	        	modifyName = context.hoot().control.utilities.dataset.bulkModifyContainer(context.hoot().model.layers.getCheckedLayers());
	        });        	
    };
    
    function refresh(){
    	hoot.model.folders.refresh(function () {
        	hoot.model.layers.refresh(function(){
        		hoot.model.folders.refreshLinks(function(){
        			context.hoot().model.import.updateTrees();
        		})        		
        	});
        });
    };
    
    function select(mode){
    	d3.select('#optionsdiv').classed('hidden',!mode);
    	var container = d3.select("#datasettable");
    	var _svg = container.select('svg');
		if(!_svg.empty()){_svg.remove();}
		context.hoot().control.utilities.folder.createFolderTree(container,mode);
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
		    	if(resp==true){
		    		selNode.remove();
		    	}
		    	
			    if(i>=datasets2remove.length-1){
			    	hoot.model.layers.refresh(function(){
		        		hoot.model.folders.refreshLinks(function(){context.hoot().model.import.updateTrees();})        		
		        	});
			    	
		    		//remove folder
		        	context.hoot().model.folders.deleteFolder(d.id,function(resp){
		        		if(resp==false){alert('Unable to delete folder.');}
	                	hoot.model.folders.refresh(function () {context.hoot().model.import.updateTrees();});	
		        	});
			    	
			    }
		    });

	    }//,container);    
        
        if(datasets2remove.length==0){
        	context.hoot().model.folders.deleteFolder(d.id,function(resp){
        		if(resp==false){alert('Unable to delete folder.');}
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


