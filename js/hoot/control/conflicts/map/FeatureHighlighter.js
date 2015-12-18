/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.map.featurehighlighter highlights the reviewable items on map
// where
// 1. Show/Hide merge button
// 2. Render review table
// 3. Highlights review items
// 4. Stores review items into global variable
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.map.featurehighlighter = function (context)
{
	var _events = d3.dispatch();
	var _instance = {};

    /**
    * @desc highlights the reviewable items on map and performs associated operation
    * @param ritem - review item 1
    * @param raitem - review item 2
    **/
    //@TODO: change params to array
	_instance.highlightLayer = function (ritem, raitem) {
   
        var feature = null;
        var againstFeature = null;
        
        if(ritem){
            feature = context.hasEntity(ritem.id);
        }

        if(raitem){
            againstFeature = context.hasEntity(raitem.id);
        }
        //Merge currently only works on nodes
        if ((feature && againstFeature) && (feature.id.charAt(0) === 'n' && againstFeature.id.charAt(0) === 'n')) {
            //Show merge button
            d3.select('a.merge').classed('hide', false);
            //Override with current pair of review features
            _parent().actions.poimerge.enableMergeFeature(true, feature, againstFeature);
            
            //Add hover handler to show arrow
            _parent().map.reviewarrowrenderer.activate(feature, againstFeature);
            
        } else {
            //Hide merge button
            d3.select('a.merge').classed('hide', true);
            //Override with no-op
            _parent().actions.poimerge.enableMergeFeature(false, null, null);
            d3.select('a.merge').on('mouseenter', function() {}).on('mouseleave', function() {});
        }

        _instance.resetHighlight();
        _parent().reviewIds = [];
        var poiTableCols= [];
        var panToId = null;
    
        if (feature) {
            _parent().reviewIds.push(feature.id);
            panToId = feature.id;
            poiTableCols.push(feature);
            d3.selectAll('.activeReviewFeature')
                .classed('activeReviewFeature', false);
            d3.selectAll('.' + feature.id)
                .classed('tag-hoot activeReviewFeature', true);
         
        }
        if (againstFeature) {
            poiTableCols.push(againstFeature);
            _parent().reviewIds.push(againstFeature.id);
            if(!panToId){
                panToId = againstFeature.id;
            }
            d3.selectAll('.activeReviewFeature2')
                .classed('activeReviewFeature2', false);
            d3.selectAll('.' + againstFeature.id)
                .classed('tag-hoot activeReviewFeature2', true);

        }

        _parent().info.reviewtable.buildPoiTable(poiTableCols);

        var currentReviewable = _parent().actions.traversereview.getCurrentReviewable();
        var relId = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
        _parent().reviewIds.push(relId);
        _parent().info.metadata.updateMeta(null);
        if(panToId) {
            _parent().map.featureNavigator.panToEntity(context.entity(panToId));
        }
   
        
    };

    /**
    * @desc Clear highlight
    **/
    _instance.resetHighlight = function(){
        d3.selectAll('.activeReviewFeature').classed('activeReviewFeature', false);
        d3.selectAll('.activeReviewFeature2').classed('activeReviewFeature2', false);
    }

    var _parent = function() {
        return context.hoot().control.conflicts;
    }

	return d3.rebind(_instance, _events, 'on');
}