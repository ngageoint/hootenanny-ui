Hoot.view.utilities = function (context){

    var event = d3.dispatch('activate', 'uploadFile');
    var utilities = {};
 
	utilities.dataset = Hoot.view.utilities.dataset(context);
	utilities.wfsdataset = Hoot.view.utilities.wfsdataset(context);
	utilities.basemapdataset = Hoot.view.utilities.basemapdataset(context);
	utilities.translation = Hoot.view.utilities.translation(context);
	utilities.errorlog = Hoot.view.utilities.errorlog(context);
    utilities.reports = Hoot.view.utilities.reports(context);

    utilities.basemaplist = null;

    utilities.activate = function () {

        

        var _toggleOpts = function (d) {
            var bodyid = d3.select(d)
                .attr('data');
            var thisbody = d3.select(bodyid)
                .node();
            jobsBG.node()
                .appendChild(thisbody);
            d3.selectAll('.utilHootHead')
                .classed('fill-white', false)
                .classed('keyline-bottom', true);
            d3.select(d)
                .classed('fill-white', true)
                .classed('keyline-bottom', false);
        };

        _createTabs = function(jobsBG)
        {
            if(iD.data.hootManageTabs) {
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
                    .classed('top2 pad2 round-top keyline-bottom fill-light pin-left pin-top utilHoot', true)
                    .attr('id', tabId);


                    var bodyStyle = 'block strong center col1 margin' + tabOrder + ' pin-top ' + pady + 
                    ' keyline-top keyline-right keyline-left keyline-bottom utilHootHead point';

                    var tabHeader = tabBody.append('div')
                    .classed(bodyStyle, true)
                    .style('top', '-44px')
                    .attr('data', '#' + tabId)
                    .text(tabName)
                    .on('click', function () {
                        _toggleOpts(this);
                    });
                    
                    var containerForm = tabBody.append('form');
                    containerForm.classed('center margin2 col7 round keyline-all', true);

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
        /*header.append('div')
            .attr('href', '/')
            .classed('inline dark strong _logo pad2x pad2y keyline-right keyline-left', true)
            .style('color', '#fff')
           .html('Hootenanny<span class=\'logo\'> | </span>InnoVision');*/
        /*header.append('nav')
            .classed('contain inline fr', true)
            .append('a')
            .attr('href', '#jobs')
            .classed('point center pad2 block keyline-left keyline-right _icon dark strong small plus', true)
            .text('New Job')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                context.hoot().reset();
            });*/
        header.append('nav')
            .classed('contain inline fr', true)
            .append('div')
            .attr('href', '#jobs')
            .classed('point pad2 block keyline-left _icon dark strong small sprocket', true)
            .text('Manage')
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
            .classed('col12 fill-white pin-bottom pin-top hidden', true)
            .style('position', 'absolute')
            .style('top', '60px');
        jobsBG.append('div')
            .classed('row2 fill-light round-top keyline-all', true);

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
         	.append('div')
         	.attr('id','alerts');
         /////////////////////////////////////////         
         
        _createTabs(jobsBG);
    };

    

    return d3.rebind(utilities, event, 'on');
};