/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view.utilities is Managed tab content container form.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view.utilities = function (context){

    var event = d3.dispatch('activate', 'uploadFile', 'tabToggled');
    var utilities = {};
    var _activeSettingsTabId;

    utilities.dataset = Hoot.view.utilities.dataset(context);
    utilities.basemapdataset = Hoot.view.utilities.basemapdataset(context);
    utilities.translation = Hoot.view.utilities.translation(context);
    utilities.about = Hoot.view.utilities.about(context);
    utilities.reviewbookmarks = Hoot.view.utilities.reviewbookmarks(context);
    utilities.reviewbookmarknotes = Hoot.view.utilities.reviewbookmarknotes(context);

    utilities.basemaplist = null;



    utilities.forceResetManageTab = function () {

        var vis =  true;
        var txt = 'Manage';
        d3.select('#manageTabBtn')
            .classed('fill-light', !vis)
            .classed('dark', vis)
            .text(txt);
        d3.selectAll('#jobsBG')
            .classed('hidden', vis);
    };

    utilities.activate = function () {



        var _toggleOpts = function (d) {
            var bodyid = d3.select(d)
                .attr('data');
            _activeSettingsTabId = bodyid;
            var thisbody = d3.select(bodyid)
                .node();
            jobsBG.node()
                .appendChild(thisbody);
            d3.selectAll('.utilHootHead').style('font-weight','normal');
            d3.select(d).style('font-weight','bold');
            event.tabToggled(bodyid);
        };

        var _createTabs = function(jobsBG)
        {
            if(iD.data.hootManageTabs) {
                var settingsSidebar = jobsBG.append('div')
                    .classed('pad2 pin-bottom pin-top fill-light keyline-right',true)
                    .attr('id','settingsSidebar');

                settingsSidebar.append('div')
                    .classed('block strong center margin2 pad1y utilHootHead point',true)
                    .style('height','60px')
                    .append('label').text('Settings').attr('id','settingsHeader');

                var defaultTab = null;
                _.each(iD.data.hootManageTabs, function(tabMeta){
                    var tabName = tabMeta.name;
                    var tabId = tabMeta.id;
                    var contentCallback = tabMeta.callback;
                    var callbackCntxMeta = tabMeta.callbackcontext;
                    var isDefault = tabMeta.default;
                    var isHidden = tabMeta.hidden;

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

                    if(isHidden) {
                        tabHeader.on('click', null);
                        tabLabel.classed('hidden', true);
                    }

                    var containerForm = tabBody.append('form')
                    .attr('id', 'containerForm' + tabId);
                    containerForm.classed('center round', true)
                    .style('margin-top','60px');

                    var callbackContext = context.hoot();

                    if(contentCallback){
                        if(callbackCntxMeta && callbackCntxMeta === 'window'){
                            callbackContext = window;
                        }

                        var callbackPath = contentCallback.split('.');
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
        var nav = header.append('nav')
            .classed('contain inline fr', true);

        var warnMsg = 'browser does not support localStorage -or- failed to retrieve user from store';
        if(localStorage && localStorage.getItem('user')) {
            try {
                var user = JSON.parse(localStorage.getItem('user'));
                nav.append('div')
                    .classed('pad2 inline _icon dark strong small', true)
                    .text('Contributing as ' + user.display_name);
            } catch(e) {
                console.warn(warnMsg);
                console.warn(e);
            }
        } else {
            console.warn(warnMsg);
        }

        nav.append('div')
            .attr('id', 'logoutTabBtn')
            .attr('href', '#logout')
            .classed('point pad2 inline keyline-left _icon dark strong small x', true)
            .text('Logout')
            .on('click', function() {
                Hoot.model.REST('logout', function(e) {
                    if(!e) {
                        window.location = '/';
                    }
                })
            });
        nav.append('div')
            .attr('id', 'manageTabBtn')
            .attr('href', '#jobs')
            .classed('point pad2 inline keyline-left keyline-right _icon dark strong small sprocket', true)
            .text('Manage')
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                var vis = !d3.selectAll('#jobsBG').classed('hidden');
                var txt = vis ? 'Manage' : 'Return to Map';
                d3.select(this)
                    .classed('fill-light', !vis)
                    .classed('dark', vis)
                    .text(txt);
                d3.selectAll('#jobsBG')
                    .classed('hidden', vis);
                d3.selectAll('.context-menu, .tools-menu, .dataset-options-menu').remove();

                if(_activeSettingsTabId && _activeSettingsTabId === '#utilReviewBookmarks' && txt === 'Manage') {
                    context.hoot().view.utilities.reviewbookmarknotes.resetToList();
                }
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
        .attr('href', '#version')
        .classed('point hoot_label', true)
        .attr('height', '60px')
        .on('click', function (){
             context.hoot().view.versioninfo.showPopup();
        });
        /////////////////////////////////////////

         ////////////ALERTS///////////////////
         d3.select('body')
             .insert('div',':first-child')
             .attr('id','alerts');
         /////////////////////////////////////////

        _createTabs(jobsBG);
    };



    return d3.rebind(utilities, event, 'on');
};
