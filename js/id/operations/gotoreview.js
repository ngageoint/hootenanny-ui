iD.operations.Gotoreview = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Review(entityId, context.projection),
        rectMargin=30;

    var operation = function() {
        var annotation = 'Go to related review item';

        _performHighlight(context.graph());
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

        var feature = context.hasEntity(entityId);
        graph.parentRelations(feature)
            .forEach(function(parent) {
                _.each(parent.members, function(mem){
                    var mid = mem.id;

                    var mFeature = context.hasEntity(mid);
                    if(mFeature && (entityId != mid)) {
                        var coord = [ feature.loc, mFeature.loc];
                        console.log(coord);

                        //take this coord, convert to SVG, add to map

                    }
                        
                });
            });

        
        var g = svg.append('g');
        
        //rect = g.append('rect').style('fill','black').style('fill-opacity','0.5');
        label = g.append('text').style('fill','white').style('font-size','18px');        

        lengthLabel = label.append("tspan").text("TEST");
        
        c = [200,200];

        /*rect.attr("x", c[0]+10)
            .attr("y", c[1]-(label.dimensions()[1]/2))
            .attr("width",label.dimensions()[0]+5)
            .attr("height",label.dimensions()[1]+5);*/

        label.attr("x", c[0]+rectMargin)
            .attr("y", c[1]+rectMargin);
        lengthLabel.attr("x", c[0]+10)
            .attr("y", c[1])
            .text(function(d) { return 'test'});
    }
    

    operation.id = 'gotoreview';
    operation.keys = ['G'];
    operation.title = 'Go to Review';

    return operation;
};
