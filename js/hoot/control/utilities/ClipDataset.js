/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.clipdataset provides user the ability to clip dataset based on visual extent or 
//	User specified bonding box.
//
// 
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      17 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.clipdataset = function(context) {
	var _events = d3.dispatch();
	var _instance = {};

	var _rect;
	var _clipType;
	var _modalbg;


	/**
    * @desc Entry point where it creates form.
    * @param clipType - Clip type which can be visual extent or bounding box
    * @param rect - rect of bbox.
    * @return container div
    **/
   	_instance.clipDatasetContainer = function(clipType, rect) {
   		_rect = rect;
   		_clipType = clipType;
		//exit if already open
		if(!d3.select('#clipDatasetContainer').empty()){return;}

		if(_.isEmpty(hoot.model.layers.getLayers())){
			iD.ui.Alert('Please add at least one dataset to the map to clip.','notice');
			return;
		}

        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);

        var _columns = [
           {label:'Dataset',type:'datasetName'},
           {label:'Clip?', checkbox:true},
		   {label:'Output Name', placeholder: 'Save As',	 type: 'LayerName'},
		   {label:'Path', placeholder: 'root', type: 'PathName', combobox3:folderList }
        ];
        
        var _row = [{'datasetName':'','checkbox':'','LayerName':'','PathName':''}];
        
        _modalbg = d3.select('body')
	        .append('div')
	        .attr('id','clipDatasetContainer')
	        .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
	    var ingestDiv = _modalbg.append('div')
	        .classed('contain col10 pad1 hoot-menu fill-white round modal', true)
	        .style({'display':'block','margin-left':'auto','margin-right':'auto','left':'0%'});
	    var _form = ingestDiv.append('form');
	    _form.classed('round space-bottom1 importableLayer', true)
	        .append('div')
	        .classed('big pad1y keyline-bottom space-bottom2', true)
	        .append('h4')
	        .text(function(){
	        	if(_clipType=='visualExtent'){return 'Clip Data to Visual Extent'}
	        	else if(_clipType=='boundingBox'){return 'Clip Data to Bounding Box'}
	        	else{return 'Clip Data'}
	        })
	        .append('div')
	        .classed('fr _icon x point', true)
	        .on('click', function () {
	            _modalbg.remove();
	        });
	    
	    var _table = _form.append('table').attr('id','clipTable');
	    //set column width for last column
	    var colgroup = _table.append('colgroup');
	    colgroup.append('col').attr('span','4').style('width','100%');
	    colgroup.append('col').style('width','30px');
	    
	    _table.append('thead').append('tr')
    		.selectAll('th')
    		.data(_columns).enter()
    		.append('th')
    		.attr('class',function(d){return d.cl})
    		.text(function(d){return d.label});
	    
	    _table.append('tbody');
	    _.each(hoot.model.layers.getLayers(),function(d){
			var _tableBody = d3.select("#clipTable").select('tbody');
			_tableBody.append('tr').attr('id','row-'+d.name)
				.selectAll('td')
				.data(function(row,i){
					// evaluate column objects against the current row
					return _columns.map(function(c) {
						var cell = {};
						d3.keys(c).forEach(function(k) {
							cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
						});
						return cell;
					});
				}).enter()
				.append('td')
				.append('div').classed('contain bulk-import',true).append('input')
				.attr('class', function(d){return 'reset  bulk-import ' + d.type})
		    	.attr('row',d.name)
		    	.attr('placeholder',function(d){return d.placeholder})
		    	.select(function (a) {
					if(a.checkbox){
						var parentDiv = d3.select(this.parentElement);
						parentDiv.selectAll('input').remove();
						parentDiv.append('input').attr('type','checkbox').property('checked',true).attr('id','clip-'+d.name);//.attr('checked',true);
					}

					if(a.type=='datasetName'){
						d3.select(this).attr('placeholder',function(){
							return d.name}).attr('readonly',true);
					}

					if(a.type=='LayerName'){
						_createLayerNameField.call(this, d);
					}

					if (a.readonly){
						d3.select(this).attr('readonly',true); 
					}

					if (a.combobox3) {
						_createFolderListCombo.call(this, a, d);
					}
				});
			});

			var submitExp = ingestDiv.append('div')
				.classed('form-field col12 left ', true);

			if(_clipType==undefined){_clipType='visualExtent';}
			var typeDiv = ingestDiv.append('div').attr('id','clipType').classed('hidden',true).attr('clipType',_clipType);

			
			submitExp.append('span')
				.classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
				.text('Clip')
				.on('click',_clipClickHandler)


		return _modalbg;
	};


	/**
    * @desc Creates input field for layer name.
    * @param d - Selected layer meta data.
    **/
	var _createLayerNameField = function(d) {
		var uniquename = false;
		var name = d.name;
		var i = 1;
		while (uniquename==false){
			if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == name}))){
				name = d.name + i.toString();
				i++;
			} else {
				uniquename = true;
			}
		}
		d3.select(this).value(function(){return name;});
		
		d3.select(this).on('change',function(){
			//ensure output name is valid
			var resp = context.hoot().checkForUnallowedChar(this.value);
			if(resp != true){
				d3.select(this).classed('invalidName',true).attr('title',resp);
			} else {
				d3.select(this).classed('invalidName',false).attr('title',null);
			}
		});

	}


	/**
    * @desc Create folder list combo.
    * @param a - Field meta data.
    * @param d - Selected layer meta data.
    **/
	var _createFolderListCombo = function(a, d) {
		var comboPathName = d3.combobox()
			.data(_.map(a.combobox3, function (n) {
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

		d3.select(this).attr('placeholder',function(){
			if(_.isEmpty(_.find(hoot.model.layers.getAvailLayers(),{'name':d.name}))){
				return 'root';
			} else {
				var folderPath = 'root';
				try{
					hoot.model.layers.setLayerLinks(function(){
						var fID = _.find(hoot.model.layers.getAvailLayers(),{'name':d.name}).folderId || 0;
						var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
						folderPath =  _.find(folderList,{id:fID}).folderPath || 'root';
					});
						
				} catch (err) {
					folderPath = 'root';
				}

				return folderPath;
			}
		})        
	}

	/**
    * @desc Click handler for clip request.
    **/
	var _clipClickHandler = function() {
		if(!d3.selectAll('.invalidName').empty()){return;}
					
		var clipType = d3.select('#clipType').attr('clipType');
		var checkedRows = d3.select('#clipTable').selectAll('tr').selectAll("[type=checkbox]");
			var selectedLayers = [];
			_.each(checkedRows,function(d){
				if(!_.isEmpty(d)){
					if(d3.select(d[0]).property('checked')){selectedLayers.push(d.parentNode.id.replace('row-',''));}								
				}
			});
			
		//Set up params for clipping
		var params = [];
		_.each(hoot.model.layers.getLayers(),function(d){
			if(selectedLayers.indexOf(d.name)==-1){return;}
			
			var param = {};
			param.INPUT_NAME = d.name;
			
			var uniquename = false;
            var name = d3.select('#row-' + d.name).select('div .LayerName').value() || d3.select('#row-' + d.name).select('div .LayerName').attr('placeholder');
			var i = 1;
			while (uniquename==false){
				if(!_.isEmpty(_.filter(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(f){return f == name}))){
					name = name + i.toString();
					i++;
				} else {
					uniquename = true;
				}
			}
			param.OUTPUT_NAME = name;
			
			var resp = context.hoot().checkForUnallowedChar(param.OUTPUT_NAME);
			if(resp != true){
        		iD.ui.Alert(resp,'warning',new Error().stack);
        		return;
            }
			
			if(clipType=='visualExtent'){param.BBOX = id.map().extent().toString();}
			else if(clipType=='boundingBox'){param.BBOX= _rect;}
			
            param.PATH_NAME = d3.select('#row-' + d.name).select('div .PathName').value() || d3.select('#row-' + d.name).select('div .PathName').attr('placeholder') || 'root';

			params.push(param); 
		});
		
		_.each(params,function(param){
			Hoot.model.REST('clipDataset', param, function (a,outputname) {
                	if(a.status=='complete'){iD.ui.Alert("Success: " + outputname + " has been created!",'success');}
                });
		})

		_modalbg.remove();
	}	


	return d3.rebind(_instance, _events, 'on');

}