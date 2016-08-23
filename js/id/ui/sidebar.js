iD.ui.Sidebar = function(context) {
    var inspector = iD.ui.Inspector(context),
        current;

    function sidebar(selection) {
        //var ltds = context.hoot().view.ltdstags;
        var featureListWrap = selection.append('div').attr('class', 'feature-list-pane').call(iD.ui.FeatureList(context));
        //selection.call(iD.ui.Notice(context));
        var inspectorWrap = selection.append('div').attr('class', 'inspector-hidden inspector-wrap fr');
        /*sidebar.hover = function(id) {
            // User found hover distracting see ticket Bug #6522
            if (!current && id) {
                featureListWrap.classed('inspector-hidden', true);
                inspectorWrap.classed('inspector-hidden', false).classed('inspector-hover', true);
                if (inspector.entityID() !== id || inspector.state() !== 'hover') {
                    inspector.state('hover').entityID(id);
                    inspectorWrap.call(inspector);

                }
            }
            else if (!current) {
                featureListWrap.classed('inspector-hidden', false);
                inspectorWrap.classed('inspector-hidden', true);
                inspector.state('hide');
            }
        };*/

        sidebar.hover = _.throttle(sidebar.hover, 200);

        sidebar.select = function(id, newFeature) {
            if (!current && id) {
                featureListWrap.classed('inspector-hidden', true);
                inspectorWrap.classed('inspector-hidden', false).classed('inspector-hover', false);
                if (inspector.entityID() !== id || inspector.state() !== 'select') {
                    inspector.state('select').entityID(id).newFeature(newFeature);
                    inspectorWrap.call(inspector);
                    //ltds.activate(id);
                }
            }
            else if (!current) {
                featureListWrap.classed('inspector-hidden', false);
                inspectorWrap.classed('inspector-hidden', true);
                inspector.state('hide');
                //ltds.deactivate();
            }
        };
        sidebar.show = function(component) {
            featureListWrap.classed('inspector-hidden', true);
            inspectorWrap.classed('inspector-hidden', true);
            if (current) current.remove();
            current = selection.append('div').attr('class', 'sidebar-component').call(component);
        };
        sidebar.hide = function() {
            featureListWrap.classed('inspector-hidden', false);
            inspectorWrap.classed('inspector-hidden', true);
            if (current) current.remove();
            current = null;
        };
    }



    sidebar.hover = function() {};
    sidebar.hover.cancel = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};
    sidebar.hoot = function(selection) {
        //temporary hacks
        d3.select('.header.fillL.cf').remove();
        d3.select('.search-header').remove();
        d3.select('.feature-list-pane').style('display', 'none');
        d3.select('.sidebar-component').style('background-color', '#fff');
        //d3.selectAll('.save').style('display','none');
Hoot.tools(context,selection);


    };
    sidebar.adjustMargins = function(){
        //adjust margins to keep everything in place when the sidebar is expanded
        var sidebarWidth = d3.select('#sidebar').node().getBoundingClientRect().width;
        d3.select('#bar').style('margin-left', sidebarWidth+'px');
        d3.select('#about').style('margin-left', sidebarWidth+'px');
        d3.select('#info-block').attr('style', 'margin-right:'+ (sidebarWidth-400)+'px;');
        d3.select('#list-of-conflicts').attr('style', 'margin-left:'+ (sidebarWidth-400) +'px;');
        d3.select('#conflict-review-buttons').attr('style', 'margin-right:'+ (sidebarWidth-400) +'px;');
        d3.select('#CustomConflationForm').attr('style', 'margin-left:'+ sidebarWidth +'px;');
        d3.select('#validation-meta').attr('style', 'margin-left:'+ (sidebarWidth-400) +'px;');
    };

    return sidebar;
};