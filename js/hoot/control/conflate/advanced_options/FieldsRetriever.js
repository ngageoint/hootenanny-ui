////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.advancedoptions.fieldsretriever provides functions to gather user specified advanced
//  options values.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflate.advancedoptions.fieldsretriever = function () {

    var _events = d3.dispatch();
    var _instance = {};


    /**
    * @desc Retrieved default fields values
    **/
	_instance.getDefaultFields = function(){
    	var defaultVals = [];
    	_.each(iD.data.hootConfAdvOps,function(group){
    		var g = JSON.parse(JSON.stringify(group));
    		defaultVals.push(g);
		});
    	
    	var thisConfType = d3.selectAll('.reset.ConfType');
    	var _confType = {
    			'Reference':'reference',
          		'Average':'average',
          		'Cookie Cutter & Horizontal':'horizontal'
          	};
    	
    	//load in specific values for custom conflation
        var overrideOps;
        switch (_confType[thisConfType.value()]) {
		case 'reference': overrideOps = iD.data.hootConfAdvOps_reference; break;
		case 'average' : overrideOps = iD.data.hootConfAdvOps_average; break;
		case 'horizontal' : overrideOps = iD.data.hootConfAdvOps_horizontal; break;
		default: break;
		}
    	if(overrideOps){
        	//loop through each and look for hoot_key to replace within hootConfAdvOps
        	if(overrideOps.length>0){
        		_.each(overrideOps,function(overrideGroup){
        			var groupKeys = overrideGroup.members.map(function(f){
        				var q = (f.hoot_key.indexOf('.creators')>-1)? f.id : f.hoot_key.replace(/\./g,'_');
        				//var q = f.hoot_key.replace(/\./g,'_');
        				var req = f.required || false;
        				return {"id":q,"hoot_key":f.hoot_key,"defaultvalue":f.defaultvalue,"required":req};
        			});
        			
        			_.each(defaultVals,function(confGroup){
        				var defaultKeys = _.pluck(confGroup.members,'id');
      				
        				var retval = groupKeys.filter(function(n){return defaultKeys.indexOf(n.id) != -1;});
        				_.each(retval,function(replaceMember){
        					var currentMember = _.find(this.members,{id:replaceMember.id});
        					if (currentMember){
        						//you found it.  now replace it! 
        						currentMember.defaultvalue = replaceMember.defaultvalue;
        						
        						//remove replace member
        						groupKeys.splice(groupKeys.indexOf(replaceMember),1);
        					}    					
        				},confGroup);
        				
    					
    					//look for checkpluses.  if member is in groupKeys, set default value and make sure checkplus is checked
        				var checkpluses = confGroup.members.filter(function(f){return f.elem_type=="checkplus";});
        				_.each(checkpluses,function(cp){
        					defaultKeys = _.pluck(cp.members,'id');
        					retval = groupKeys.filter(function(n){return defaultKeys.indexOf(n.id) != -1;});
        					_.each(retval,function(replaceMember){
        						var foundItem = _.find(this.members,{id:replaceMember.id});
        						foundItem.defaultvalue = replaceMember.defaultvalue;
        						foundItem.required = replaceMember.required;

        						groupKeys.splice(groupKeys.indexOf(replaceMember),1);
        					},cp);
        				});

        				//look for lists with submembers
						var multilists = confGroup.members.filter(function(f){return f.elem_type=="list";});
        				_.each(multilists,function(ml){
        					_.each(ml.members,function(sublist){
								defaultKeys = _.pluck(sublist.members,'id');
								retval = groupKeys.filter(function(n){return defaultKeys.indexOf(n.id) != -1;});
								_.each(retval,function(replaceMember){
	        						var foundItem = _.find(this.members,{id:replaceMember.id});
	        						foundItem.defaultvalue = replaceMember.defaultvalue;
	        						foundItem.required = replaceMember.required;

	        						groupKeys.splice(groupKeys.indexOf(replaceMember),1);
								},sublist);
        					});
        				});
        			},overrideGroup);
        			
    				//add new group with values that are not duplicated
    				var newMembers = overrideGroup.members.filter(function(n){return _.pluck(groupKeys,'hoot_key').indexOf(n.hoot_key) != -1;});
        			var newGroup = JSON.parse(JSON.stringify(overrideGroup));
        			newGroup.members = newMembers;
        			defaultVals.push(newGroup);
        		});
        	} else { defaultVals = iD.data.hootConfAdvOps; }
    	} else { defaultVals = iD.data.hootConfAdvOps; }
        
        return defaultVals;
    };

    /**
    * @desc  Get fields and values
    * @param fieldsMetaData - meta data for fieldset which is used get values
    **/
    _instance.gatherFieldValues = function(fieldsMetaData){
    	var fieldsJSON = new Array();
    	_.each(fieldsMetaData,function(field){
    		// test to determine if enabled/disabled first
    		var groupEnabled = true;
    		if (field.members[0].name=='Enabled' && field.members[0].elem_type=='checkbox'){
    			groupEnabled = d3.select('#'+field.members[0].id).property('checked');
    		}

    		_.each(field.members,function(subfield){
				var setVal=null;
				
				if(subfield.elem_type=='checkbox'||subfield.elem_type=='checkplus'){
					setVal = d3.select("#"+subfield.id).property('checked');
				} else {
					setVal = d3.select("#"+subfield.id).value();
					if(setVal===''){setVal=d3.select("#"+subfield.id).attr('placeholder');}
				}

				if(subfield.hoot_val){
					// add to list if true
					if(setVal===null){setVal=subfield.hoot_val;}
					if(setVal===true){
						//see if hoot_key is already in list
						var hk = _.find(fieldsJSON,{'key':field.hoot_key});
						if(hk){
							hk.value += ";" + subfield.hoot_val;
						} else {
							fieldsJSON.push({key:field.hoot_key,value:subfield.hoot_val,group:field.name,id:field.id});
						}
					}					
				} else if(subfield.hoot_key) {
					if(setVal===null){setVal=subfield.defaultvalue;}
					fieldsJSON.push({key:subfield.hoot_key,value:setVal,group:field.name,id:subfield.id});
				} else {
					if(setVal===null){setVal=subfield.defaultvalue;}
					fieldsJSON.push({key:subfield.id,value:setVal,group:field.name,id:subfield.id});
				}

				if(subfield.members){
					var arrSubfields = [];
					_.each(subfield.members,function(submember){
						arrSubfields.push(submember);
						if(submember.members){_.each(submember.members,function(subsub){arrSubfields.push(subsub);});}
					});
		    		_.each(arrSubfields,function(submember){
						var setVal=null;
						if(submember.elem_type=='checkbox'||submember.elem_type=='checkplus'){
							setVal = d3.select("#"+submember.id).property('checked');
						} else if(submember.elem_type) {
							setVal = d3.select("#"+submember.id).value();
							if(setVal===''){setVal=d3.select("#"+submember.id).attr('placeholder');}
						}

						if(submember.hoot_val){
							// add to list if true
							if(setVal===null){setVal=submember.hoot_val;}
							if(setVal===true){
								//see if hoot_key is already in list
								var hk = _.find(fieldsJSON,{'key':subfield.hoot_key});
								if(hk){
									hk.value += ";" + submember.hoot_val;
								} else {
									fieldsJSON.push({key:subfield.hoot_key,value:submember.hoot_val,group:field.name,id:subfield.id});
								}
							}					
						} else if(submember.hoot_key) {
							if(setVal===null){setVal=submember.defaultvalue;}
							fieldsJSON.push({key:submember.id,value:setVal,group:field.name,id:submember.id});
						} else if(submember.defaultvalue) {
							if(setVal===null){setVal=submember.defaultvalue;}
							fieldsJSON.push({key:submember.id,value:setVal,group:field.name,id:submember.id});
						}
		    		});
				}
    		});
    		
    		//change all in group to disabled if necessary
    		if(groupEnabled===false){
    			_.each(_.filter(fieldsJSON,{group:field.name}),function(p){p.value='Disabled';});
    		}
    		
    	});

    	return fieldsJSON;
    }
    return d3.rebind(_instance, _events, 'on');
}