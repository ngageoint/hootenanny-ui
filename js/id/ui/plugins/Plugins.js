// plugin factory
iD.ui.plugins = function() {
	var plugins = {};
	var current_plugin = null;
	// Plugin factory
	plugins.getEntityEditorPlugin = function(type){
		if(current_plugin === null){
			if(type === 'hoot') {
				current_plugin = new Hoot.plugins.entityeditor();
			} else if (type === 'mapedit') {
				// not implemented yet
				current_plugin = null;
			}
		}
		return current_plugin;
	}
	return plugins;
}