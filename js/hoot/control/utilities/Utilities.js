Hoot.control.utilities = function (context){
	var hoot_control_utilities = {};

	hoot_control_utilities.translation = Hoot.control.utilities.translation(context);
	hoot_control_utilities.basemapdataset = Hoot.control.utilities.basemapdataset(context);
	hoot_control_utilities.dataset = Hoot.control.utilities.dataset(context);
	hoot_control_utilities.wfsdataset = Hoot.control.utilities.wfsdataset(context);
	hoot_control_utilities.reports = Hoot.control.utilities.reports(context);
	
	return hoot_control_utilities;
};