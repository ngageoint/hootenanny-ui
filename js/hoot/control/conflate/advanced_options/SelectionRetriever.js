////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.advancedoptions.selectionretriever provides function to retrieve selected advanced
//	options values
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflate.advancedoptions.selectionretriever = function () {

	var _events = d3.dispatch();
    var _instance = {};

	// 
	/**
    * @desc Iterate through meta value and get user selected values
    * @param advform - parent form (Advanced options dlg)
    * @param fieldsMetaData - Fields meta data
    **/
    _instance.getSelectedValues = function(advform, fieldsMetaData){
    	var results = [];
        if(fieldsMetaData){
            for( var i=0; i<fieldsMetaData.length; i++){
                var meta = fieldsMetaData[i];
                var res = {};
                var fieldName = meta.name;
                var selVal = '';
				
				//Check to see if the first child is Enabled flag.
				//If so, use Enabled value to continue
				var enabled = true;
				if(meta.members[0].name=='Enabled'){
					advform? enabled = advform.select('#' + meta.members[0].id).property('checked') : enabled = (meta.members[0].defaultvalue == 'true');
				} 

				if (enabled===true){				
					_.each(meta.members,function(submeta){
						var res = {};
						var selVal = '';
						var fieldId = submeta.id;

						if(submeta.name=='Enabled'){
							if(meta.dependencies)
							{
								_getDependencyValues(meta, results);
							}
						}

						if(submeta.elem_type == 'checkbox' || submeta.elem_type=='checkplus') {
							if(fieldId){						
								selVal = _getSelectedCheckValue(advform, submeta.defaultvalue, fieldId);
								_getCheckValue(selVal, meta, submeta, results);

								if(submeta.elem_type=='checkplus'){
									//Only take value if checkplus is true!
									var cplusEnabled = _getSelectedCheckValue(advform, submeta.defaultvalue == 'true', submeta.id);
									
									if (cplusEnabled == true){
										_getCheckPlusValues(advform, submeta, results);
									}
								}
							}
						} else if (submeta.elem_type=='list') {
							//advform? selVal = advform.select('#' + fieldId).value(): selVal = submeta.defaultvalue;
							selVal = _getSelectedValue(advform, submeta.defaultvalue, fieldId);
							if(selVal.length === 0 && submeta.defaultvalue.length > 0){selVal = submeta.defaultvalue;}
							if(submeta.members){
								_getListMemberValue(selVal, submeta, results);
							}
						} else {
							if(fieldId){
								//var isHidden = advform.select('#' + fieldId).classed('hidden');
								selVal = _getSelectedValue(advform, submeta.defaultvalue, fieldId);
								if(selVal !== null)
								{
									if(selVal.length === 0 && submeta.defaultvalue.length > 0){selVal = submeta.defaultvalue;}
									_getDefaultValues(selVal, meta, submeta, results);
								}
							}     
						}

				});
            }
            }
        }
        return results;
    }

    /**
    * @desc Helper function to get check status of a field by checked property
    * @param f - form
    * @param d - default value
    * @param fid - element id
    **/
    var _getSelectedCheckValue = function(f, d, fid) {
    	var selVal = '';
    	selVal = (f) ?  f.select('#' + fid).property('checked').toString() : d;
    	return selVal;
    }

    /**
    * @desc Helper function to get check status of a field by value
    * @param f - form
    * @param d - default value
    * @param fid - element id
    **/
    var _getSelectedValue = function(f, d, fid) {
    	var selVal = '';
    	//selVal = (f) ?  f.select('#' + fid).value() : d;
    	selVal = (f) ? (f.select('#' + fid).value() == "" ? d: f.select('#' + fid).value()) : d;
    	return selVal;
    }

    /**
    * @desc Get values for check type elements
    * @param s - selected value
    * @param meta - meta data
    * @param submeta - sub meta value
    * @param results - results store
    **/
    var _getCheckValue = function(s, meta, submeta, results) {
    	var selVal = s;
    	var res = {};
    	if(selVal.length === 0 && submeta.defaultvalue.length > 0){selVal = submeta.defaultvalue;}
		// Add only there is default value or user selected value AND determine if hook_key or hoot_val
		if(selVal.length > 0){// && !isHidden){
			if(submeta.hoot_key){
				res.name = submeta.hoot_key;
				res.value = selVal;
				results.push(res);
			} else if(submeta.hoot_val && selVal == "true"){
				//create w/parent hoot_key or add to if already exists IF TRUE
				var idx = results.indexOf(_.find(results,function(obj){return obj.name == meta.hoot_key}));
				if(idx > -1){
					if(results[idx].value.indexOf(submeta.hoot_val)==-1)
					{results[idx].value +=  ";" + submeta.hoot_val ;}
				} else {
					res.name = meta.hoot_key;
					res.value = submeta.hoot_val ;
					results.push(res);
				}
			}
		}
    }

    /**
    * @desc Get values for check plus type elements
    * @param advform - advanced options form
    * @param submeta - sub meta value
    * @param results - results store
    **/
    var _getCheckPlusValues = function(advform, submeta, results) {
    	//Only take value if checkplus is true!
		_.each(submeta.members,function(c){
			var res = {};
			var selVal = '';
			if(c.id){
				//isHidden = advform.select('#' + c.id).classed('hidden');
				if(c.elem_type=='checkbox'){
					selVal = _getSelectedCheckValue(advform, c.defaultvalue, c.id);												
				} else {
					selVal  = _getSelectedValue(advform, c.defaultvalue, c.id);
				}
				if(selVal.length === 0 && c.defaultvalue.length > 0){selVal = c.defaultvalue;}	
				if(selVal.length > 0){// && !isHidden){
					res.name = c.hoot_key;
					res.value = selVal;
					results.push(res);
				}
			}
		});
    }

    /**
    * @desc Get values for list members elements
    * @param selVal - selected values
    * @param submeta - sub meta value
    * @param results - results store
    **/
    var _getListMemberValue = function(selVal, submeta, results) {
    	var selMember = _.find(submeta.members,{'name':selVal});
		if (selMember){
			if(selMember.members){
				_.each(selMember.members,function(subMember){
					var res = {};

					//see if subMember has value.  If not, take default value.
					var f = d3.select('#' + subMember.id);
					var subMemberVal = (f.empty()) ? subMember.defaultvalue : (f.value() == "" ? subMember.defaultvalue : f.value());

					if(subMember.hoot_key && subMemberVal.length>0){
						//see if hoot_key already exists.  If it does, add to value.  If not, create.
						var idx = results.indexOf(_.find(results,function(obj){return obj.name == subMember.hoot_key}));
						if(idx>-1){
							if(results[idx].value.indexOf(subMemberVal)==-1)
							{results[idx].value += ';'+subMemberVal;}
						} else {
							res.name = subMember.hoot_key;
							res.value = subMemberVal;
							results.push(res);
						}
					}
				});
			}
		}
    }

    /**
    * @desc Get values for default type elements
    * @param selVal - selected values
    * @param meta - meta data
    * @param submeta - sub meta value
    * @param results - results store
    **/
    var _getDefaultValues = function(selVal, meta, submeta, results) {
    	var res = {};
		// Add only there is default value or user selected value
		if(selVal.length > 0){// && !isHidden){
			if(submeta.hoot_key){
				var idx = results.indexOf(_.find(results,function(obj){return obj.name == submeta.hoot_key}));
				if(idx > -1){
					//check if value is already in list
					if(results[idx].value.indexOf(selVal)==-1)
					{results[idx].value += ';'+selVal;}
				} else {
					res.name = submeta.hoot_key;
					res.value = selVal
					results.push(res);
				}
			} else if(submeta.hoot_val){
				//create w/parent hoot_key or add to if already exists
				var idx = results.indexOf(_.find(results,function(obj){return obj.name == meta.hoot_key}));
				if(idx > -1){
					if(results[idx].value.indexOf(selVal)==-1)
					{results[idx].value += ';'+submeta.hoot_val ;}
				} else {
					res.name = meta.hoot_key;
					res.value = submeta.hoot_val;
					results.push(res);
				}
			}
		}
    }

    /**
    * @desc Get values for dependency elements
    * @param meta - meta data
    * @param results - results store
    **/
    var _getDependencyValues = function(meta, results) {
    	var res = {};
    	var hootkey = meta.dependencies[0].append.hoot_key;
		var hootval = meta.dependencies[0].append.hoot_val;
		var idx = results.indexOf(_.find(results,function(obj){return obj.name == hootkey}));
		if(idx > -1){
			if(results[idx].value.indexOf(hootval)==-1)
			{results[idx].value += ";" + hootval;}
		} else {
			res.name = hootkey;
			res.value = hootval;
			results.push(res);
		}
    }

    return d3.rebind(_instance, _events, 'on');
}