iD.svg.FarLine = function(projection, context) {

    var highway_stack = {
        motorway: 0,
        motorway_link: 1,
        trunk: 2,
        trunk_link: 3,
        primary: 4,
        primary_link: 5,
        secondary: 6,
        tertiary: 7,
        unclassified: 8,
        residential: 9,
        service: 10,
        footway: 11
    };

    function waystack(a, b) {
        var as = 0, bs = 0;

        if (a.tags.highway) { as -= highway_stack[a.tags.highway]; }
        if (b.tags.highway) { bs -= highway_stack[b.tags.highway]; }
        return as - bs;
    }

    return function drawLines(surface, graph, entities, filter) {
        var ways = [], pathdata = {}, onewaydata = {},
            getPath = iD.svg.Path(projection, graph);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i],
                outer = iD.geo.simpleMultipolygonOuterMember(entity, graph);
            if (outer) {
                ways.push(entity.mergeTags(outer.tags));
            } else if (entity.geometry(graph) === 'line') {
                ways.push(entity);
            }
        }

        ways = ways.filter(getPath);

        pathdata = _.groupBy(ways, function(way) { return way.layer(); });

        _.forOwn(pathdata, function(v, k) {
            onewaydata[k] = _(v)
                .filter(function(d) { return d.isOneWay(); })
                .map(iD.svg.OneWaySegments(projection, graph, 35))
                .flatten()
                .valueOf();
        });

        var layergroup = surface
            .select('.layer-lines')
            .selectAll('g.layergroup')
            .data(d3.range(-10, 11));

        layergroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer layergroup layer' + String(d); });


        var linegroup = layergroup
            .selectAll('g.linegroup')
            .data(['shadow', 'casing', 'stroke']);

        linegroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer linegroup line-' + d; });


        var lines = linegroup
            .selectAll('path')
            .filter(filter)
            .data(
                function() { return pathdata[this.parentNode.parentNode.__data__] || []; },
                iD.Entity.key
            );

        // Optimization: call simple TagClasses only on enter selection. This
        // works because iD.Entity.key is defined to include the entity v attribute.
        lines.enter()
            .append('path')
            .attr('class', function(d) { return 'way line ' + this.parentNode.__data__ + ' ' + d.id; })
            .call(iD.svg.TagClasses(context));

        lines
            .sort(waystack)
            .attr('d', getPath)
            .call(iD.svg.TagClasses(context).tags(iD.svg.MultipolygonMemberTags(graph)));

        lines.exit()
            .remove();


        var onewaygroup = layergroup
            .selectAll('g.onewaygroup')
            .data(['oneway']);

        onewaygroup.enter()
            .append('g')
            .attr('class', 'layer onewaygroup');


        var oneways = onewaygroup
            .selectAll('path')
            .filter(filter)
            .data(
                function() { return onewaydata[this.parentNode.parentNode.__data__] || []; },
                function(d) { return [d.id, d.index]; }
            );

        oneways.enter()
            .append('path')
            .attr('class', 'oneway')
            .attr('marker-mid', 'url(#oneway-marker)');

        oneways
            .attr('d', function(d) { return d.d; });

        oneways.exit()
            .remove();

    };
};



iD.svg.FarArea = function(projection) {
    // Patterns only work in Firefox when set directly on element.
    // (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
    var patterns = {
        wetland: 'wetland',
        beach: 'beach',
        scrub: 'scrub',
        construction: 'construction',
        military: 'construction',
        cemetery: 'cemetery',
        grave_yard: 'cemetery',
        meadow: 'meadow',
        farm: 'farmland',
        farmland: 'farmland',
        orchard: 'orchard'
    };

    var patternKeys = ['landuse', 'natural', 'amenity'];

    function setPattern(d) {
        for (var i = 0; i < patternKeys.length; i++) {
            if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                this.style.fill = this.style.stroke = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                return;
            }
        }
        this.style.fill = this.style.stroke = '';
    }

    return function drawAreas(surface, graph, entities, filter, context) {
        var path = iD.svg.Path(projection, graph, true),
            areas = {},
            multipolygon;

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph);
            if (multipolygon) {
                areas[multipolygon.id] = {
                    entity: multipolygon.mergeTags(entity.tags),
                    area: Math.abs(entity.area(graph))
                };
            } else if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(entity.area(graph))
                };
            }
        }

        areas = d3.values(areas).filter(function hasPath(a) { return path(a.entity); });
        areas.sort(function areaSort(a, b) { return b.area - a.area; });
        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function(area) {
            return area.type === 'way';
        });

        var data = {
            clip: areas,
            shadow: strokes,
            stroke: strokes,
            fill: areas
        };

        var clipPaths = surface.selectAll('defs').selectAll('.clipPath')
           .filter(filter)
           .data(data.clip, iD.Entity.key);

        clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath')
           .attr('id', function(entity) { return entity.id + '-clippath'; })
           .append('path');

        clipPaths.selectAll('path')
           .attr('d', path);

        clipPaths.exit()
           .remove();

        var areagroup = surface
            .select('.layer-areas')
            .selectAll('g.areagroup')
            .data(['fill', 'shadow', 'stroke']);

        areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'layer areagroup area-' + d; });

        var paths = areagroup
            .selectAll('path')
            .filter(filter)
            .data(function(layer) { return data[layer]; }, iD.Entity.key);

        // Remove exiting areas first, so they aren't included in the `fills`
        // array used for sorting below (https://github.com/openstreetmap/iD/issues/1903).
        paths.exit()
            .remove();

        var fills = surface.selectAll('.area-fill path.area')[0];

        var bisect = d3.bisector(function(node) {
            return -node.__data__.area(graph);
        }).left;

        function sortedByArea(entity) {
            if (this.__data__ === 'fill') {
                return fills[bisect(fills, -entity.area(graph))];
            }
        }

        paths.enter()
            .insert('path', sortedByArea)
            .each(function(entity) {
                var layer = this.parentNode.__data__;

                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    this.setAttribute('clip-path', 'url(#' + entity.id + '-clippath)');
                    setPattern.apply(this, arguments);
                }
            })
            .call(iD.svg.TagClasses(context));

        paths
            .attr('d', path);
    };
};
