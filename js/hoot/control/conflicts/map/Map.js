Hoot.control.conflicts.map = function (context){
	var _instance = {};

	_instance.featurehighlighter = Hoot.control.conflicts.map.featurehighlighter(context);
	_instance.featureNavigator = Hoot.control.conflicts.map.featureNavigator(context);
	_instance.reviewarrowrenderer = Hoot.control.conflicts.map.reviewarrowrenderer(context);

	return _instance;
}