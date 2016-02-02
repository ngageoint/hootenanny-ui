/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.ui.formfactory is a factory class which creates requested form dialog. Currently works with only hootformbase
//  and either expand or remove this class..
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      02 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.ui.formfactory = function (context) 
{
	var _events = d3.dispatch();
    var _instance = {};

    /**
    * @desc Create requested type of form
    * @param containerId - id of container div
    * @param formMetaData - meta data object that describes the form
    * @param formTypeName - form class name
    * @return returns created form.
    **/
    _instance.create = function(containerId, formMetaData, formTypeName) {
    	var formInstance = eval('context.hoot().ui.hootformbase');
    	if(formTypeName) {
    		formInstance = eval('context.hoot().ui.' + formTypeName);
    	}
    	return formInstance.createForm(containerId, formMetaData);
    }

    return d3.rebind(_instance, _events, 'on');
}