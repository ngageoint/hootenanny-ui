Hoot.view.utilities.errorlog = function(context){

    // events
    var dispatch = d3.dispatch('close');
    
    // constructor
    function errorlog(){
        
    };

    errorlog.createContent = function(form){
      var loggingControls = form.append('div');
        
      loggingControls
      .classed('pad1y pad2x keyline-bottom col12', true)
      .append('a')
      .attr('href', '#')
      .text('Export Full Log')
      .classed('dark fr button loud pad2x big _icon plus margin0', true)
      .on('click', function () {
          Hoot.model.REST('exportLog', function(){

          });
      });
     
      loggingControls
      .classed('pad1y pad2x keyline-bottom col12', true)
      .append('a')
      .attr('href', '#')
      .text('Refresh')
      .classed('dark fr button loud pad2x big _icon check', true)
      .on('click', function () {
          errorlog.update();
      });


      errTextFieldset = form.append('div')
      .attr('id','errorlogbody')
          .classed('col12 fill-white small strong row10', true)
          .call(errorlog.showLog);
    };
    
    errorlog.showLog = function(container){ 
        container.append('textarea')
        .classed('col12 row10 overflow', true)
        .attr('id', 'hooterrorlogtext')
        .attr('readonly','readonly')
        .text("");
        
        errorlog.update();
        
    };
    
    errorlog.reportUIError = function(error){
        iD.data.hootConfig.currentError = error;
        errorlog.update();
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
                  iD.data.hootConfig.currentError = response.error;
              } else {
                  coreInfo =
                      response.name + " - Version: " + response.version + " - Built By: " + response.builtBy;
              }
              
            
            Hoot.model.REST(
              'servicesVersionInfo', 
              function(response) 
              {
                if(response.error){
                    iD.data.hootConfig.currentError = response.error;
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
                            iD.data.hootConfig.currentError = response.error;
                        } else {
                            coreDetail = JSON.stringify(response, undefined, 2);
                        }
                        
                        Hoot.model.REST(
                            'servicesVersionDetail', 
                             function(response) 
                             {
                                if(response.error){
                                    iD.data.hootConfig.currentError = response.error;
                                } else {
                                    serviceDetail = JSON.stringify(response, undefined, 2);
                                }
                                
                                
                                
                                Hoot.model.REST('getDebugLog', 
                                        function(response) {
                                            var logStr = "";
                                            if(response.error){
                                                iD.data.hootConfig.currentError = response.error;
                                            } else {
                                                logStr = response.log;
                                            }
                                            var text = "COREINFO:\n" + coreInfo + "\n";
                                            text += "SERVICEINFO:\n" + serviceInfo + "\n";
                                            text += "UIINFO:\n" + uiInfo + "\n";
                                            text += "COREDETAIL:\n" + coreDetail + "\n";
                                            text += "SERVICEDETAIL:\n" + serviceDetail + "\n";
                                            text += "TOMCATLOG (Truncated if > 50k):\n" + logStr + "\n";
                                    
                                            text += "UI LAST ERROR:\n" + JSON.stringify(iD.data.hootConfig.currentError) + "\n";
                                            d3.select('#hooterrorlogtext').text(text).value(text);
                                                
                                        }
                                    );
                                    
                                 });
                            });
                });
      }); 
  
    }
    

    
    return d3.rebind(errorlog, dispatch, 'on');
}