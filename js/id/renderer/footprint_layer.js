iD.FootprintLayer = function() {
    var projection,
        gj = {},
        enable = true,
        svg;

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([render]);

        svg.enter()
            .append('svg');

        svg.style('display', enable ? 'block' : 'none');


        var paths = svg
            .selectAll('path')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'carousel-footprint');

        var path = d3.geo.path()
            .projection(projection);

        paths
            .attr('d', path);

        if (typeof gj.features !== 'undefined') {
            svg
                .selectAll('text')
                .remove();

            svg
                .selectAll('path')
                .data(gj.features)
                .enter()
                .append('text')
                .attr('class', 'carousel-footprint')
                .text(function(d) {
                    return d.properties.name;
                })
                .attr('x', function(d) {
                    var centroid = path.centroid(d);
                    return centroid[0] + 5;
                })
                .attr('y', function(d) {
                    var centroid = path.centroid(d);
                    return centroid[1];
                });
        }
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
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    render.id = 'layer-footprint';

    return render;
};
