/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.errorlog is Log view in Manage tab where it displays current catalina log from server.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.errorlog = function(context){

    // events
    var dispatch = d3.dispatch('close');
    
    // constructor
    function errorlog(){
        
    };

    errorlog.createContent = function(form){
      var loggingControls = form.append('div').classed('pad1y col12',true);
        
      loggingControls
      .append('a')
      .attr('href', '#')
      .text('Export Full Log')
      .classed('dark fl button loud pad2x big _icon plus', true)
      .style('margin-right','5px')
      .on('click', function () {
          Hoot.model.REST('exportLog', function(){});
      });
     
      loggingControls
      .append('a')
      .attr('href', '#')
      .text('Refresh')
      .classed('dark fl button loud pad2x big _icon refresh', true)
      .on('click', function () {
          errorlog.update();
      });


      errTextFieldset = form.append('div')
      .attr('id','errorlogbody')
          .classed('col12 fill-white small strong', true)
          .call(errorlog.showLog);
    };
    
    errorlog.showLog = function(container){ 
    	//Error Log
    	var errorContainer = container.append('div').classed('col12 fill-light',true);
    	errorContainer.append('label')
        	.classed('logHeader', true)
        	.style('display','block')
        	.attr('id','errorLogLabel')
        	.text('Error Log');
        	
        	    	
    	errorContainer.append('textarea')
	        .classed('col12 row5 overflow', true)
	        .attr('id', 'hooterrorlogtext')
	        .attr('readonly','readonly')
	        .style('display','block')
	        .text("");
        
        errorlog.update();
        
        //UI Log
        var uiContainer = container.append('div').classed('col12 pad2y fill-light',true);
        uiContainer.append('label')
	    	.classed('logHeader', true)
	    	.attr('id','uiLogLabel')
	    	.style('display','block')
	    	.text('UI Log');
        
        uiContainer.append('div').append('textarea')
	        .classed('col12 row5 overflow', true)
	        .attr('id', 'hootuilogtext')
	        .attr('readonly','readonly')
	        .style('display','block')
	        .text("");
        
    };
    
    errorlog.reportUIError = function(error){
        iD.data.hootConfig.currentError = error;
        errorlog.updateUIlog();
    };
    
    errorlog.update = function(){

        var coreInfo = "";
        var serviceInfo = "";
        var uiInfo = "";
        
        var coreDetail = "";
        var serviceDetail = "";
          
        Hoot.model.REST(
          'coreVersionInfo', 
          function(response) 
          {
              if(response.error){
                  //iD.data.hootConfig.currentError = response.error;
                  coreInfo = "ERROR: " + response.error.responseText;
              } else {
                  coreInfo =
                      response.name + " - Version: " + response.version + " - Built By: " + response.builtBy;
              }
              
            
            Hoot.model.REST(
              'servicesVersionInfo', 
              function(response) 
              {
                if(response.error){
                    //iD.data.hootConfig.currentError = response.error;
                    serviceInfo = "ERROR: " + response.error.responseText;
                } else {
                    serviceInfo =
                    response.name + " - Version: " + response.version + " - Built By: " + response.builtBy;
                    if (response.name.indexOf("unknown") > -1)
                    {
                        serviceInfo += 
                            "\nUnable to find the Web Services build.info file.  Hootenanny Web services version information will be unavailable.";
                    }
                }
                
                  
                if (iD.data.buildInfo != null)
                {
                  buildInfoName = iD.data.buildInfo.name;
                  buildInfoVersion = iD.data.buildInfo.version;
                  buildInfoBuiltBy = iD.data.buildInfo.user;
                }
                else
                {
                  buildInfoName = "unknown";
                  buildInfoVersion = "unknown";
                  buildInfoBuiltBy = "unknown";
                }
                uiInfo = 
                    buildInfoName + " - Version: " + buildInfoVersion + " - Built By: " + buildInfoBuiltBy;
                if (iD.data.buildInfo == null)
                {
                    uiInfo += 
                        "\nUnable to find the iD buildInfo.json file.  Hootenanny iD version information will be unavailable.";
                }
                   
                          
                        Hoot.model.REST(
                            'coreVersionDetail', 
                    function(response) 
                    {
                                
                        if(response.error){
                            //iD.data.hootConfig.currentError = response.error;
                            coreDetail = "ERROR: " + response.error.responseText;
                        } else {
                            coreDetail = JSON.stringify(response, undefined, 2);
                        }
                        
                        Hoot.model.REST(
                            'servicesVersionDetail', 
                             function(response) 
                             {
                                if(response.error){
                                    //iD.data.hootConfig.currentError = response.error;
                                    serviceDetail = "ERROR: " + response.error.responseText;
                                } else {
                                    serviceDetail = JSON.stringify(response, undefined, 2);
                                }
                                
                                
                                
                                Hoot.model.REST('getDebugLog', 
                                        function(response) {
                                            var logStr = "";
                                            if(response.error){
                                                //iD.data.hootConfig.currentError = response.error;
                                                logStr = "ERROR: " + response.error.responseText;
                                            } else {
                                                logStr = response.log;
                                            }
                                            var text = "COREINFO:\n" + coreInfo + "\n";
                                            text += "SERVICEINFO:\n" + serviceInfo + "\n";
                                            text += "UIINFO:\n" + uiInfo + "\n";
                                            text += "COREDETAIL:\n" + coreDetail + "\n";
                                            text += "SERVICEDETAIL:\n" + serviceDetail + "\n";
                                            text += "TOMCATLOG (Truncated if > 50k):\n" + logStr + "\n";
                                            d3.select('#hooterrorlogtext').text(text).value(text);
                                            
                                            if(iD.data.hootConfig.currentError && !d3.select("#hootuilogtext").empty()){
                                                //check if currentError has already been listed
                                            	var uitext = d3.select('#hootuilogtext').text();
                                            	if(uitext.split('\n').indexOf(JSON.stringify(iD.data.hootConfig.currentError)) === -1){
                                            		uitext = JSON.stringify(iD.data.hootConfig.currentError) + "\n" + d3.select('#hootuilogtext').text();
                                            	}
                                                d3.select("#hootuilogtext").text(uitext).value(uitext);                                                	
                                            }
                                        }
                                    );
                                    
                                 });
                            });
                });
      }); 
  
    }
    
    errorlog.updateUIlog = function(){
    	if(iD.data.hootConfig.currentError && !d3.select("#hootuilogtext").empty()){
    		var uitext = JSON.stringify(iD.data.hootConfig.currentError) + "\n" + d3.select('#hootuilogtext').text();
    		d3.select("#hootuilogtext").text(uitext).value(uitext);  
    	}
    }
    
    return d3.rebind(errorlog, dispatch, 'on');
}
