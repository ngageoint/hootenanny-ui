Hoot.view = function (context){
	var hoot_view = {};

	hoot_view.utilities = Hoot.view.utilities(context);
	hoot_view.ltdstags = Hoot.view.ltdstags(context);
	hoot_view.versioninfo = Hoot.view.versioninfo(context);

	return hoot_view;
};