iD.operations.Gotoreview = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection),
        rectMargin=30;

    var operation = function() {
        var annotation = 'Go to related review item';

        _selectReview(context.graph());
    };

    operation.available = function() {
        return context.hoot().control.conflicts.isConflictReviewExist();
    };

    operation.disabled = function() {
        
        return false;
    };

    operation.tooltip = function() {
        return 'Go to related review item.';
    };

    var _selectReview = function(graph) {
        // Create a label above all POIs in relation
        var svg = d3.select('.layer-label');

        var currentAlpha = 97,
        endingAlpha = 122,
        doubleLetter = false;

        var feature = context.hasEntity(entityId);
        graph.parentRelations(feature)
            .forEach(function(parent) {
                _.each(parent.members, function(mem){
                    var mid = mem.id;

                    var mFeature = context.hasEntity(mid);
                    if(mFeature && (entityId != mid)) {
                        //take this coord, convert to SVG, add to map
                        var c = context.projection(mFeature.loc);
                        var transform = 'translate('.concat(c[0],',',c[1]-50,')');
                        var g = svg.append('g').attr('transform',transform).attr('loc',mFeature.loc).classed('gotoreview',true);
                        g.append('circle').attr('r','20')
                            .attr('stroke','white').attr('stroke-width','3')
                            .attr('fill','green').attr('fill-opacity','0.5');
                        g.append('text').attr('dx','-6').attr('dy','6')
                            .style('fill','white').style('font-size','16px').attr('font-weight','bold')
                            .text(function(){
                                if(!doubleLetter){return String.fromCharCode(currentAlpha).toUpperCase();}
                                else{return String.fromCharCode(currentAlpha).toUpperCase().concat(String.fromCharCode(currentAlpha).toUpperCase());}
                            });
                        g.on('click',function(){
                            var loc = d3.select('.layer-label').select('g').attr('loc').split(/,/).map(parseFloat);
                            console.log(loc);
                        });

                        currentAlpha += 1;
                        if(currentAlpha > 122){currentAlpha = 97; doubleLetter = true;}                      
                    }  
                });
            });
    }
    

    operation.id = 'gotoreview';
    operation.keys = ['G'];
    operation.title = 'Go to Review';

    return operation;
};
