Hoot.control.conflicts.info = function (context){
	var _instance = {};

	_instance.metadata = Hoot.control.conflicts.info.metadata(context);
	_instance.reviewtable = Hoot.control.conflicts.info.reviewtable(context);

	return _instance;
}