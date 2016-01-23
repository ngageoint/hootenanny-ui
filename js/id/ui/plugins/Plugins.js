// plugin factory
iD.ui.plugins = function() {
	var plugins = {};
	var current_plugin = null;
	// Plugin factory
	plugins.getEntityEditorPlugin = function(type){
		if(current_plugin === null){
			if(type === 'hoot') {
				current_plugin = new Hoot.plugins.entityeditor();
			}
		}
		return current_plugin;
	}
	return plugins;
}