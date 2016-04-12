/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.versioninfo is version informatin popup which gets activated when 'Hootenanny | Innovision'
//  logo clicked. Contains details on version information of core, service and UI.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.versioninfo = function(context){

    // events
    var dispatch = d3.dispatch('close');

    // constructor
    function versioninfo(){

    }

    versioninfo.showPopup = function(){
        // block main app
        var modalMask = d3.select('body')
        .append('div')
        .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);

        var dlgDiv = modalMask.append('div')
        .classed('contain col6 pad1 fill-white round modal keyline-all', true);

        var dlgHeader = dlgDiv.append('form');
        dlgHeader.classed('round space-bottom1 importableLayer', true)
        .append('div')
        .classed('big pad1y keyline-bottom space-bottom2', true)
        .append('h4')
        .text('About Hootenanny')
        .append('div')
        .classed('fr _icon x point', true)
        .on('click', function () {
            modalMask.remove();
        });


        var mainVersionLbl = dlgDiv.append('div');
        mainVersionLbl.append('label')
            .html('<strong>Main Versions:</strong> ');

        mainVerCont = dlgDiv.append('div');
        mainVerCont.classed('center pad1x', true);
        _mainVer = mainVerCont.append('div');
        _mainVer.classed('center row2  round keyline-all overflow', true);
       


        var detailVersionLbl = dlgDiv.append('div');
        detailVersionLbl.append('label')
            .attr('id', 'versiondetaillbl')
            .html('<strong>Detail: ** Please select a row from Main Versions table. ** </strong> ');

        var headerVersionInfo = [];
        // Show version info
        Hoot.model.REST('coreVersionInfo',
                function(response) {
                    versioninfo.coreVersionInfo(response,headerVersionInfo,_form);
                }
        );




        formCont = dlgDiv.append('div');
        formCont.classed('center pad1x', true);
        _form = formCont.append('div');
        _form.classed('center row10  round keyline-all', true);

        var btnDoc = formCont.append('div')
            .classed('pad1y pad2x', true)
            .append('a')
            .attr('href', '#')
            .text('Download User Guide')
            .classed('dark fr button loud pad2x big _icon plus', true)
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


    };

    versioninfo.coreVersionInfo = function(response,headerVersionInfo,_f){
        var coreInfo = {};
                    coreInfo.name = 'core';
                    coreInfo.description = response.name + ' - Version: ' + response.version + ' - Built By: ' + response.builtBy;
                    headerVersionInfo.push(coreInfo);
                    Hoot.model.REST('servicesVersionInfo',
                            function(response) {
                                versioninfo.servicesVersionInfo(
                                    response,headerVersionInfo,_f);
                            }
                    );
    };

    versioninfo.servicesVersionInfo = function(response,headerVersionInfo,_f){
        var serviceDesc = response.name + ' - Version: ' + response.version + ' - Built By: ' + response.builtBy;
        if (response.name.indexOf('unknown') > -1)
        {
            serviceDesc = 'Unable to find the Web Services build.info file.  Hootenanny Web services version information will be unavailable.';
        }

        var serviceInfo = {};
        serviceInfo.name = 'service';
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
          buildInfoName = 'Hootenanny UI';
          buildInfoVersion = 'unknown';
          buildInfoBuiltBy = 'unknown';
        }
        var uiDesc =  buildInfoName + ' - Version: ' + buildInfoVersion + ' - Built By: ' + buildInfoBuiltBy;
        if (iD.data.buildInfo === null)
        {
            uiDesc =  'Unable to find the iD buildInfo.json file.  Hootenanny iD version information will be unavailable.';
        }

        var uiInfo = {};
        uiInfo.name = 'ui';
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
                _f.append('div')
                .attr('id','versioninfodatasettable')
                .classed('col12 fill-white small row10 overflow', true)
                .call(versioninfo.populateDatasets, selData);
             });
        });
    };


    versioninfo.populateDatasets = function(container, data) {

        d3.select('#versiondetaillbl').html('<strong>Detail:('+ data.description + ')</strong> ');
        if(data.name === 'core'){

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
        } else if(data.name === 'service'){
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
                            return 'PROPERTY - ' + item.name + ' : ' + item.value;
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
                            return 'RESOURCE - ' + item.type + ' : ' + item.url;
                        });
                    }
                );
        } else {

        }
    };

    versioninfo.downloadUserGuide = function() {
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
    };

    return d3.rebind(versioninfo, dispatch, 'on');
};