Hoot.control.conflate = function (sidebar) {
    var event = d3.dispatch('merge');
    var confSelf;
    var conflate;
    var confData;
    
    var Conflate = {};
    
    Conflate.lastAdvSettingsText = 'Last Advanced Settings';
    
    Conflate.jobid = "test";
    Conflate.activate = function (data) {
        function subCompare(words, min_substring_length) {
            var needle = words[0].name;
            var haystack = words[1].name;
            min_substring_length = min_substring_length || 1;
            for (var i = needle.length; i >= min_substring_length; i--) {
                for (var j = 0; j <= (needle.length - i); j++) {
                    var substring = needle.substr(j, i);
                    var k = haystack.indexOf(substring);
                    if (k !== -1) {
                        return {
                            found: 1,
                            substring: substring,
                            needleIndex: j,
                            haystackIndex: k
                        };
                    }
                }
            }
            return {
                found: 0
            };
        }
        
        // Capture previous values if they exist
        Conflate.lastAdvFields = Conflate.lastAdvFields ? Conflate.lastAdvFields : null;
        Conflate.lastAdvValues = Conflate.lastAdvValues ? Conflate.lastAdvValues : null;
        Conflate.lastAdvDlg = Conflate.lastAdvDlg ? Conflate.lastAdvDlg : null;

        // Remove any previousely running advanced opt dlg
        if(Conflate.confAdvOptsDlg){Conflate.confAdvOptsDlg.remove();}
        if(Conflate.confAdvValsDlg){Conflate.confAdvValsDlg.remove();}
        Conflate.confAdvOptionsFields = null;
        Conflate.confAdvOptionsSelectedVal = null;
        Conflate.confAdvOptsDlg = null;
        Conflate.confAdvValsDlg = null;
        Conflate.confLastSetVals = null;
        confData = data;
        var refLayers = [];
        var primaryLayerName = '';
        var secondaryLayerName = '';
        var sels = d3.select('#sidebar2').selectAll('form')[0];
        if(sels && sels.length > 1){
            primaryLayerName = d3.select(sels[0]).datum().name;
            secondaryLayerName = d3.select(sels[1]).datum().name;
            refLayers.push(primaryLayerName);
            refLayers.push(secondaryLayerName);
        }

        var newName = subCompare(data, 4);
        if (!newName.found) {
            newName = 'Merged_' + Math.random().toString(16).substring(7);
        }
        else {
            newName = 'Merged_' + newName.substring + '_' + Math.random().toString(16).substring(7);
        }
        
        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
        
        var d_form = [
            {
                label: 'Save As',
                type: 'saveAs',
                placeholder: newName
            },
            {
            	label: 'Path',
            	type: 'pathname',
            	placeholder:'root',
            	combobox2:folderList,
            	readonly:'readonly'
            },
            {
            	label: 'New Folder Name (leave blank otherwise)',
            	type: 'newfoldername',
            	placeholder:''
            },
            {
                label: 'Type',
                type: 'ConfType',
                placeholder: 'Reference',
                combobox3: ['Reference', 'Average', 'Cookie Cutter & Horizontal'],
                onchange: function(d){
                	//reset form
					Conflate.confAdvOptionsFields = null;
					Conflate.confAdvOptionsSelectedVal = null;
					if(Conflate.confAdvOptsDlg){Conflate.confAdvOptsDlg.remove();}
					Conflate.confAdvOptsDlg = null;
					_advOpsFormEvent(false);
                },
                readonly:'readonly'
            },
            {
                label: 'Attribute Reference Layer',
                type: 'referenceLayer',
                placeholder: primaryLayerName,
                combobox: refLayers,
                readonly:'readonly'
            },
            {
                label: 'Generate Report?',
                type: 'isGenerateReport',
                placeholder: "false",
                combobox: ['true','false'],
                onchange: function(d){ 
                    var selVal = d3.selectAll('.reset.isGenerateReport').value();
                },
                readonly:'readonly',
                testmode:true
            }
        ];

        conflate = sidebar
            .append('form')
            .classed('hootConflate round space-bottom1', true);

        conflate.data(data)
            .append('a')
            .classed('button dark animate strong block _icon big conflate conflation pad2x pad1y js-toggle', true)
            .attr('href', '#')
            .text('Conflate')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if(d3.select("#sidebar2").selectAll("input").property('disabled')){return;}
                
                toggleForm(this);
            });
        var layerRef = conflate
            .append('fieldset')
            .classed('hidden pad1 keyline-all', true)
            .append('div')
            .classed('conflate-heading center contain space-bottom1 pad0x', true);




        layerRef
            .selectAll('.thumb')
            .data(data)
            .enter()
            .append('div')
            .attr('class', function (d) {
                return 'thumb round _icon data contain dark inline pad1 fill-' + d.color;
            })
            .attr('id', function(d) {
                var modifiedId = d.mapId.toString();
                return 'conflatethumbicon-' + modifiedId;
            })
            .on('click', function (d) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                event.layerVis(d);
            });




        var fieldset = conflate.select('fieldset');
        fieldset.selectAll('.form-field')
            .data(d_form)
            .enter()
            .append('div')
             .attr('id', function (field) {
                return 'containerof' + field.type;
            })
            .classed('form-field fill-white small keyline-all round space-bottom1', true)
            .html(function (field) {
                if(field.type=='ConfType'){
                	var retval = '';
                	retval += '<div style="opacity: 1;"><label class="pad1x pad0y strong fill-light round-top keyline-bottom" style="opacity: 1; max-width: 90%; display: inline-block; width: 90%;">';
                	retval += field.label;
                	retval += '</label><a id="confAdvOptsLnk" class="button pad1x pad0y strong fill-light round-top keyline-bottom" href="#" style="opacity: 1; max-width: 10%; display: inline-block;">►</a></div>';
                	return retval;
                } else {
                	return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + field.label + '</label>';	
                }            	
            })
            .append('input')
            .attr('type', 'text')
            .attr('value', function (a) {
                return a.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) {
                if (a.readonly){
                	d3.select(this).attr('readonly',true); 
                }
                
                if (a.testmode){
                	if(!d3.select('#enable_test_mode').property('checked'))
            		{d3.select(this.parentNode).style('display','none');}
                }
            	
            	if (a.combobox) {
                    var combo = d3.combobox()
                        .data(_.map(a.combobox, function (n) {
                            return {
                                value: n,
                                title: n
                            };
                        }));
                    var comboCnt = d3.select(this);
                    comboCnt.style('width', '100%')
                        .call(combo);

                    if(a.onchange){
                        comboCnt.on('change', a.onchange);
                    }

                 
                }
                
                if (a.combobox2){
                	var comboPathName = d3.combobox()
                    .data(_.map(a.combobox2, function (n) {
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
            		  
                      commonId = 0;
                      
            		  //get common path between lyrA and lyrB using folderID
            		  hoot.model.layers.setLayerLinks(function(a){
                		  var sels = d3.select('#sidebar2').selectAll('form')[0];
    	        	      var lyrA, lyrB;
                		  if(sels && sels.length > 1){
                			  lyrA = d3.select(sels[0]).datum().name;
    	        	          lyrB = d3.select(sels[1]).datum().name;
    	        	        }
                		  
                		  hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
                          var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
                          
                		  //build the path array for lyrA
                		  var lyrApath = [];
                		  lyrA = _.findWhere(hoot.model.layers.getAvailLayers(),{'name':lyrA});
                		  if(lyrA){
                			  lyrApath.push(lyrA.folderId);
                			  
                			  var folderId = lyrA.folderId;
                			  while (folderId!=0){
                				  var fldr = _.findWhere(folderList,{'id':folderId});
                				  if(fldr){
                					  lyrApath.push(fldr.parentId);
                					  folderId = fldr.parentId;
                				  }
                			  }
                		  }
                		  
                		  //if(lyrApath) is only 0, keep as root and move on
                		  
                		  lyrB = _.findWhere(hoot.model.layers.getAvailLayers(),{'name':lyrB});
                		  if(lyrB){
                			  var folderId = lyrB.folderId;
                			  if(lyrApath.indexOf(folderId)>-1){
                				  commonId = folderId;
                				  return;
                			  } else {
                    			  while (folderId!=0){
                    				  var fldr = _.findWhere(folderList,{'id':folderId});
                    				  if(fldr){
                    					  if(lyrApath.indexOf(fldr.parentId)>-1){
                            				  commonId = fldr.parentId;
                            				  return;
                            			  }
                    					  folderId = fldr.parentId;
                    				  }
                    			  }  
                			  }
                		  }
            		  });
            		 
            		  if(commonId!=0){
            			  var match = _.findWhere(folderList,{id:commonId});
            			  if(match){
            				  if(match){
            					  d3.select(this).value(match.folderPath)
            					  d3.select(this).attr('placeholder',match.folderPath)
            				  };
            			  }
            		  }

                    d3.select(this)
                    	.style('width', '100%')
                    	.call(comboPathName);                       
                }
                
                if (a.combobox3) {
                	
                	if(Conflate.lastAdvDlg){a.combobox3.push(Conflate.lastAdvSettingsText);}
                	
                    var combo = d3.combobox()
                        .data(_.map(a.combobox3, function (n) {
                            return {
                                value: n,
                                title: n
                            };
                        }));
                    var comboCnt = d3.select(this);
                    comboCnt.style('width', '100%')
                        .call(combo);

                    if(a.onchange){
                        comboCnt.on('change', a.onchange);
                    }

                 
                }
            });
        var actions = conflate
            .select('fieldset')
            .append('div')
            .classed('form-field pill col12', true);
        actions
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Cancel')
            .classed('fill-darken0 button round pad0y pad2x small strong', true)
            .attr('border-radius','4px')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                if (window.confirm('Cancel will remove any previously selected advanced options. Are you sure you want to cancel?')){
                    // Clean out advanced options information
                    Conflate.confAdvOptionsSelectedVal = null;

                    if(Conflate.confAdvOptsDlg){
                        Conflate.confAdvOptsDlg.remove();
                        _advOpsFormEvent(false);
                    }
                    Conflate.confAdvOptsDlg = null;
                    sidebar.selectAll('.js-toggle')
                        .classed('active', false);
                }
                
            });
        actions
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Conflate')
            .attr('id', 'conflate2')
            .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
            .attr('border-radius','4px')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                
              //check if layer with same name already exists...
            	if(conflate.selectAll('.saveAs').value()===''){
            		iD.ui.Alert("Please enter an output layer name.",'warning');
                    return;
            	}
                
                if(!_.isEmpty(_.filter(_.map(_.pluck(hoot.model.layers.getAvailLayers(),'name'),function(l){return l.substring(l.lastIndexOf('|')+1);}),function(f){return f == conflate.selectAll('.saveAs').value();})))
            	{
                	iD.ui.Alert("A layer already exists with this name. Please remove the current layer or select a new name for this layer.",'warning');
                    return;
                }
                
            	var resp = hoot.checkForUnallowedChar(conflate.selectAll('.saveAs').value());
            	if(resp !== true){
            		iD.ui.Alert(resp,'warning');
            		return;
                }
            	            	
            	resp = hoot.checkForUnallowedChar(conflate.selectAll('.newfoldername').value());
            	if(resp !== true){
            		iD.ui.Alert(resp,'warning');
            		return;
                }                
                
                var thisConfType = d3.selectAll('.reset.ConfType');
                var selVal = thisConfType.value();

				if(selVal==Conflate.lastAdvSettingsText){
					Conflate.confAdvOptionsFields = Conflate.lastAdvFields;
            		Conflate.confAdvOptionsSelectedVal = Conflate.lastAdvValues;
				}

                if(Conflate.confAdvOptionsSelectedVal === null){
                	//set Conflate.confAdvOptionsSelectedVal equal to defaults for default values
                	Conflate.confAdvOptionsFields = _getDefaultFields();
                	Conflate.confAdvOptionsSelectedVal = _getSelectedValues(null,Conflate.confAdvOptionsFields);
                }
                
                if(d3.selectAll('.reset.ConfType').value()=='Advanced Conflation'){
                	Conflate.lastAdvFields = _.map(Conflate.confAdvOptionsFields,_.clone);
                	Conflate.lastAdvValues = _.map(Conflate.confAdvOptionsSelectedVal,_.clone);
                	Conflate.lastAdvDlg = [];
	            	_.each(d3.select("#CustomConflationForm").selectAll('form').selectAll('input')[0],function(ai){
	            		var selAI = d3.select('#'+ai.id);
	            		Conflate.lastAdvDlg.push({id:ai.id,type:ai.type, checked:ai.checked, value:ai.value, disabled:selAI.property('disabled'),hidden:d3.select(selAI.node().parentNode).style('display')});
	            	});	 
                }
                
                submitLayer(conflate);
                event.merge(conflate, newName, Conflate.confAdvOptionsSelectedVal);
            });
        
        //TODO: Remove once change has been approved.  This button is for testing only.
        actions
        .append('input')
        .attr('type', 'submit')
        .attr('value', 'Get Values')
        .attr('id','confGetValuesBtn')
        .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
        .style('display','none')
        .style('display',function(){
        	if(d3.select('#enable_test_mode').property('checked')){return 'inline-block';} else {return 'none';}
         })
        .attr('border-radius','4px')
        .on('click', function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            
            if(d3.selectAll('.reset.ConfType').value()==Conflate.lastAdvSettingsText){
            	Conflate.confAdvOptionsFields = Conflate.lastAdvFields;
            	Conflate.confAdvOptionsSelectedVal = Conflate.lastAdvValues;
            } else {
            	if(Conflate.confAdvOptionsSelectedVal == null){
            		Conflate.confAdvOptionsFields = _getDefaultFields();
                	Conflate.confAdvOptionsSelectedVal = _getSelectedValues(null,Conflate.confAdvOptionsFields);            		
            	}
            }
            console.log(JSON.stringify(Conflate.confAdvOptionsSelectedVal));
        });
        
        d3.select("#confAdvOptsLnk").on('click',function(){
        	d3.event.stopPropagation();
            d3.event.preventDefault();


            // show Advanced dialog
            if(!Conflate.confAdvOptsDlg)
            {
            	_advOpsFormEvent(true);
                Conflate.confAdvOptsDlg = Conflate.advancedOptionsDlg();
               
                if(d3.selectAll('.reset.ConfType').value()==Conflate.lastAdvSettingsText && Conflate.lastAdvDlg){
            		_.each(Conflate.lastAdvDlg,function(ai){
            			var selAI = d3.select('#'+ai.id);
            			if(ai.type=='checkbox'){
            				selAI.property('checked',ai.checked);
            			} else {
            				selAI.value(ai.value);
            			}

            			selAI.property('disabled',ai.disabled);
            			if(ai.hidden.length>0){d3.select(selAI.node().parentNode).style('display',ai.hidden);}
            		});
                } else {
                    //replace current inputs with Last advanced options if required...
            		_.each(Conflate.confLastSetVals,function(ai){
            			var selAI = d3.select('#'+ai.id);
            			if(ai.type=='checkbox'){
            				selAI.property('checked',ai.checked);
            			} else {
            				selAI.value(ai.value);
            			}

            			selAI.property('disabled',ai.disabled);
            			if(ai.hidden.length>0){d3.select(selAI.node().parentNode).style('display',ai.hidden);}
            		});                	
                }
                
                if(Conflate.confAdvOptsDlg===null){_onCustomConflationFormError();}
                else{
                	//exitadvopts
                    Conflate.confAdvOptsDlg.on('exitadvopts', function(){
                    	Conflate.confLastSetVals = null;
                    	Conflate.confAdvOptionsSelectedVal = null;
                        
                        if(Conflate.confAdvOptsDlg){
                            Conflate.confAdvOptsDlg.remove();
                        }
                        Conflate.confAdvOptsDlg = null;
                        _advOpsFormEvent(false);
                    });
                }
            }
            else
            {
                if(Conflate.confAdvOptsDlg.classed('hidden')){
					Conflate.confAdvOptsDlg.classed('hidden', false);
					Conflate.confAdvOptsDlg.classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
					_advOpsFormEvent(true);
                } else {
					var advancedOptionsEvents = d3.dispatch('exitadvopts');
					if (window.confirm('Exit will remove any previously selected advanced options. Are you sure you want to exit?')){
						Conflate.confAdvOptionsSelectedVal = null;

	                    if(Conflate.confAdvOptsDlg){Conflate.confAdvOptsDlg.remove();}
						Conflate.confAdvOptsDlg = null;
						_advOpsFormEvent(false);
                	}                	
                }
            }
        });
        
        function toggleForm(context) {
            if (/active/g.test(context.className)) {
                sidebar.selectAll('.js-toggle')
                    .classed('active', false);
            }
            else {
                sidebar.selectAll('.js-toggle')
                    .classed('active', false);
                d3.select(context)
                    .classed('active', true);
            }
        }



        confSelf = this;

        var submitLayer = function (a) {
            var self = a;
            var color = 'green';
            self
                .attr('class', function () {
                    return 'round space-bottom1 loadingLayer ' + color;
                })
                .select('a')
                .remove();
            self.append('div')
                .attr('id', 'hootconflatecontrol')
                .classed('contain keyline-all round controller', true)
                .html('<div class="pad1 inline _loading"><span></span></div>' +
                    '<span class="strong pad1x">Conflating &#8230;</span>' +
                    '<button class="keyline-left action round-right inline _icon trash"></button>')
                .select('button')
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    if (window.confirm('Are you sure you want to cancel conflation job?')) {

                        d3.select('#hootconflatecontrol').html('<div class="pad1 inline _loading"><span></span></div>' +
                                '<span class="strong pad1x">Cancelling &#8230;</span>') ;

                        var jobId = confSelf.jobid;
                        var saveAsCntrl = d3.selectAll('.reset.saveAs');
                        var mapId = saveAsCntrl.value();

                        var data = {};
                        data.jobid = jobId;
                        data.mapid = mapId;
                        Hoot.model.REST('cancel', data, function (a) {
                        	iD.ui.Alert('Job ID: ' + jobId + ' has been cancelled. ','notice');

                        });
                        //resetForm(self);
                        return;
                    }
                });

        };
    };
    Conflate.deactivate = function () {
        d3.selectAll('.hootConflate').remove();
    };

    Conflate.validate = function(data){
		var invalidInput = false;
		var invalidText = "";

		var target = d3.select('#' + data.property('id'));
		if(target.node().classList.contains('list')){
			//validate combobox entry
			var curOpts = _.findWhere(target.data()[0].children,{'id':data.property('id')});
			var curVal = target.node().value;
			if(_.findWhere(curOpts.combobox,{'name':curVal})===undefined){
				target.value(curOpts.placeholder);
			}	
		} else {
		    //make sure it is double
			if(isNaN(data.value())){
				invalidInput = true;
				invalidText = "Input value must be a valid number!";
			} else {
			//make sure it is w/in min and max
				var val = parseFloat(target.value());
				if(data.property('min')){
					if(!isNaN(data.property('min'))){
						var min = parseFloat(data.property('min'));
						if(val < min){
							invalidInput=true;
							invalidText="Value must be greater than " + min.toString();
						} else{
							invalidInput=false;
						}
					} 
				}
				if(data.property('max')){
					if(!isNaN(data.property('max'))){
						var max = parseFloat(data.property('max'));
						if(val>max){
							invalidInput=true;
							invalidText="Value must be less than " + max.toString();
						} else {
							invalidInput=false;
						}					
					}
				}
			}
			target.classed('invalid-input',invalidInput);
			target.property('title',invalidText);	
		}
    };

    Conflate.changeSymbology = function (name, color) {
        if(confData){

            var entity = _.find(confData, function(d){
                return d.name === name;
            });

            if(entity) {
                var color = entity.color;

                var modifiedId = entity.mapId.toString();
                var headerSym = d3.select('#conflatethumbicon-' + modifiedId);
                
                if(headerSym && headerSym.size()>0){

                    var classStr = headerSym.attr('class');
                    var classList = classStr.split(' ');
                    var colorAttrib = _.find(classList,function(cls){
                        return cls.indexOf('fill-') === 0;
                    });
                    

                    if(color === 'osm') {
                        headerSym.classed('data', false);
                        headerSym.classed('_osm', true);

                        if(colorAttrib){
                            headerSym.classed(colorAttrib, false);
                        }
                    } else {
                        headerSym.classed('_osm', false);
                        headerSym.classed('data', true);

                        if(colorAttrib){
                            headerSym.classed(colorAttrib, false);
                            headerSym.classed('fill-' + color, true);
                        } else {
                            headerSym.classed('fill-' + color, true);
                        }
                    }
                        
                }
            }
            
        }
        
    };

    // Logic for opening/closing advanced options form
    _advOpsFormEvent = function(frmVis){
    	if(frmVis){
    		d3.select("#confAdvOptsLnk").text("◄");            
    	} else {
    		d3.select("#confAdvOptsLnk").text("►");
    	}
    	d3.select("#sidebar2").selectAll("input").property('disabled',frmVis);
    };
    
    _getDefaultFields = function(){
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
        					var currentMember = _.findWhere(this.members,{id:replaceMember.id});
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
        						var foundItem = _.findWhere(this.members,{id:replaceMember.id});
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
	        						var foundItem = _.findWhere(this.members,{id:replaceMember.id});
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
    
    // Get fields and values
    _gatherFieldValues = function(fieldsMetaData){
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
						var hk = _.findWhere(fieldsJSON,{'key':field.hoot_key});
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
								var hk = _.findWhere(fieldsJSON,{'key':subfield.hoot_key});
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
    
    // Create advance options fields
    _generateFields = function(fieldsMetaData) {
        var formFields = [];
        if(fieldsMetaData){
            _.each(fieldsMetaData, function(meta){
                var field = {};
                field.id = meta.id;
                field.label = meta.name;
                field.type = meta.elem_type;
                field.placeholder = meta.defaultvalue;
                field.description = meta.description;
                field.required = meta.required;
                field.children = [];
                
                if(meta.elem_type == 'group'){
                    field.heading=meta.name;
                    //formFields.push(field);

                    //Now add the remaining fields within the group
                    _.each(meta.members,function(submeta){
                        var subfield = {};
                        
                        subfield.id = submeta.id;
                        subfield.label = submeta.name;
                        subfield.type = submeta.elem_type;
                        subfield.placeholder = submeta.defaultvalue;
                        subfield.description = submeta.description;

                        if(submeta.elem_type == 'bool'){
                            if(submeta.members){
                            	subfield.combobox = submeta.members;
                            	_.each(submeta.members,function(d){
                            	   if (d.isDefault=='true'){subfield.placeholder=d.name;}
                            	});
                            } else {
                            	subfield.combobox = [{"value":"true"}, {"value":"false"}];
                            }
                        } else if(submeta.elem_type == 'list') {
                            if(submeta.members){
                                subfield.combobox = submeta.members;
                                subfield.onchange = submeta.onchange;
                            } 
                        } else if(submeta.elem_type == 'double') {
                            subfield.maxvalue = submeta.maxvalue;
                            subfield.minvalue = submeta.minvalue;
                            subfield.onchange = "Hoot.control.conflate().validate(d3.select(this));";
                        } else if (submeta.elem_type == 'checkbox') {
                        	subfield.onchange = submeta.onchange;
                        } else if (submeta.elem_type == 'checkplus') {
                        	if(submeta.members){
                        		var subchecks = [];
                        		_.each(submeta.members,function(sc){
                        			var subcheck={};
                        			subcheck.id = sc.id;
                        			subcheck.label = sc.name;
                        			subcheck.type = sc.elem_type;
                        			subcheck.placeholder = sc.defaultvalue;
                        			subcheck.description = sc.description;
                        			subcheck.required = sc.required;
                        			subchecks.push(subcheck);
                        		});
                        		
                        		subfield.subchecks = subchecks;
                        		subfield.onchange = submeta.onchange;
                        	}
                        }

                        if(submeta.dependency){
                            subfield.dependency = submeta.dependency;
                        }

                        if(submeta.dependents){
                            subfield.dependents = submeta.dependents;
                        }
                        
                        if(submeta.required){
                        	subfield.required=submeta.required;
                        }

                        field.children.push(subfield);
                    });
                }
                
                formFields.push(field);
                
            });
        }
        
        return formFields;
    };
    
    // Iterate through meta value and get user selected values
    _getSelectedValues = function(advform, fieldsMetaData){
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
						}

						if(submeta.elem_type == 'checkbox' || submeta.elem_type=='checkplus') {
							if(fieldId){
								//var isHidden = advform.select('#' + fieldId).classed('hidden');
								advform? selVal = advform.select('#' + fieldId).property('checked').toString() : submeta.defaultvalue;
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

								if(submeta.elem_type=='checkplus'){
									//Only take value if checkplus is true!
									var cplusEnabled = false;
									advform? cplusEnabled = advform.select('#' + submeta.id).property('checked').toString() : submeta.defaultvalue == 'true';			
									if (cplusEnabled == true){
									_.each(submeta.members,function(c){
										var res = {};
										var selVal = '';
										if(c.id){
											//isHidden = advform.select('#' + c.id).classed('hidden');
											if(c.elem_type=='checkbox'){
												advform? selVal = advform.select('#' + c.id).property('checked').toString() : c.defaultvalue;													
											} else {
												advform? selVal = advform.select('#' + c.id).value() : c.defaultvalue;
											}
											if(selVal.length === 0 && c.defaultvalue.length > 0){selVal = c.defaultvalue;}	
											if(selVal.length > 0){// && !isHidden){
												res.name = c.hoot_key;
												res.value = selVal;
												results.push(res);
											}
										}
									});}
								}
							}
						} else if (submeta.elem_type=='list') {
							advform? selVal = advform.select('#' + fieldId).value(): selVal = submeta.defaultvalue;
							if(selVal.length === 0 && submeta.defaultvalue.length > 0){selVal = submeta.defaultvalue;}
							if(submeta.members){
								var selMember = _.findWhere(submeta.members,{'name':selVal});
								if (selMember){
									if(selMember.members){
										_.each(selMember.members,function(subMember){
											var res = {};
											if(subMember.hoot_key && subMember.defaultvalue.length>0){
												//see if hoot_key already exists.  If it does, add to value.  If not, create.
												var idx = results.indexOf(_.find(results,function(obj){return obj.name == subMember.hoot_key}));
												if(idx>-1){
													if(results[idx].value.indexOf(subMember.defaultvalue)==-1)
													{results[idx].value += ';'+subMember.defaultvalue ;}
												} else {
													res.name = subMember.hoot_key;
													res.value = subMember.defaultvalue;
													results.push(res);
												}
											}
										});
									}
								}
							}
						} else {
							if(fieldId){
								//var isHidden = advform.select('#' + fieldId).classed('hidden');
								advform? selVal = advform.select('#' + fieldId).value(): selVal = submeta.defaultvalue;
								if(selVal !== null)
								{if(selVal.length === 0 && submeta.defaultvalue.length > 0){selVal = submeta.defaultvalue;}
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
								}}
							}     
						}

				});
            }
            }
        }
        return results;
    }

    Conflate.advancedValuesDlg = function () {
	    try{	
	    	var advancedValuesEvents = d3.dispatch('exitadvvals');
	    	if(Conflate.confAdvOptsDlg==null){return;}
	    	
	    	var modalbg = d3.select('#CustomConflationForm').node().parentNode;
	    	var ingestDiv = d3.select(modalbg)
	    		.append('div')
	    		.attr('id','CustomConflationValues')
	    		.classed('fillL map-overlay col8 custom-conflation',true);
	
			ingestDiv.append('div')
			.classed('big pad1y pad1x keyline-bottom space-bottom2', true)
	            .append('h4')
	            .text('Advanced Conflation Values')
	            .append('div')
	            .classed('fr _icon x point', true)
	            .attr('id','CloseCustomConflationFormBtn')
	            .on('click', function () {
	                    advancedValuesEvents.exitadvvals();
	            });
	
	    	//for each field, provide value/placeholder
	    	if(Conflate.confAdvOptionsFields==null){return;}
	    	var d_json = _gatherFieldValues(Conflate.confAdvOptionsFields);
	    	var d_table = ingestDiv.append('div')
				.classed('big pad1x keyline-bottom space-bottom2',true)
				.style({'max-height': '800px','overflow-y': 'auto','width':'99%'})
				.append('table').attr('id','advValTable').classed('custom-conflation-table',true);
			var thead = d3.select("#advValTable").append('thead');
			var tbody = d3.select("#advValTable").append('tbody');
	    	
			// create the table header
			var thead = d3.select("thead").selectAll("th")
				.data(d3.keys(d_json[0]).splice(0,3))
				.enter().append("th").text(function(d){return d.toLowerCase();});
			
			// fill the table
			// create rows
			var tr = d3.select("tbody").selectAll("tr")
				.data(d_json).enter().append("tr")
				.attr('id',function(d){return 'tr_' + d.id;});
	
			// cells
			var td = tr.selectAll("td")
			  .data(function(d){
			  	return [d.key,d.value,d.group]})
			  .enter().append("td")
			  .text(function(d) {
			  	return d})	
			  .style('word-break','break-all');
	
	    	return d3.rebind(ingestDiv, advancedValuesEvents, 'on');
	    } catch(err){
	    	console.log(err);
	    	return null;
	    }
    }
        
    Conflate.advancedOptionsDlg = function () { 
        try{
	    	var advancedOptionsEvents = d3.dispatch('exitadvopts');
	        
	    	if(Conflate.confAdvOptionsFields==null){
	        	if(d3.selectAll('.reset.ConfType').value()==Conflate.lastAdvSettingsText){
	        		Conflate.confAdvOptionsFields = Conflate.lastAdvFields;
	        	} else {
	        		Conflate.confAdvOptionsFields = _getDefaultFields();
	        	}
	        }
	        
    	    var d_form = _generateFields(Conflate.confAdvOptionsFields);
    	    	
	        var modalbg = d3.select('#content') //body
	            .append('div')
	            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true)
	            .style('z-index','1');
	        var ingestDiv = modalbg.append('div')
	        	.attr('id','CustomConflationForm')
	            .classed('fillL map-overlay col4 custom-conflation',true); //'contain col4 pad1 fill-white round modal'       
	        var _form = ingestDiv.append('form');
	        _form.classed('round space-bottom1', true)
	            .append('div')
	            .classed('big pad1y pad1x keyline-bottom space-bottom2', true)
	            .append('h4')
	            .text('Advanced Conflation Options')
	            .append('div')
	            .classed('fr _icon x point', true)
	            .attr('id','CloseCustomConflationFormBtn')
	            .on('click', function () {
	                //modalbg.remove();
	                //modalbg.classed('hidden', true);
	
	                if (window.confirm('Exit will remove any previously selected advanced options. Are you sure you want to exit?')){
	                    advancedOptionsEvents.exitadvopts();
	                }
	                
	            });
	
	        var fieldsContainer = _form.append('div')
	        .classed('keyline-all round', true)
	        .style({'max-height': '800px','overflow-y': 'auto','width':'99%'});
	        
	        var fieldset = fieldsContainer.append('fieldset')
	            //Added for testing purposes 
	        	.on('change',function(event)
	             {
	             	var evt = event||window.event;
	             	var target = evt.target||evt.srcElement;
	             	var setVal = null;
	             	if(target.type=='checkbox'){
	             		setVal = d3.select('#'+target.id).property('checked');
	             	} else {
	             		setVal = d3.select('#'+target.id).value();
	             	}
	             	
	             	if(setVal != null){
	             		if(d3.selectAll('#tr_' + target.id).selectAll('td:nth-child(2)').length){
	             			d3.selectAll('#tr_' + target.id).selectAll('td:nth-child(2)').text(setVal);
	             			
	             			//Special exceptions
	             			if(target.id.indexOf('enable')>-1){
								//Need to take care of everything in group that is on/off when enabled/disabled
	             				var arrInputs = d3.select(d3.select(target).node().parentNode.parentNode.parentNode.parentNode).selectAll('input');
	             				
	             				
	             				arrInputs.each(function(){
	             					if(setVal)
	             					{
										var rowVal = d3.select(this).value();
										if(rowVal=='on'){rowVal='true'} else if (rowVal=='off'){rowVal='false'}
										if(rowVal==''){rowVal=d3.select('#'+this.id).attr('placeholder');}
										d3.selectAll('#tr_' + this.id).selectAll('td:nth-child(2)').text(rowVal);	
	             					} else {
	             						d3.selectAll('#tr_' + this.id).selectAll('td:nth-child(2)').text('Disabled');	
	             					}
	             				});
	             			}
	
	
	             			if(d3.select(target).on('change') && target.classList.contains('list')){
	             				var subitem = d3.select(target).on('change').toString();
	             				_.each(_.uniq(subitem.match(/#\w+/g)),function(uniqueItem){
		             				if(!d3.select(uniqueItem).empty()){
		             					// get current value and change
		             					var subVal =  d3.select(uniqueItem).value();
		             					if(subVal == ''){subVal = d3.select(uniqueItem).property('checked');}
		             					d3.selectAll('#tr_' + uniqueItem.substr(1)).selectAll('td:nth-child(2)').text(subVal);
		             				}
	             				});
	             			}
	             		} else {
	             			try{
								// check if it is part of a checkplus
	             				if(d3.select(d3.select(target).node().parentNode.parentNode).selectAll('div').length>0){
	             					// get the sibling div value and set to disabled if unchecked, set to value if checked
	             					var childID = d3.select(d3.select(target).node().parentNode.parentNode).select('div').selectAll('input').property('id');
	             					if(d3.select(target).property('checked')){
	             						//need to select by type...
	             						if(d3.select('#' + childID).attr('type')=='checkbox'){
	        								d3.selectAll('#tr_'+childID).selectAll('td:nth-child(2)').text(d3.select('#' + childID).property('checked').toString());	
	             						} else {
	        								var tmpval = d3.select('#' + childID).value() || d3.select('#' + childID).attr('placeholder');
	        								d3.selectAll('#tr_'+childID).selectAll('td:nth-child(2)').text(tmpval);
	             						}
	             					} else {
	             						if(!target.classList.contains('list')){d3.selectAll('#tr_'+childID).selectAll('td:nth-child(2)').text('N/A')};
	             					}
	             				}
								
	             				// check if part of cleaning opts
	             				var cleaningOpts = _.findWhere(Conflate.confAdvOptionsFields,{'name':'Cleaning Options'});
								if(cleaningOpts){
									var hootval = _.findWhere(cleaningOpts.members,{'id':target.id}).hoot_val;
									if(hootval){
										var retVal = d3.selectAll('#tr_hoot_cleaning_options').selectAll('td:nth-child(2)').text();
										if(setVal==true){retVal += ";" + hootval;} else {retVal = retVal.replace(';'+hootval,'');}
										retVal = retVal.split(';');
										var trVal = '';
										_.each(_.pluck(cleaningOpts.members,'hoot_val'),function(copt){
											if(retVal.indexOf(copt)>-1){
												trVal += copt + ';';}										
										})
										if(trVal.length>0){trVal=trVal.substring(0,trVal.length-1);}
										d3.selectAll('#tr_hoot_cleaning_options').selectAll('td:nth-child(2)').text(trVal);
									}
								}
	             			} catch(e) {var a=1;}
	             		}
	             	}             	
	             })
	            .selectAll('.form-field')
	            .data(d_form);
	        fieldset.enter()
	            .append('div')
	            //create collapsable div for each header
	            .select(function(s){
	                var styles = 'form-field fill-white small keyline-all round space-bottom1';
	                if(s.dependency){
	                    styles += ' hidden';                  
	                }
	                if(s.required){
	                    if(s.required=='true'){
	                    	styles += ' hidden';   
	                    }
	                }
	
	                d3.select(this).classed(styles, true)
	                .attr('id', s.type + '_container')
	                .append('label')
	                .attr('id',s.id+'_label')
	                .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
	                .text(function (d) {
	                    return d.label;
	                })
	                .on('click', function () {
			            var grp = d3.select(this).node().nextSibling;
			            if(grp.classList.length==0){
			            	d3.select(grp).classed('custom-collapse',true)
			            } else {
			            	d3.select(grp).classed('custom-collapse',false)
			            }
			        });
	                
	                d3.select(this).append('div').attr('id',s.id+'_group').classed('custom-collapse',true);
	                var parent = d3.select('#'+s.id+'_group');
					var enableInputs = false;
					if(s.children[0].label=='Enabled'){
						enableInputs = !(s.children[0].placeholder == 'true');
					}
	
	                //now loop through children
	                _.each(s.children, function(c){
	            		var styles = 'form-field fill-white small';
	                    if(c.dependency){
	                        styles += ' hidden';                  
	                    }
	                    if(c.required){
	                        if(c.required=='true'){
	                        	styles += ' hidden';   
	                        }
	                    }
						
						var child = parent.append('div')
							.classed(styles,true)						
							.attr('id',c.type + '_container');  
						            		
	            		// TODO: Need to clean this up
		                if(c.multilist){	
		                	child.append('label').classed('pad1x fill-light round-top', true).text(c.label).property('title',c.description);
							
		                	var options = "";
		                    _.each(c.multilist, function(item){
		                        options += '<option value="' + item.hoot_val + '">' + item.name + '</option>';
		                    })
		                    child.append('div')
		                        .classed('contain', true)
		                        .style('width', '100%')
		                        .html('<select multiple style="width:100%;height:80px" id="' + 'ml' + c.type + '">' + options + '</select>');
		                } else if(c.type=='checkbox' || c.type=='checkplus'){
		                	child.append('div')
		                	.classed('contain', true)
		                    .html(function(){
		                    	var retval = '<label class="pad1x" style="opacity: 1;" title="' + c.description + '">';
			                	retval += '<input type="checkbox" class="reset" id="' + c.id + '" ';
			                	retval += 'style="opacity: 1;"';
			                	if(c.placeholder){if(c.placeholder=="true"){retval += ' checked ';}}
			                	retval += '>' + c.label+'</label>';		                	
			                	return retval;	
		                    });
		                	
		                	var currentDiv = d3.select("#"+c.id);
		                	if(c.onchange){
		                		var fn = new Function(c.onchange);
		                		currentDiv.on('change',fn);
	                        } 
		                	
		                	if(c.type=='checkplus'){
		                		var parentDiv = d3.select(currentDiv.node().parentNode.parentNode);
		                		_.each(c.subchecks,function(subcheck){
		                			if(subcheck.type=='checkbox'){
										parentDiv.append('div').classed('contain',true)
										.html(function(){
											var retval = '<label class="pad1x ' + c.id + '_child" style="opacity: 1;" title="' + c.description + '">';
											retval += '<input type="checkbox" class="reset" id="' + subcheck.id + '" ';
											retval += 'style="opacity: 1;"';
											if(subcheck.placeholder){if(subcheck.placeholder=="true"){retval += ' checked ';}}
											retval += '>' + subcheck.label+'</label>';		                	
											return retval;		
										});
		                			} else {
										var newDiv = parentDiv.append('div').classed('contain ' + c.id + '_child',true);
										if(subcheck.required){
					                        if(subcheck.required=='true'){
					                        	newDiv.classed('hidden',true);   
					                        }
					                    }
										newDiv.append('label').classed('pad1x', true).style('display','inline-block').text(subcheck.label).property('title',subcheck.description);
										newDiv.append('div').classed('contain',true).style('display','inline-block').append('input').attr('type','text').attr('placeholder',subcheck.placeholder).attr('class','reset ' + subcheck.type).attr('id',subcheck.id);
		                			}
		                		});
		                	}
		                } else {
		                	child.append('label').classed('pad1x', true).style('display','inline-block').text(c.label).property('title',c.description);
		                	
		                	child.append('div')
		                        .classed('contain', true)
		                        .style('display','inline-block')
		                        .append('input')
		                        .attr('type', 'text')
		                        .attr('placeholder', function () {
		                            return c.placeholder;
		                        })
		                        .attr('class', function () {
		                            return 'reset ' + c.type;
		                        })
		                        .attr('id', function(){
		                            return c.id;
		                        })
		                        .select(function () {
		                             if (c.combobox) {
		                            	d3.select('#'+c.id).attr('readonly',true);
	                                    var combo = d3.combobox()
	                                        .data(_.map(c.combobox, function (n) {
	                                            return {
	                                                value: n.name,
	                                                title: n.name,
	                                                id:n.id
	                                            };
	                                        }));
	                                    var comboEng = d3.select(this);
	                                    comboEng.style('width', '100%')
	                                        .call(combo); 
	                                    
	                                    //loop through each combobox member to see if it has children...
	                                    var parentDiv = d3.select(d3.select("#"+c.id).node().parentNode);
	                                    _.each(c.combobox,function(subcombo){
	                                    	if(subcombo.members){
	                                    		var newDiv = parentDiv.append('div').classed('contain hoot_road_opt_engine_group ' + subcombo.name + '_engine_group',true);
	                                    		if(subcombo.name!=c.placeholder){newDiv.style('display','none');}
		                                    	_.each(subcombo.members,function(subopt){
			                                    	if(subopt.type=='checkbox'){
			                                    		newDiv.append('div').classed('contain',true)
			    										.html(function(){
			    											var retval = '<label class="pad1x ' + c.id + '_' + subcombo.name + '_child" style="opacity: 1;" title="' + subopt.description + '">';
			    											retval += '<input type="checkbox" class="reset" id="' + subopt.id + '" ';
			    											retval += 'style="opacity: 1;"';
			    											if(subopt.placeholder){if(subopt.placeholder=="true"){retval += ' checked ';}}
			    											retval += '>' + subopt.label+'</label>';		                	
			    											return retval;		
			    										}); 		                                    		
			                                    	} else {
			                                    		var subDiv = newDiv.append('div').classed('contain ' + c.id + '_' + subcombo.name + '_child',true);
				                                    	if(subopt.required){if(subopt.required=='true'){subDiv.classed('hidden',true);}}
				                                    	subDiv.append('label')
				                                    		.classed('pad1x', true)
				                                    		.style('display','inline-block')
				                                    		.text(subopt.name)
				                                    		.property('title',subopt.description);
														subDiv.append('div')
															.classed('contain',true)
															.style('display','inline-block')
															.append('input')
															.attr('type','text')
															.attr('placeholder',subopt.defaultvalue)
															.attr('class','reset ' + subopt.type)
															.attr('id',subopt.id);
			                                    	}		                                    	                                    		
		                                    	});
	                                    }
	                                    });
		                                }
	
									if(c.onchange){
										var fn = new Function(c.onchange);
										d3.select(this).on('change',fn);
									}  
	
		                            if(c.dependency){
		                                    child.classed('hidden', true);
		                                    var controlField = d3.select('#ml' + c.dependency.fieldname);
		                                    controlField.on('change', function(){
		                                        _onChangeMultiList(d3.select(this));
		                                    })
		                                }
		                        });
	
		                        if(c.minvalue){
		                        	c.minvalue.length>0? d3.select('#'+c.id).attr('min',c.minvalue):d3.select('#'+c.id).attr('min','na');
		                        }
		                        if(c.maxvalue){
		                        	c.maxvalue.length>0? d3.select('#'+c.id).attr('max',c.maxvalue):d3.select('#'+c.id).attr('max','na');
		                        }
			                }
	            	});
	
	            	parent.selectAll("input:not([id*=enable])").property('disabled',enableInputs);
	            })
	            
	
	        // This will go through the multilist fields and select the field marked isDefault
	        fieldset.select(function(s1){
	            _.each(s1.children,function(ss){
					if(ss.multilist){
						var mlist = ss.multilist;
						var listField = d3.select('#ml' + ss.type);
						 _.each(listField.node().children, function(c){
							var opt = d3.select(c).node();
							_.each(mlist, function(ml){
								if(ml.hoot_val === opt.value && ml.isDefault === "true"){
									opt.selected = true;
								}
								if(ml.hoot_val === opt.value && ml.required){
									if(ml.required=='true'){
										opt.style.display='none';
									}
								}
							});
						 })
						 // Manually send out on change event
						 _onChangeMultiList(listField);
					}
	            })
	        });
	
	
	        var isCancel = false;
	        var jobIds = null;
	        var mapIds = null;
	        var submitExp = ingestDiv.append('div')
	        .classed('form-field col12 left ', true);
	         submitExp.append('span')
	        .classed('round strong big loud dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	        .text('Apply')
	        .on('click', function () {
	            if(d3.select('#CustomConflationForm').selectAll('.invalid-input')[0].length==0){        	
	            	//Capture current values
	            	Conflate.confLastSetVals = [];
	            	_.each(d3.select("#CustomConflationForm").selectAll('form').selectAll('input')[0],function(ai){
	            		var selAI = d3.select('#'+ai.id);
	            		Conflate.confLastSetVals.push({id:ai.id,type:ai.type, checked:ai.checked, value:ai.value, disabled:selAI.property('disabled'),hidden:d3.select(selAI.node().parentNode).style('display')});
	            	});	    

	            	Conflate.confAdvOptionsSelectedVal = _getSelectedValues(_form, Conflate.confAdvOptionsFields);
		            //modalbg.remove();
		            modalbg.classed('hidden', true);
		            _advOpsFormEvent(false);
		            d3.select('.ConfType').value('Advanced Conflation');
	            } else{
	            	//notify that some values are invalid and leave window open
	            	iD.ui.Alert('Some values in the form are invalid and must be adjusted before completing custom conflation.','warning');
	            }            	
	        });
         
	         //Cancel button
	        var cancelExp = ingestDiv.append('div')
	        .classed('form-field col12 left ', true);
	        cancelExp.append('span')
	        .classed('round strong big loud-red dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	        .text('Cancel')
	        .on('click', function () {
	        	//Reset to most recent values
	        	if (Conflate.confLastSetVals != null){
	        		//replace current inputs with Conflate.confLastSetVals
	        		_.each(Conflate.confLastSetVals,function(ai){
	        			var selAI = d3.select('#'+ai.id);
	        			if(ai.type=='checkbox'){
	        				selAI.property('checked',ai.checked);
	        			} else {
	        				selAI.value(ai.value);
	        			}
	        			
	        			selAI.property('disabled',ai.disabled);
	        			if(ai.hidden.length>0){d3.select(selAI.node().parentNode).style('display',ai.hidden);}
	        		});
	        		
	        		modalbg.classed('hidden', true);
	        	} else {
	        		Conflate.confLastSetVals = null;
	        		Conflate.confAdvOptionsSelectedVal = null;
                    if(Conflate.confAdvOptsDlg){Conflate.confAdvOptsDlg.remove();}
                    Conflate.confAdvOptsDlg = null;
                 }
	        	_advOpsFormEvent(false);
	        });	         
	        
	         //view values - testing only
	         var valuesExp = ingestDiv.append('div')
	        .classed('form-field col12 left',true);
	         valuesExp.append('span')
	         .classed('round strong center col10 margin1 point', true)
	         .classed('inline row1 fl col10 pad1y', true)
	         .style('display',function(){
	        	if(d3.select('#enable_test_mode').property('checked')){
	        		return 'inline-block';
	        	} else {
	        		return 'none';
	        	}
	         })
	         .text('View Values')
	         .attr('id','confViewValuesSpan')
	         .on('click', function () {
	        	 d3.event.stopPropagation();
	        	 d3.event.preventDefault();
	        	 
	        	 if(d3.select('#CustomConflationValues')[0][0]==null){
	        		 Conflate.confAdvValsDlg = Conflate.advancedValuesDlg();
	                 if(Conflate.confAdvValsDlg==null){_onCustomConflationFormError();}
	                 else{
	                	//exitadvvals
	                     Conflate.confAdvValsDlg.on('exitadvvals', function(){
	                         if(Conflate.confAdvValsDlg){Conflate.confAdvValsDlg.remove();}
	                         Conflate.confAdvValsDlg = null;
	                     }); 
	                 }
	        	 }
	         });
	         
	         //return modalbg;
	         return d3.rebind(modalbg, advancedOptionsEvents, 'on');
	    }catch(err){console.log(err);return null;}
     };

    _onCustomConflationFormError = function(){
    	iD.ui.Alert('An error occurred while trying to open a custom conflation window. If this problem persists, default values will be used for conflation based on selected type.','error');
    	Conflate.confAdvOptsDlg = null;
    	Conflate.confAdvValsDlg = null;
    	d3.select('#content').selectAll('div .custom-conflation').remove();
    	d3.select('#content').selectAll('div .fill-darken3').remove()
    	_advOpsFormEvent(false);
    };

    _onChangeMultiList = function(selField){
        var enableField = null;
         _.each(selField.node().children, function(c){
            var isSel = d3.select(c).node().selected;
            if(isSel === true){                                               
                var sel = d3.select(c).value();

                _.each(iD.data.hootConfAdvOps, function(mt){
                    if(('ml' + mt.name) == selField.node().id){
                        if(mt.dependents){
                            _.each(mt.dependents, function(dep){
                                if(sel == dep.value){
                                    enableField = dep.name;
                                   // d3.select('#' + dep.name + '_container').classed('hidden', false);
                                   // d3.select('.reset.' + dep.name).classed('hidden', false);
                                } else {
                                    d3.select('#' + dep.name + '_container').classed('hidden', true);
                                    d3.select('.reset.' + dep.name).classed('hidden', true);
                                }
                            });
                        }
                    }
                })
            }
         })

        if(enableField){
            d3.select('#' + enableField + '_container').classed('hidden', false);
            d3.select('.reset.' + enableField).classed('hidden', false);
        }
    }

    return d3.rebind(Conflate, event, 'on');
};