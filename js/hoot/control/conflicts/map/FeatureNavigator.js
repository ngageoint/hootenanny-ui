/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.map.featureNavigator is zoom/pan map helper functions
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.map.featureNavigator = function (context)
{
	var _events = d3.dispatch();
	var _instance = {};


    /**
    * @desc Helper function to zoom to specified bound
    * @param bounds - bbox
    **/
    _instance.panToBounds = function(bounds) {
        function boundsToExtent() {
            var boundsParts = bounds.split(',');
            var lowerLeftExtent = iD.geo.Extent([boundsParts[0], boundsParts[1]]);
            var upperRightExtent = iD.geo.Extent([boundsParts[2], boundsParts[3]]);
            var extent = lowerLeftExtent.extend(upperRightExtent);
            return extent;
        }
        var extent = boundsToExtent();
        var map = context.map();
        var zoom = Math.min(20, (map.extentZoom(extent)));
        map.centerZoom(extent.center(), (zoom));
    }

    /**
    * @desc Helper function to zoom to the bounding box of a entity
    * @param entity - entity to zoom to
    * @param force - if true do not validate intersection
    **/
    _instance.panToEntity = function(entity, force) {
    	//only pan if feature is not on screen
    	var map = context.map();
    	var entityExtent = entity.extent(context.graph())? entity.extent(context.graph()) : undefined;
    	var mapExtent = map.extent();
    	var entityCenter = entityExtent.center();

    	if(entityExtent == undefined){
    		iD.ui.Alert("Could not locate selected feature with id: " + entity.id + ".",'warning')
    		return;
    	}

        // we are locking screen until connection.js is done loading tiles
        _parent().setProcessing(false);
        _parent().setProcessing(true, 'Please wait while panning to review item.');
    	if(force && force === true){
    		map.extent(entityExtent);
    		map.center(entityCenter);
            var zoom = Math.min(18, map.zoom()-1);
    		map.zoom(zoom);
    	} else {
            if(_.isEmpty(_.filter(context.intersects(mapExtent),function(n){return n.id==entity.id;}))){
        		map.extent(entityExtent);
        		map.center(entityCenter);
        		var zoom = Math.min(18, map.zoom()-1);
                map.zoom(zoom);
            } else {
                _parent().setProcessing(false);
            }
        }
    }

    var _parent = function() {
        return context.hoot().control.conflicts;
    };

	return d3.rebind(_instance, _events, 'on');
}