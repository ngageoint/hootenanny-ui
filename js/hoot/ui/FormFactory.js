Hoot.ui.formfactory = function (context) 
{
	var _events = d3.dispatch();
    var _instance = {};

    _instance.create = function(containerId, formMetaData, formTypeName) {
    	var formInstance = eval('context.hoot().ui.hootformbase');
    	if(formTypeName) {
    		formInstance = eval('context.hoot().ui.' + formTypeName);
    	}
    	return formInstance.createForm(containerId, formMetaData);
    }

    return d3.rebind(_instance, _events, 'on');
}