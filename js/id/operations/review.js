iD.operations.Review = function(selectedIDs, context) {
    var entityId = selectedIDs[0];
    /*var entity = context.entity(entityId);/
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection);*/

    var operation = function() {
        // If selected node is current review item AND relations are already visualized, turn off
        if(!d3.select('.review-layer').selectAll('.' + entityId + '_edge').empty()){
            d3.selectAll('[class*=edge]').classed( entityId + '_edge',false);
            context.background().updateReviewLayer({},'');
            return;
        }

        context.hoot().control.conflicts.actions.traversereview.setCurrentReviewableEntityId(entityId);
        _performHighlight(context.graph());
        _selectReview(context.graph());
    };

    operation.available = function() {
        //return context.hoot().control.conflicts.isConflictReviewExist();
        //return only if there is a need for review
        var feature = context.hasEntity(entityId);
        var graph = context.graph();
        return !_.isEmpty(_.find(graph.parentRelations(feature),function(item){return item.tags['hoot:review:needs'] === 'yes';}));
    };

    operation.disabled = function() {

        return false;
    };

    operation.tooltip = function() {
        return 'Show review relations for this feature';
    };

    var _getLocation = function(feature){
        if(feature.type==='node'){
            return feature.loc;
        } else if (feature.type==='way'){
            return _getClosestPoint(feature);
        }
    };

    var _getClosestPoint = function(feature) {
        var path = d3.select('path.'+feature.id);
        var pathNode = path.node();
        if (!pathNode) return null; //some features are loaded, but not drawn in visible extent (maybe?)
        var centerPt = context.projection(context.entity(feature.id).extent(context.graph()).center());

        var pathLength = pathNode.getTotalLength(),
            precision = 8,
            best,
            bestLength,
            bestDistance = Infinity;

        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength),centerPt)) < bestDistance) {
                best = scan;
                bestLength = scanLength;
                bestDistance = scanDistance;
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
              best = before; bestLength = beforeLength; bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength),centerPt)) < bestDistance) {
              best = after; bestLength = afterLength; bestDistance = afterDistance;
            } else {
              precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return context.projection.invert(best);
    };

    var distance2 = function(p,point){
        var dx = p.x - point[0],
        dy = p.y - point[1];
        return dx * dx + dy * dy;
    };

    var _performHighlight = function(graph) {
        var feature = context.hasEntity(entityId);
        var featureLoc = _getLocation(feature);

        function collectReviewLines(mem) {
            var mid = mem.id;
            var mFeature = context.hasEntity(mid);

            if (mem.type === 'relation') {
                mFeature.members.forEach(function(m) {
                    collectReviewLines(m);
                });
            } else {

                if(mFeature && (entityId !== mid)) {
                    var mFeatureLoc = _getLocation(mFeature);
                    if (mFeatureLoc) {
                        var coord = [ featureLoc,mFeatureLoc];
                        multiLines.push(coord);
                    }
                }
            }
            return;
        }

        var multiLines = [];
        graph.parentRelations(feature)
            .forEach(function(parent) {
                if(parent.tags['hoot:review:needs']!=='no'){
                    _.each(parent.members, function(mem){
                        collectReviewLines(mem);
                    });
                }
            });

        _loadReview('', multiLines);
    };

    var _loadReview = function(mode, multiLines) {
        //if (d3.event) d3.event.preventDefault();
        if(!context.graph()){

            return;
        }

        var gj = {
            'type': 'MultiLineString',
            'coordinates': multiLines
        };
        if (mode === 'remove') gj = {};
        context.background().updateReviewLayer(gj, entityId);

    };

    var _selectReview = function(graph) {
        d3.selectAll('.gotoreview').remove();

        // Create a label above all POIs in relation
        var svg = d3.select('.layer-label');

        var currentAlpha = 97,
        doubleLetter = false;

        var feature = context.hasEntity(entityId);
        //var featureLoc = _getLocation(feature);

        function collectReviewPoints(mem) {
            var mid = mem.id;
            var mFeature = context.hasEntity(mid);

            if (mem.type === 'relation') {
                mFeature.members.forEach(function(m) {
                    return collectReviewPoints(m);
                });
            } else {

                if(mFeature && (entityId !== mid)) {
                    var mFeatureLoc = _getLocation(mFeature);
                    if (mFeatureLoc) {
                        points.push(mFeatureLoc);
                    }
                }
            }
        }
        var points;
        graph.parentRelations(feature)
            .forEach(function(parent) {
                if(parent.tags['hoot:review:needs']!=='no'){
                    _.each(parent.members, function(mem){
                        var mid = mem.id;
                        var currentReview = this;
                        var mFeature = context.hasEntity(mid);
                        var circleOffset = feature.type === 'node' ? 50 : 0;
                        points = [];
                        collectReviewPoints(mem);
                        points.forEach(function(mFeatureLoc) {
                        if(mFeature && mFeatureLoc && (entityId !== mid)) {
                            //take this coord, convert to SVG, add to map
                            var c = context.projection(mFeatureLoc);
                            var transform = 'translate('.concat(c[0],',',c[1]-circleOffset,')');                            
                            var drag = d3.behavior.drag()
                                .origin(function(d) {return d; })
                                .on('dragstart', function() {
                                    d3.event.sourceEvent.stopPropagation();
                                })
                                .on('drag', function() {
                                    var m = context.projection(context.map().mouseCoordinates());                                    
                                    var transform = 'translate('.concat(m[0],',',m[1],')');
                                    d3.select(this).attr('transform', transform);
                                })
                                .on('dragend', function() {
                                    d3.select(this).attr('loc',context.map().mouseCoordinates()).attr('state','dragged');
                                });
                            var g = svg.append('g').attr('transform',transform).attr('loc',mFeatureLoc).classed('gotoreview _' + mFeature.type,true).call(drag);
                            g.append('circle').attr('r','15')
                                .attr('stroke','white').attr('stroke-width','2')
                                .attr('fill','green').attr('fill-opacity','0.5');
                            g.append('text').attr('dy','5')
                                .style('fill','white').style('font-size','14px').style('text-anchor', 'middle').attr('font-weight','bold')
                                .text(function(){
                                    if(!doubleLetter){return String.fromCharCode(currentAlpha).toUpperCase();}
                                    else{return String.fromCharCode(currentAlpha).toUpperCase().concat(String.fromCharCode(currentAlpha).toUpperCase());}
                                });

                            var reqParam = {
                                'mapId':currentReview.mapId,
                                'sequence':currentReview.tags['hoot:review:sort_order']
                            };

                            var _parent = function() {return context.hoot().control.conflicts;};

                            g.on('click',function(){
                                var hasChange = context.history().hasChanges();
                                if(hasChange === true) {
                                    iD.ui.Alert('Please resolve or undo the current feature ' +
                                        'changes before proceeding to the next review.', 'warning',new Error().stack);
                                    return;
                                }

                                Hoot.model.REST('reviewGetReviewItem', reqParam, function (resp) {
                                    if(resp.error){
                                        context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                                        return;
                                    }

                                    if(resp.resultCount < 1){
                                      alert('The review item already has been resolved. Can not go to review item.');
                                    } else {
                                        // Set as current reviewable item
                                        _parent().actions.traversereview.setCurrentReviewableEntityId(entityId);
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
                        });
                    },parent);
                }
            });
    };

    operation.id = 'review';
    operation.keys = ['Shift+R'];
    operation.title = 'Review';

    return operation;
};