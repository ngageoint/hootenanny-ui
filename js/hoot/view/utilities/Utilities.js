Hoot.view.utilities = function (context){

    var event = d3.dispatch('activate', 'uploadFile');
    var utilities = {};
 
	utilities.dataset = Hoot.view.utilities.dataset(context);
	utilities.wfsdataset = Hoot.view.utilities.wfsdataset(context);
	utilities.basemapdataset = Hoot.view.utilities.basemapdataset(context);
	utilities.translation = Hoot.view.utilities.translation(context);
	utilities.errorlog = Hoot.view.utilities.errorlog(context);
    utilities.reports = Hoot.view.utilities.reports(context);
    utilities.about = Hoot.view.utilities.about(context);

    utilities.basemaplist = null;

    utilities.activate = function () {

        

        var _toggleOpts = function (d) {
            var bodyid = d3.select(d)
                .attr('data');
            var thisbody = d3.select(bodyid)
                .node();
            jobsBG.node()
                .appendChild(thisbody);
            d3.selectAll('.utilHootHead').style('font-weight','normal');
            d3.select(d).style('font-weight','bold');
        };

        _createTabs = function(jobsBG)
        {
            if(iD.data.hootManageTabs) {
                var settingsSidebar = jobsBG.append('div')
            		.classed('pad2 pin-bottom pin-top fill-light keyline-right',true)
            		.attr('id','settingsSidebar');
                
                var settingsHeader = settingsSidebar.append('div')
	            	.classed('keyline-bottom block strong center margin2 pad1y utilHootHead point',true)
	            	.style('height','60px')
	            	.append('label').text('Settings').attr('id','settingsHeader');
            	
            	var defaultTab = null;
                _.each(iD.data.hootManageTabs, function(tabMeta){
                    var tabName = tabMeta.name;
                    var tabId = tabMeta.id;
                    var tabOrder = tabMeta.order;
                    var pady = 'pad1y';
                    var contentCallback = tabMeta.callback;
                    var contentId = tabMeta.contentbodyid;
                    var callbackCntxMeta = tabMeta.callbackcontext;
                    var isDefault = tabMeta.default;

                    if(tabMeta.pady !== undefined && tabMeta.pady === 'false'){
                        pady = '';
                    }
                    
                    var tabBody = jobsBG.append('div')
                    .classed('pad2 round-top fill-light pin-left pin-top utilHoot', true)
                    .attr('id', tabId);

                    var bodyStyle = 'block strong center margin2 pad1y  utilHootHead';
                    
                    var tabHeader = settingsSidebar.append('div')
	                    .classed(bodyStyle, true)
	                    .attr('data', '#' + tabId)
	                    .on('click', function () {
	                        _toggleOpts(this);
	                    });
                    
                    var tabLabel = tabHeader.append('label')
                    	.text(tabName)
                    	.classed('point',true)
                    	.style('font-style','normal');
                    
                    var containerForm = tabBody.append('form');
                    containerForm.classed('center round', true)
                    .style('margin-top','60px');

                    var callbackContext = context.hoot();

                    if(contentCallback){
                        if(callbackCntxMeta && callbackCntxMeta === 'window'){
                            callbackContext = window;
                        }

                        var callbackPath = contentCallback.split(".");
                        for(var i=0; i<callbackPath.length; i++){
                            callbackContext = callbackContext[callbackPath[i]];
                        }
                        containerForm.call(callbackContext);
                    }
                    if(isDefault !== undefined && isDefault === 'true'){
                        defaultTab = tabHeader;
                    }
                });
                if(defaultTab != null){
                    _toggleOpts(defaultTab.node());
                }

            }
        };



        var header = d3.select('body')
            .insert('div', ':first-child')
            .attr('id', 'header')
            .classed('contain pad2x dark fill-dark', true);
        header.append('nav')
            .classed('contain inline fr', true)
            .append('div')
            .attr('href', '#jobs')
            .classed('point pad2 block keyline-left _icon dark strong small sprocket', true)
            .text('Settings')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                var vis = d3.selectAll('#jobsBG')
                    .style('display') === 'none' ? false : true;
                var txt = vis ? "Manage" : "Return to Map";
                d3.select(this)
                    .classed('fill-light', !vis)
                    .classed('dark', vis)
                    .text(txt);
                d3.selectAll('#jobsBG')
                    .classed('hidden', vis);
            });


        var jobsBG = d3.select('body')
            .append('div')
            .attr('id', 'jobsBG')
            .classed('col12 pin-bottom pin-top hidden', true)
            .style('position', 'absolute')
            .style('top', '60px')
            .style('z-index',999);

        ////////////VERSION///////////////////

        header.append('div')
        .append('a')
        .attr('href', '#version')
        .classed('inline pad2 _icon dark strong ', true)
        .html('Hootenanny<span class=\'logo\'> | </span>InnoVision')
         .on('click', function ()
         {
             context.hoot().view.versioninfo.showPopup();
         });

        var versionBG = d3.select('body')
         .append('div')
         .attr('id', 'versionBG')
         .classed('col12 fill-white pin-bottom pin-top hidden', true)
         .style('position', 'absolute')
         .style('top', '60px');
         versionBG.append('div')
           .classed('row2 fill-light round-top keyline-all', true);
        /////////////////////////////////////////

         ////////////ALERTS///////////////////
         var alertsDiv = d3.select('body')
         	.insert('div',":first-child")
         	.attr('id','alerts');
         /////////////////////////////////////////         
         
        _createTabs(jobsBG);
    };

    

    return d3.rebind(utilities, event, 'on');
};