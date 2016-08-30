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
    * @desc Helper function to zoom to the bounding box of a entity
    * @param entity - entity to zoom to
    * @param force - if true do not validate intersection
    **/
    _instance.panToEntity = function(entity, force) {
        try{
            //only pan if feature is not on screen
            var map = context.map();
            var entityExtent = entity.extent(context.graph())? entity.extent(context.graph()) : undefined;

            if(entityExtent === undefined) {throw new Error('Could not locate point');}

            var mapExtent = map.extent();
            var entityCenter = entityExtent.center();

            if(!context.hoot().checkForValidCoordinates(entityCenter)) {throw new Error('Could not locate point');}

            if(mapExtent === undefined) {throw new Error('Could not locate point');}
            if(mapExtent.length !==2)  {throw new Error('Could not locate point');}
            _.each(mapExtent,function(pt){
                if(!context.hoot().checkForValidCoordinates(pt)) {throw new Error('Could not locate point');}
            });

            // we are locking screen until connection.js is done loading tiles
            _parent().setProcessing(false);
            _parent().setProcessing(true, 'Please wait while panning to review item.');
            if(force && force === true){
                map.extent(entityExtent);
                map.center(entityCenter);
                var zoom = Math.min(18, map.zoom()-1);
                map.zoom(zoom);
            } else {
                if(_.isEmpty(_.filter(context.intersects(mapExtent),function(n){return n.id===entity.id;}))){
                    map.extent(entityExtent);
                    map.center(entityCenter);
                    zoom = Math.min(18, map.zoom()-1);
                    map.zoom(zoom);
                } else {
                    _parent().setProcessing(false);
                }
            }
        } catch(err) {
            iD.ui.Alert('Could not locate selected feature with id: ' + entity.id + '.','warning',new Error().stack);
            return;
        } finally {
            _parent().setProcessing(false);
        }
    };

    var _parent = function() {
        return context.hoot().control.conflicts;
    };

    return d3.rebind(_instance, _events, 'on');
};