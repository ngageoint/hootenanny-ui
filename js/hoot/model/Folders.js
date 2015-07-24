Hoot.model.folders = function (context)
{
	var model_folders = {};
	var folders = {};
	var availFolders = [];
	var availLinks = [];

    model_folders.folders = folders;
    model_folders.getfolderIdByName = function (name) {
        var ar = _.filter(model_folders.getAvailFolders(), function (a) {
        	return a.name === name;
        });
        if(!ar.length){return null;}
        return ar[0].id;
    };
    model_folders.getNameBymapId = function (id) {
        var currAvailFolders = model_folders.getAvailFolders();
        var folderMatch = _.findWhere(currAvailFolders,{id:id});
        return folderMatch ? folderMatch.name : null;
    };

	model_folders.refresh = function (callback) {
        Hoot.model.REST('getAvailFolders', function (a) {

            if(a.status == 'failed'){
                if(a.error){
                    context.hoot().view.utilities.errorlog.reportUIError(a.error);
                }
            }

            if (!a.folders) {
                return callback([]);
            }
            availFolders = a.folders;
                   
            _.each(a.folders,function(fldr){
            	console.log(fldr.name);
            });
            
            if (callback) {
                callback(availFolders);
            }
        });
    };
    
    model_folders.refreshLinks = function(callback) {
    	Hoot.model.REST('getAvailLinks', function (a) {

            if(a.status == 'failed'){
                if(a.error){
                    context.hoot().view.utilities.errorlog.reportUIError(a.error);
                }
            }

            if (!a.links) {
                return callback([]);
            }
            availLinks = a.links;
            
            if (callback) {
                callback(availLinks);
            }
        });
    }
        
    model_folders.getAvailLinks = function() {
    	return availLinks;
    }
    
    model_folders.getAvailFolders = function () {   	
    	return availFolders;
    };
    
    model_folders.setAvailFolders = function (d) {   	
    	availFolders = d;
        return availFolders;
    };
    model_folders.getFolders = function (opt) {
        if (opt) return folders[opt];
        return folders;
    };
   

    model_folders.addFolder = function (key, callback) {
    	console.log('under construction');
    };


    model_folders.removeLayer = function (name) {
     	console.log('under construction');
    };
    
    model_folders.unflattenFolders = function(array,parent,tree) {
        tree = typeof tree !== 'undefined' ? tree : [];
        parent = typeof parent !== 'undefined' ? parent : { id: 0 };
                
        var children = _.filter( array, function(child){ 
        	return child.parentId == parent.id; });

        if( !_.isEmpty( children )  ){
            if( parent.id == 0 ){
            	tree = children;   
            }else{
               if(!parent['children']){parent['children']=[];}
               _.each(children,function(child){parent['children'].push(child);});
            }
            _.each( children, function( child ){
            	model_folders.unflattenFolders( array, child ) } );                    
        }

        if(parent['type']==undefined){parent['type']='folder'};
        return tree;
    };

    model_folders.getAvailFoldersWithLayers = function(){
    	var links = model_folders.getAvailLinks();

    	var layerList = _.each(_.map(context.hoot().model.layers.getAvailLayers(), _.clone) , function(element, index) {
    		_.extend(element, {type:'dataset'});
    		var match = _.find(this,function(e){return e.mapId===element.id});
    		if(match){_.extend(element,{folderId:match.folderId});}
    		else{_.extend(element,{folderId:0});}
    	},links);  
    	
    	var folderList = _.map(model_folders.getAvailFolders(), _.clone); 
    	var flatFolders = [];
    	
    	_.each(folderList,function(fldr){
    		fldr.children = _.filter(layerList,function(lyr){return lyr.folderId==fldr.id});
    	});
    	
    	//unflatten
    	return model_folders.unflattenFolders(folderList);
    };
       
    return model_folders;
}