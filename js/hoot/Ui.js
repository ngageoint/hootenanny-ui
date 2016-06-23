Hoot.ui = function (context){
	var _instance = {};

	_instance.formfactory = Hoot.ui.formfactory(context);
	_instance.hootformbase = Hoot.ui.hootformbase();
	
	_instance.reset = function(){
		_instance.formfactory = Hoot.ui.formfactory(context);
		_instance.hootformbase = Hoot.ui.hootformbase();		
	};
	return _instance;
};