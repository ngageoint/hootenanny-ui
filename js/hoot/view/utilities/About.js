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

    }

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
      var _mainVer = mainVerCont.append('div');
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
                  context.hoot().view.versioninfo.coreVersionInfo(response,headerVersionInfo,_form);
              }

      );




      var formCont = detailContainer.append('div');
      formCont.classed('center col12', true).style('display','inline-block');
      var _form = formCont.append('div');
      _form.classed('center row10  round keyline-all fill-white', true);

      formCont.append('div')
          .classed('pad1y', true)
          .append('a')
          .attr('href', '#')
          .text('Download User Guide')
          .classed('dark fl button loud pad2x big _icon plus', true)
          .on('click', function () {context.hoot().view.versioninfo.downloadUserGuide();});

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

    return d3.rebind(about, dispatch, 'on');
};
