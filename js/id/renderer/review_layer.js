iD.ReviewLayer = function() {
    var projection,
        gj = {},
        enable = true,
        entityId = '',
        svg;

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([render]);

        svg.enter()
            .append('svg')
            .append('defs');

        svg.style('display', enable ? 'block' : 'none');


        var paths = svg
            .selectAll('path.review.line')
            .attr('class','')
            .classed('review line ',true)
            .classed(entityId,true)
            .data([gj]);


        paths.enter()
            .append('path')
            .classed('review line ',true)
            ;

        var path = d3.geo.path()
            .projection(projection);

        paths.attr('d', path);
    }

    render.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return render;
    };

    render.enable = function(_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.geojson = function(_) {
        if (!arguments.length) return gj;
        gj = _;
        entityId = arguments[1] ? arguments[1] + '_edge' : '';
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    render.id = 'layer-review';

    return render;
};
