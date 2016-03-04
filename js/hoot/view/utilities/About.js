/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities.about is Hootenanny about view where it shows version and other detailed information of
//  core, service and UI modules.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities.about = function(context){

    // events
    var dispatch = d3.dispatch('close');
    
    // constructor
    function about(){
        
    };

    about.createContent = function(form){
      form.append('div')
      	.classed('col12',true)
      	.append('label')
      	.classed('logHeader', true)
    	.style('display','block')
    	.attr('id','aboutLabel')
    	.text('About Hootenanny');
      
      var mainContainer = form.append('div').classed('col12 pad1y fill-light',true);
      mainContainer.append('label')
      	.classed('aboutHeader',true)
      	.style('display','block')
      	.attr('id','maindetaillbl')
      	.text('Main Versions:');
      
      var mainVerCont = mainContainer.append('div').classed('center col12', true).style('display','inline-block');
      _mainVer = mainVerCont.append('div');
      _mainVer.classed('center round keyline-all overflow', true);      
      
      var detailContainer = form.append('div').classed('col12 pad1y fill-light',true);
      var detailVersionLbl = detailContainer.append('div');
      detailVersionLbl.append('label')
          .classed('aboutHeader',true)
          .style('display','block')
          .attr('id', 'versiondetaillbl')
          .text('Detail: ** Please select a row from Main Versions table. **');
      
      var headerVersionInfo = [];
      // Show version info
      Hoot.model.REST('coreVersionInfo', 
              function(response) {
                  var coreInfo = {};
                  coreInfo.name = "core";
                  coreInfo.description = response.name + " - Version: " + response.version + " - Built By: " + response.builtBy;
                  headerVersionInfo.push(coreInfo)
                  Hoot.model.REST('servicesVersionInfo', 
                          function(response) {
                              var serviceDesc = response.name + " - Version: " + response.version + " - Built By: " + response.builtBy;
                              if (response.name.indexOf("unknown") > -1)
                              {
                                  serviceDesc = "Unable to find the Web Services build.info file.  Hootenanny Web services version information will be unavailable.";
                              }
                                
                              var serviceInfo = {};
                              serviceInfo.name = "service";
                              serviceInfo.description = serviceDesc;
                              headerVersionInfo.push(serviceInfo);
                              
                              
                              if (iD.data.buildInfo != null)
                              {
                                buildInfoName = iD.data.buildInfo.name;
                                buildInfoVersion = iD.data.buildInfo.version;
                                buildInfoBuiltBy = iD.data.buildInfo.user;
                              }
                              else
                              {
                                buildInfoName = "Hootenanny UI";
                                buildInfoVersion = "unknown";
                                buildInfoBuiltBy = "unknown";
                              }
                              var uiDesc =  buildInfoName + " - Version: " + buildInfoVersion + " - Built By: " + buildInfoBuiltBy;
                              if (iD.data.buildInfo == null)
                              {
                                  uiDesc =  "Unable to find the iD buildInfo.json file.  Hootenanny iD version information will be unavailable.";
                              }
                              
                              var uiInfo = {};
                              uiInfo.name = "ui";
                              uiInfo.description = uiDesc;
                              headerVersionInfo.push(uiInfo);
                              
                              
                              var la = _mainVer.selectAll('span')
                              .data(headerVersionInfo)
                              .enter();
                              
                              var la2 = la.append('div')
                              .classed('col12 fill-white small keyline-bottom', true);
                              
                              var la3 = la2.append('span')
                              .classed('text-left big col12 fill-white small hoverDiv2', true)                    
                              .text(function (item) {
                                  return item.description;
                              });
                              
                              la2.select(function (a){
                                  d3.select(this).on('click', function (selData) {
                                      d3.select('#versioninfodatasettable').remove();
                                      _form.append('div')
                                      .attr('id','versioninfodatasettable')                                       
                                      .classed('col12 fill-white small row10 overflow keyline-bottom', true)                                        
                                      .call(about.populateDatasets, selData);
                                   });
                              });
                          }
                  );
              }
      );
      
      
      
      
      formCont = detailContainer.append('div');
      formCont.classed('center col12', true).style('display','inline-block');
      _form = formCont.append('div');
      _form.classed('center row10  round keyline-all fill-white', true);

      var btnDoc = formCont.append('div')
          .classed('pad1y', true)
          .append('a')
          .attr('href', '#')
          .text('Download User Guide')
          .classed('dark fl button loud pad2x big _icon plus', true)
          .on('click', function () {

              var sUrl = '/hoot-services/info/document/export';
              var link = document.createElement('a');
              link.href = sUrl;
              if (link.download !== undefined) {
                  //Set HTML5 download attribute. This will prevent file from opening if supported.
                  var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
                  link.download = fileName;
              }
              //Dispatching click event.
              if (document.createEvent) {
                  var e = document.createEvent('MouseEvents');
                  e.initEvent('click', true, true);
                  link.dispatchEvent(e);
                  return true;
              }

          });

          formCont.append('div')
            .classed('col2',true)
            .style('float','right')
            .append('label')
                .text('Enable Test Mode')
            .append('input')
                .attr('type','checkbox')
                .attr('id','enable_test_mode')
                .on('change',function(){
                  if(this.checked){
                    d3.selectAll('#confGetValuesBtn').style('display','inline-block');
                    d3.selectAll('#confViewValuesSpan').style('display','inline-block');
                    d3.selectAll('#containerofisGenerateReport').style('display','block');
                  } else {
                    d3.selectAll('#confGetValuesBtn').style('display','none');
                    d3.selectAll('#confViewValuesSpan').style('display','none');
                    d3.selectAll('#containerofisGenerateReport').style('display','none');
                  }
                });
    };
    
    about.populateDatasets = function(container, data) {

        d3.select('#versiondetaillbl').text('Detail: ('+ data.description + ')');
        if(data.name == "core"){
            
            Hoot.model.REST('coreVersionDetail',
                    function(response) {
                        var d = response.environmentInfo;
                        
                        var la = container.selectAll('span')
                        .data(d)
                        .enter();
                        
                        var la2 = la.append('div')
                        .classed('col12 fill-white small keyline-bottom', true);
                        
                        var la3 = la2.append('span')
                        .classed('text-left big col12 fill-white small hoverDiv2', true)
            
                        .text(function (item) {
                            return item;
                        });
                    }
                );
        } else if(data.name == "service"){
            Hoot.model.REST('servicesVersionDetail',
                    function(response) {
                        var d = response.properties;
                        
                        var las = container.selectAll('span')
                        .data(d)
                        .enter();
                        
                        var las2 = las.append('div')
                        .classed('col12 fill-white small keyline-bottom', true);
                        
                        var las3 = las2.append('span')
                        .classed('text-left big col12 fill-white small hoverDiv2', true)
            
                        .text(function (item) {
                            return "PROPERTY - " + item.name + " : " + item.value;
                        });
                        
                        var d2 = response.resources;
                        var lar = container.selectAll('span')
                        .data(d2)
                        .enter();
                        
                        var lar2 = lar.append('div')
                        .classed('col12 fill-white small keyline-bottom', true);
                        
                        var lar3 = lar2.append('span')
                        .classed('text-left big col12 fill-white small hoverDiv2', true)
            
                        .text(function (item) {
                            return "RESOURCE - " + item.type + " : " + item.url;
                        });
                    }
                );
        } else {
            
        }
    }
    
    return d3.rebind(about, dispatch, 'on');
}
