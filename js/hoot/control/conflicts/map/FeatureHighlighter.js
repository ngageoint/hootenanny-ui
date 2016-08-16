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
//      8 Jan. 2016
//          - added moveFront and _moveFrontRecursive to fix hootenanny-ui/issues/122
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
	_instance.highlightLayer = function (ritem, raitem, panTo) {
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

            // Before assiging panToId, check extent coordinates of feature
            if(context.hoot().checkForValidCoordinates(feature.extent(context.graph())[0]) && context.hoot().checkForValidCoordinates(feature.extent(context.graph())[1])){
                panToId = feature.id;
            }

            poiTableCols.push(feature);
            d3.selectAll('.activeReviewFeature')
                .classed('activeReviewFeature', false);
            d3.selectAll('.' + feature.id)
                .classed('tag-hoot activeReviewFeature', true);


        }
        if (againstFeature) {
            poiTableCols.push(againstFeature);
            _parent().reviewIds.push(againstFeature.id);

            // Before assiging panToId, check extent coordinates of againstFeature
            if(!panToId && context.hoot().checkForValidCoordinates(againstFeature.extent(context.graph())[0]) && context.hoot().checkForValidCoordinates(againstFeature.extent(context.graph())[1])){
                panToId = againstFeature.id;
            }

            d3.selectAll('.activeReviewFeature2')
                .classed('activeReviewFeature2', false);
            d3.selectAll('.' + againstFeature.id)
                .classed('tag-hoot activeReviewFeature2', true);

        }

        var currentReviewable = _parent().actions.traversereview.getCurrentReviewable();
        var relId = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
        var relation = context.entity(relId);

        _parent().info.reviewtable.buildPoiTable(poiTableCols, currentReviewable);

        if (relation && relation.members && relation.members.length > 2) {
            var that = this;
            // extract the index of the relation members in the poiTable
            var array_regex = /.(\d+)_.*/;
            var item1 = parseInt(array_regex.exec(ritem.id)[1])-1;
            var item2 = parseInt(array_regex.exec(raitem.id)[1])-1;
            // retrieve array index of previous member
            var calculatePrevious = function(actionIdx, staticIdx) {
                var prev = actionIdx-1;
                if (prev < 0) {
                    prev = relation.members.length-1;
                }
                if (prev === staticIdx) {
                    prev = prev-1;
                    if (prev < 0) {
                        prev = relation.members.length-1;
                    }
                }
                return prev;
            };
            // retrieve array index of next member
            var calculateNext = function(actionIdx, staticIdx) {
                var next = actionIdx+1;
                if (next > relation.members.length-1) {
                    next = 0;
                }
                if (next === staticIdx) {
                    next = next+1;
                    if (next > relation.members.length-1) {
                        next = 0;
                    }
                }
                return next;
            };

            d3.select('td.f1 div.prev').on('click', function(){
                that.highlightLayer(relation.members[calculatePrevious(item1,item2)], raitem);
            });

            d3.select('td.f1 div.next').on('click', function(){
                that.highlightLayer(relation.members[calculateNext(item1,item2)], raitem);
            });

            d3.select('td.f2 div.prev').on('click', function(){
                that.highlightLayer(ritem, relation.members[calculatePrevious(item2,item1)]);
            });

            d3.select('td.f2 div.next').on('click', function(){
                that.highlightLayer(ritem, relation.members[calculateNext(item2,item1)]);
            });
        }

        _parent().reviewIds.push(relId);
        _parent().info.metadata.updateMeta(null);
        if(panToId && panTo) {
            var extent = feature.extent(context.graph()).extend(againstFeature.extent(context.graph()));
            context.map().centerZoom(extent.center(), context.map().trimmedExtentZoom(extent)-0.5);
        }

        _parent().loadReviewFeaturesMapInMap();


    };



    /**
    * @desc Clear highlight
    **/
    _instance.resetHighlight = function(){
        d3.selectAll('.activeReviewFeature').classed('activeReviewFeature', false);
        d3.selectAll('.activeReviewFeature2').classed('activeReviewFeature2', false);
    };

    /**
    * @desc Resets hightlights and move front
    **/
    _instance.moveFront = function(){
        if(context.hoot().mode()==='edit'){
            var activeConflict = _parent().activeConflict(0);
            if(!activeConflict){return;}
            var activeConflictReviewItem = _parent().activeConflict(1);
            _moveFrontRecursive(activeConflictReviewItem, 'activeReviewFeature2');
            _moveFrontRecursive(activeConflict, 'activeReviewFeature');
        }
    };

    /**
    * @desc Highlights 1 degree dependencies
    **/
    _instance.hightligtDependents = function() {

        var poiTableCols = _parent().info.reviewtable.poiTableCols();

        if(poiTableCols) {
            if(poiTableCols[0]) {
                var fid = poiTableCols[0].id;
                var feature = context.hasEntity(fid);
                if(feature){
                    if(feature.type === 'relation') {
                        feature.members
                        .forEach(function(member) {
                            _toggleMouseEvent(member.id, 'tag-hoot activeReviewFeature', 'activeReviewFeature2');
                        });
                    } else {
                        var offFid = null;
                        if(poiTableCols[1]) {
                            offFid = poiTableCols[1].id;
                        }
                        _toggleMouseEvent(poiTableCols[0].id, 'tag-hoot activeReviewFeature', 'activeReviewFeature2', offFid);
                    }
                }

            }

            if(poiTableCols[1]) {

                fid = poiTableCols[1].id;
                feature = context.hasEntity(fid);
                if(feature) {
                    if(feature.type === 'relation') {
                        feature.members
                        .forEach(function(member) {
                            _toggleMouseEvent(member.id, 'tag-hoot activeReviewFeature2', 'activeReviewFeature');
                        });
                    } else {
                        _toggleMouseEvent(poiTableCols[1].id, 'tag-hoot activeReviewFeature2', 'activeReviewFeature', poiTableCols[0].id);
                    }
                }


            }
        }

    };

    /**
    * @desc Mouse event toggler
    * @param fid - feature id to highlight
    * @param ftyp - highlight color class [activeReviewFeature | activeReviewFeature2]
    * @param offType - highlight color class to remove [activeReviewFeature | activeReviewFeature2]
    * @param offFid - member fid that should not be highlighted
    **/
    var _toggleMouseEvent = function(fid, ftype, offType, offFid) {
        d3.selectAll('.' + fid).on('mouseenter', null);
        d3.selectAll('.' + fid).on('mouseleave', null);
        d3.selectAll('.' + fid)
        .on('mouseenter', function(d) {
            _performHighlight(d.id,ftype,offType,true,offFid);
        }).on('mouseleave', function(d) {
            _performHighlight(d.id,ftype,offType,false,offFid);
        });
    };

    /**
    * @desc Highlights each feature
    * @param fid - feature id to highlight
    * @param ftyp - highlight color class [activeReviewFeature | activeReviewFeature2]
    * @param offType - highlight color class to remove [activeReviewFeature | activeReviewFeature2]
    * @param on -  show or hide
    * @param offFid - member fid that should not be highlighted
    **/
    var _performHighlight = function(fid, ftype, offType, on, offFid) {
                //make sure there is actually an entity
        if(context.hasEntity(fid) === undefined || context.hasEntity(offFid) === undefined){return;}

        var feature = context.graph().entity(fid);

        context.graph().parentRelations(feature)
            .forEach(function(parent) {
                _.each(parent.members, function(mem){
                    var mid = mem.id;

                    var mFeature = context.hasEntity(mid);
                    if(mFeature && mid !== offFid) {
                        d3.selectAll('.' + mid).classed(offType, false);
                        d3.selectAll('.' + mid).classed(ftype, on);
                    }

                });
            });
    };


    /**
    * @desc Recursively re highlight and move each feature front for relation members
    **/
    var _moveFrontRecursive = function(fid, className) {
        var f = context.hasEntity(fid);
        if(f){
            if(f.type === 'relation') {
                for(var i=0; i<f.members.length; i++){
                    _moveFrontRecursive(f.members[i].id, className);
                }
            } else {
               d3.selectAll('.' + fid).classed('tag-hoot ' + className, true).moveToFront();
            }
        }

    };

    var _parent = function() {
        return context.hoot().control.conflicts;
    };

    return d3.rebind(_instance, _events, 'on');
};
