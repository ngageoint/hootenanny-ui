Hoot.control = function (context){
	var hoot_control = {};

	hoot_control.utilities = Hoot.control.utilities(context);
	//hoot_control.conflate = new Hoot.control.conflate(context);

	// Override the iD sidebar with hoot sidebar
	hoot_control.loadSidebarControls = function(context, sidebar){
		// Clear existing
		d3.select('.header.fillL.cf').remove();
                d3.select('.search-header').remove();
                d3.select('.feature-list-pane').style('display', 'none');
                d3.select('.sidebar-component').style('background-color', '#fff');
                //d3.selectAll('.save').style('display','none');

                hoot_control.conflate = Hoot.control.conflate(sidebar);
                hoot_control.import = Hoot.control.import(context, sidebar);
                hoot_control.export = Hoot.control.export( sidebar);
                hoot_control.view = Hoot.control.view(sidebar, context);
                hoot_control.conflicts = Hoot.control.conflicts(context, sidebar);
                // tools will go away till then
                Hoot.tools(context, sidebar);
	}

	return hoot_control;
};