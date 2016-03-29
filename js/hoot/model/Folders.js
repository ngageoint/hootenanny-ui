/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.model.folders connects UI to Hoot REST end point for folder loading and management requests.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.folders = function (context)
{
	var model_folders = {};
	var folders = {};
	var availFolders = [];
	var availLinks = [];
	var openFolders = [];

    model_folders.folders = folders;
    model_folders.getfolderIdByName = function (name) {
        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var ar = _.filter(model_folders.getAvailFolders(), function (a) {
        	return a.folderPath === name;
        });
        if(!ar.length){return null;}
        return ar[0].id;
    };
    model_folders.getNameBymapId = function (id) {
        var currAvailFolders = model_folders.getAvailFolders();
        var folderMatch = _.find(currAvailFolders,{id:id});
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
            	//console.log(fldr.name);
            });
            
            if (callback) {
                callback(availFolders);
            }
        });
    };
    
    model_folders.deleteFolder = function(folderId,callback){
    	if(!(folderId >= 0)) {
    		callback(false);
    		return false;
    	}
    	
    	context.hoot().model.folders.setOpenFolders(folderId,false);
    	
    	Hoot.model.REST('deleteFolder',folderId,function(a){
    		if(a){
    			model_folders.refresh(function(b){
            		if(callback){callback(true);}
        		});
    		}
    	});
    };
    
    model_folders.addFolder = function(data,callback){
    	if(!data.folderName || !(data.parentId>=0)){
    		if(callback){callback(data.parentId);}
    		return false;
    	}
    	
    	callbackData = {};
    	callbackData.folderName = data.folderName;
    	
    	Hoot.model.REST('addFolder',data,function(a){
    		if(a.success==true){
        		callbackData.folderId = a.folderId;
    			model_folders.refresh(function(b){
            		if(callback){callback(callbackData.folderId);}
        		})	
    		} else {
    			if(callback){callback(data.parentId);}
    		}
   	 	});     
    }
    
    model_folders.updateLink = function(link,callback) {
    	Hoot.model.REST('updateMapFolderLinks',link,function(a){
            context.hoot().model.folders.refreshLinks(function(){
            	context.hoot().model.import.updateTrees();
            	
            	if(callback){callback();}
            });
        });
    }
    
    model_folders.refreshLinks = function(callback) {
    	Hoot.model.REST('getAvailLinks', function (a) {

            if(a.status == 'failed'){
                if(a.error){
                    context.hoot().view.utilities.errorlog.reportUIError(a.error);
                }
            }

            if (!a.links) {
                if(callback){return callback([]);}
            }
            availLinks = a.links;
            
            if (callback) {
                if(callback){callback(availLinks);}
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
    
    model_folders.setOpenFolders = function(folderId,add) {
    	if(add){
    		openFolders.push(folderId);
    	} else {
    		var index = openFolders.indexOf(folderId);
    		if (index > -1) {
    			openFolders.splice(index, 1);
    		}
    	}
    	return openFolders;
    }

    model_folders.duplicateFolderCheck = function(folder){
        // Make sure that a folder at same level does not exist with same name
        // Check regardless of upper/lower case
        var folderList = _.each(_.map(hoot.model.folders.getAvailFolders(),_.clone),function(e){
            e.name = e.name.toLowerCase();
        });

        if(!_.isEmpty(_.find(folderList,{name:folder.name.toLowerCase(),parentId:folder.parentId}))){
            return "Please use a different name, as you are about to create a folder with a name identical to a folder at the same level.";
        } else {return true;}
    }
       
    model_folders.unflattenFolders = function(array,parent,tree) {
        tree = typeof tree !== 'undefined' ? tree : [];
        parent = typeof parent !== 'undefined' ? parent : { id: 0 };
                
        var children = _.filter( array, function(child){ 
        	return child.parentId == parent.id; });

        if( !_.isEmpty( children )  ){
            if( parent.id == 0 ){
            	tree = children;   
            }else{
            	if(parent.state=='closed'){
                	if(!parent['_children']){parent['_children']=[];}
                    _.each(children,function(child){parent['_children'].push(child);});
	
            	} else {
                	if(!parent['children']){parent['children']=[];}
                    _.each(children,function(child){parent['children'].push(child);});
            		
            	}            }
            _.each( children, function( child ){
            	model_folders.unflattenFolders( array, child ) } );                    
        }

        if(parent['type']==undefined){parent['type']='folder'};
        return tree;
    };
    
    model_folders.listFolders = function(array) {
        _.each(array,function(f){
        	if(f.parentId==0){
        		f.folderPath = f.name;
        	} else {
        		//use links to get parent folder as far back as possible
        		var strPath = f.name;
        		var parentFolder = _.find(hoot.model.folders.getAvailFolders(),{id:f.parentId});
        		var i=0;
        		do{
        			i++;
        			strPath = parentFolder.name+"/"+strPath;
        			parentFolder = _.find(hoot.model.folders.getAvailFolders(),{id:parentFolder.parentId});
        		} while (parentFolder || i==10)
        		f.folderPath = strPath;
        	}
        })
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
    	
    	_.each(folderList,function(fldr){
    		if(openFolders.indexOf(fldr.id)>-1){
    			fldr.children = _.filter(layerList,function(lyr){return lyr.folderId==fldr.id});
    			fldr.state='open';
    		} else {
        		fldr._children = _.filter(layerList,function(lyr){return lyr.folderId==fldr.id});
        		if(fldr._children.length==0){fldr._children=null;}	
        		fldr.state='closed';
    		}
    		_.extend(fldr,{type:'folder'});
    	});
    	
    	//unflatten
        //Updated to avoid root datasets being mistaken for folders
    	folderList = model_folders.unflattenFolders(folderList);
    	folderList = _.union(folderList,_.each(_.filter(layerList,function(lyr){return lyr.folderId==0}),function(lyr){_.extend(lyr,{parentId:0})}));
    	//return model_folders.unflattenFolders(folderList);
    	return folderList;
    };
       
    return model_folders;
}