/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.map.reviewarrowrenderer provides arrow between reviewable items
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.map.reviewarrowrenderer = function (context)
{
	var _events = d3.dispatch();
	var _instance = {};
	// @TODO: get rid of f  + f against concept after getting concensus
	var _feature;
	var _againstFeature;

	/**
	* @desc activate show/hide event handler
	* @param r - feature (soon to be deprecated)
	* @param ra - feature against (soon to be deprecated)
	**/
	_instance.activate = function(r, ra) {
		_feature = r;
		_againstFeature = ra;
		 //Add hover handler to show arrow
        d3.select('a.merge').on('mouseenter', function() {
            this.focus();
            d3.select(this).on('keydown', function() {
                if (d3.event.ctrlKey) {
                    _loadArrow('reverse');
                }
            }).on('keyup', function() {
                _loadArrow();
            });
            if (d3.event.ctrlKey) {
                _loadArrow('reverse');
            } else {
                _loadArrow();
            }
        }).on('mouseleave', function() {
            this.blur();
            _loadArrow('remove');
        });
	}

	/**
	* @desc Display arrow
	**/
	var _loadArrow = function(mode) {
	    //if (d3.event) d3.event.preventDefault();
	    if(!context.graph()){
	        return;
	    }
	    if(!context.graph().entities[_feature.id] ||
	     !context.graph().entities[_againstFeature.id]){
			context.background().updateArrowLayer({});
			return;
		}
	    var coord = [ _againstFeature.loc, _feature.loc];
	    if (mode === 'reverse') coord = coord.reverse();
	    var gj = {
	        "type": "LineString",
	        "coordinates": coord
	    };
	    if (mode === 'remove') gj = {};
	    context.background().updateArrowLayer(gj);
    }

	return d3.rebind(_instance, _events, 'on');
}