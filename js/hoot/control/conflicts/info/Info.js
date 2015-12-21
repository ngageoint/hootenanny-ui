Hoot.control.conflicts.info = function (context){
	var _instance = {};

	_instance.metadata = Hoot.control.conflicts.info.metadata(context);
	_instance.reviewtable = Hoot.control.conflicts.info.reviewtable(context);

	_instance.reset = function(){
		_instance.idgraphsynch = Hoot.control.conflicts.actions.idgraphsynch(context);
		_instance.poimerge = Hoot.control.conflicts.actions.poimerge(context);
		_instance.reviewresolution = Hoot.control.conflicts.actions.reviewresolution(context);
		_instance.traversereview = Hoot.control.conflicts.actions.traversereview(context);
	}
	return _instance;
}