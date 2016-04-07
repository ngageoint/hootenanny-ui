iD.operations.Review = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection);

    var operation = function() {
        var annotation = 'Show review relations for this feature';
        // If selected node is current review item AND relations are already visualized, turn off
        if(!d3.select('.review-layer').selectAll('.' + entityId + '_edge').empty()){
            d3.selectAll("[class*=edge]").classed( entityId + '_edge',false);
            context.background().updateReviewLayer({},"");
            return;
        } 

        _performHighlight(context.graph());
        _selectReview(context.graph());
    };

    operation.available = function() {
        //return context.hoot().control.conflicts.isConflictReviewExist();
        //return only if there is a need for review
        var feature = context.hasEntity(entityId);
        var graph = context.graph();
        return !_.isEmpty(_.find(graph.parentRelations(feature),function(item){return item.tags['hoot:review:needs'] == 'yes'}));
    };

    operation.disabled = function() {
        
        return false;
    };

    operation.tooltip = function() {
        return 'Show review relations for this feature';
    };

    var _getLocation = function(feature){
        var eId = feature.id;
        if(feature.type=='node'){
            return feature.loc;
        } else if (feature.type=='way'){
            return _getClosestPoint(feature);            
        }
    }

    var _getClosestPoint = function(feature) {
        var path = d3.select('path.'+feature.id);
        var pathNode = path.node();
        var centerPt = context.projection(context.entity(feature.id).extent(context.graph()).center());

        var pathLength = pathNode.getTotalLength(),
            precision = 8,
            best,
            bestLength,
            bestDistance = Infinity;

        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength),centerPt)) < bestDistance) {
                best = scan, bestLength = scanLength, bestDistance = scanDistance;
            }
        }

        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
            var before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
            if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength),centerPt)) < bestDistance) {
                best = before, bestLength = beforeLength, bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength),centerPt)) < bestDistance) {
                best = after, bestLength = afterLength, bestDistance = afterDistance;
            } else {
                precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return context.projection.invert(best);
    }

    var distance2 = function(p,point){
        var dx = p.x - point[0],
        dy = p.y - point[1];
        return dx * dx + dy * dy;
    }

    var _performHighlight = function(graph) {
        var feature = context.hasEntity(entityId);
        var featureLoc = _getLocation(feature);

        var multiLines = [];
        graph.parentRelations(feature)
            .forEach(function(parent) {
                if(parent.tags['hoot:review:needs']!='no'){
                    _.each(parent.members, function(mem){
                        var mid = mem.id;

                        var mFeature = context.hasEntity(mid);
                        if(mFeature && (entityId != mid)) {
                            mFeatureLoc = _getLocation(mFeature);
                            var coord = [ featureLoc,mFeatureLoc];
                            multiLines.push(coord);
                        }                        
                    });
                }
            });

        _loadReview('', multiLines);
    }

    var _loadReview = function(mode, multiLines) {
        //if (d3.event) d3.event.preventDefault();
        if(!context.graph()){
            
            return;
        }
        
        var gj = {
            "type": "MultiLineString",
            "coordinates": multiLines
        };
        if (mode === 'remove') gj = {};
        context.background().updateReviewLayer(gj, entityId);

    }

    var _selectReview = function(graph) {
        d3.selectAll('.gotoreview').remove();

        // Create a label above all POIs in relation
        var svg = d3.select('.layer-label');

        var currentAlpha = 97,
        endingAlpha = 122,
        doubleLetter = false;

        var feature = context.hasEntity(entityId);
        var featureLoc = _getLocation(feature);

        graph.parentRelations(feature)
            .forEach(function(parent) {
                if(parent.tags['hoot:review:needs']!='no'){
                    _.each(parent.members, function(mem){
                        var mid = mem.id;

                        var mFeature = context.hasEntity(mid);
                        mFeatureLoc = _getLocation(mFeature);

                        var circleOffset = feature.type == 'node' ? 50 : 0;

                        if(mFeature && (entityId != mid)) {
                            //take this coord, convert to SVG, add to map
                            var c = context.projection(mFeatureLoc);
                            var transform = 'translate('.concat(c[0],',',c[1]-circleOffset,')');
                            var g = svg.append('g').attr('transform',transform).attr('loc',mFeatureLoc).classed('gotoreview _' + mFeature.type,true);
                            g.append('circle').attr('r','20')
                                .attr('stroke','white').attr('stroke-width','3')
                                .attr('fill','green').attr('fill-opacity','0.5');
                            g.append('text').attr('dx','-6').attr('dy','6')
                                .style('fill','white').style('font-size','16px').attr('font-weight','bold')
                                .text(function(){
                                    if(!doubleLetter){return String.fromCharCode(currentAlpha).toUpperCase();}
                                    else{return String.fromCharCode(currentAlpha).toUpperCase().concat(String.fromCharCode(currentAlpha).toUpperCase());}
                                });
                            
                            var reqParam = {
                                'mapId':this.mapId,
                                'sequence':this.tags['hoot:review:sort_order']
                            };

                            var _parent = function() {return context.hoot().control.conflicts;};

                            g.on('click',function(){
                                Hoot.model.REST('reviewGetReviewItem', reqParam, function (resp) {  
                                    if(resp.error){
                                        context.hoot().view.utilities.errorlog.reportUIError(d.error);
                                        return;
                                    } 

                                    if(resp.resultCount < 1){
                                      alert('The review item already has been resolved. Can not go to review item.');
                                    } else {
                                        // Set as current reviewable item
                                        _parent().actions.traversereview.setCurrentReviewable(resp);
                                        _parent().actions.idgraphsynch.getRelationFeature(resp.mapId, resp.relationId, 
                                        function(newReviewItem){
                                            _parent().map.featurehighlighter.highlightLayer(newReviewItem.members[0], 
                                                newReviewItem.members[1],false);
                                        });                              
                                    }
                                });
                            });

                            currentAlpha += 1;
                            if(currentAlpha > 122){currentAlpha = 97; doubleLetter = true;}                      
                        }  
                    },parent);
                }
            });
    }

    operation.id = 'review';
    operation.keys = ['Shift+R'];
    operation.title = 'Review';

    return operation;
};
