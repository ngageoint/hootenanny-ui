/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.modifydataset provides user control for existing dataset modification.
//  Allows the modification of Output Name, Path and allows placement into new folder
//
// 
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      17 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.utilities.modifydataset = function(context) {
	var _events = d3.dispatch();
	var _instance = {};

	var _dataset;
	var _container;


    /**
    * @desc Entry point where it creates form.
    * @param dataset - Target dataset meta data.
    **/
	_instance.modifyNameContainer = function(dataset) {
		_createContainer(dataset);	  
	};

    /**
    * @desc Entry point where it creates form.
    * @param dataset - Target dataset meta data.
    **/
	var _createContainer = function(dataset) {
		_dataset = dataset;


		hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
	    var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
	    var folderId = dataset.folderId || 0;
	      
	    var placeholder = 'root';
		if(folderId > 0){
			if( _.find(folderList,{id:folderId})){
				var match = _.find(folderList,{id:folderId});
				if(match){placeholder = match.folderPath};
			}
		 }
	    
	 	var d_form = [{
            label: 'Output Name',
            id: 'modifyDatasetFileOutputName',
            placeholder: dataset.name,
            inputtype:'text',
            text:  dataset.name,
            onchange: _validateInput
        },{
        	label: 'Path',
        	id: 'modifyDatasetPathname',
        	placeholder:placeholder,
        	combobox:{'data':folderList, 'command': _populatePaths }, 
			inputtype:'combobox'
        },
        {
        	label: 'New Folder Name (leave blank otherwise)',
        	id: 'modifyDatasetNewFolderName',
        	placeholder:'',
        	onchange: _validateInput
        }];

        var d_btn = [
			        {
			        	text: 'Update',
			        	location: 'right',
			        	id: 'bulkModifyDatasetBtnContainer',
			        	onclick: _submitClickHandler
			        }
		        ];

        var meta = {};
        meta.title = ('Modify ' + dataset.type.charAt(0).toUpperCase() + dataset.type.slice(1).toLowerCase());
        meta.form = d_form;
        meta.button = d_btn;

		_container = context.hoot().ui.formfactory.create('body', meta);
	}


    /**
    * @desc Submit handler. Sends modified request to back end.
    **/
	var _submitClickHandler = function() {
		if(!d3.selectAll('.invalidName').empty()){return;}

    	var pathname = _container.select('#modifyDatasetPathname').value();
    	if(pathname==''){pathname=_container.select('#modifyDatasetPathname').attr('placeholder');}
        if(pathname=='root'){pathname='';}
        var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
        
        //make sure a change is being made to foldername
        var outputname =_container.select('#modifyDatasetFileOutputName').value();
        
    	var data = {};
    	data.inputType = _dataset.type;
    	data.mapid = _dataset.id;
    	data.modifiedName = outputname;
    	data.folderId = pathId;
        
        if(outputname == ''){outputname=_dataset.name;}
        if(outputname.toLowerCase() != _dataset.name.toLowerCase()){
        	var resp = context.hoot().checkForUnallowedChar(outputname);
        	if(resp != true){
        		iD.ui.Alert(resp,'warning',new Error().stack);
        		return;
            }
        	if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == outputname})))
        	{
        		iD.ui.Alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.",'warning',new Error().stack);
                return;
            }
        	
        	data.updateType="update";
        }
    	
        context.hoot().model.layers.updateLayerName(data, function(status){
                //determine if a new folder is being added
                var newfoldername = _container.select('#modifyDatasetNewFolderName').value();
                resp = context.hoot().checkForUnallowedChar(newfoldername);
            	if(resp != true){
            		iD.ui.Alert(resp,'warning',new Error().stack);
            		return;
                }

                 resp = hoot.model.folders.duplicateFolderCheck({name:newfoldername,parentId:pathId});
                if(resp != true){
                    iD.ui.Alert(resp,'warning',new Error().stack);
                    return;
                }
                
                var folderData = {};
                folderData.folderName = newfoldername;
                folderData.parentId = pathId;
                hoot.model.folders.addFolder(folderData,function(a){
                	context.hoot().model.layers.refresh(function(){
                    	//update map linking
                        var link = {};
                        link.folderId = a;
                        link.mapid =_.pluck(_.filter(hoot.model.layers.getAvailLayers(),function(f){return f.name == outputname}),'id')[0] || 0;
                        if(link.mapid==0){return;}
                        link.updateType="update";
                        hoot.model.folders.updateLink(link);
                        link = {};
                        _container.remove();	
                	});	                        
                });
        });
	}

    /**
    * @desc Populates existing pathes into drop down list.
    * @param field - Combobox data.
    **/
	var _populatePaths = function(field) {
		var comboPathName = d3.combobox()
            .data(_.map(field.combobox.data, function (n) {
                return {
                	value: n.folderPath,
                    title: n.folderPath
                };
            }));

        comboPathName.data().sort(function(a,b){
		  	var textA = a.value.toUpperCase();
		  	var textB=b.value.toUpperCase();
		  	return(textA<textB)?-1 : (textA>textB)?1:0;
		  });
        
        comboPathName.data().unshift({value:'root',title:0});
        
        d3.select(this)
        	.style('width', '100%')
        	.call(comboPathName);
        
        d3.select(this).attr('readonly',true);
	}

    /**
    * @desc Validates input fields.
    **/
	var _validateInput = function() {
		//ensure output name is valid
        var resp = context.hoot().checkForUnallowedChar(this.value);
        if(resp != true){
            d3.select(this).classed('invalidName',true).attr('title',resp);
        } else {
            d3.select(this).classed('invalidName',false).attr('title',null);
        }
	}

	


	return d3.rebind(_instance, _events, 'on');
}