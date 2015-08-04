iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer()
            .projection(context.projection),
        gpxLayer = iD.GpxLayer(context, dispatch)
            .projection(context.projection),
        //Added for EGD-plugin
        footprintLayer = iD.FootprintLayer(context, dispatch)
            .projection(context.projection),
        mapillaryLayer = iD.MapillaryLayer(context),
        overlayLayers = [];

    var backgroundSources;

    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }

    function updateImagery() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
            q = iD.util.stringQs(location.hash.substring(1));

        var id = b.id;
        if (id === 'custom') {
            id = 'custom:' + b.template;
        }

        if (id) {
            q.background = id;
        } else {
            delete q.background;
        }

        if (o) {
            q.overlays = o;
        } else {
            delete q.overlays;
        }

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [b.imageryUsed()];

        overlayLayers.forEach(function (d) {
            var source = d.source();
            if (!source.isLocatorOverlay()) {
                imageryUsed.push(source.imageryUsed());
            }
        });

        if (background.showsGpxLayer()) {
            imageryUsed.push('Local GPX');
        }

        context.history().imageryUsed(imageryUsed);
    }

    //TODO: Document why this was modified for Hoot
    function background(selection) {
        if (typeof context.hoot === 'function') {
            var layers = context.hoot().model.layers.getLayers();

            var idx = -1;
            for(var i=0; i<backgroundSources.length; i++){
                var bkgSrc = backgroundSources[i];
                if(bkgSrc.subtype === 'density_raster'){
                    var lyr = _.find(layers, function(d){
                        return d.name === bkgSrc.name();
                    });
                    if(!lyr){
                        idx = i;
                        break;
                    }

                }
            }


            while(idx > -1){
                backgroundSources.splice(idx, 1);
                idx = -1;
                for(var i=0; i<backgroundSources.length; i++){
                    var bkgSrc = backgroundSources[i];
                    if(bkgSrc.subtype === 'density_raster'){
                        var lyr = _.find(layers, function(d){
                            return d.name === bkgSrc.name();
                        });
                        if(!lyr){
                            idx = i;
                            break;
                        }

                    }
                }

            }

            for(var key in layers){
                var lyrName = layers[key].name;

                var lyr = _.find(backgroundSources, function(d){
                    return d.name() === lyrName;
                });

                if(!lyr){
                    var newOverlayer = {};
                    newOverlayer.name = lyrName;
                    newOverlayer.type = 'tms';
                    newOverlayer.descriptions = lyrName;
                    newOverlayer.template = location.origin +  '/static/' + lyrName + '/{zoom}/{x}/{y}.png';
                    newOverlayer.scaleExtent = [0,20];
                    newOverlayer.overlay = true;
                    newOverlayer.projection = 'mercator';
                    newOverlayer.subtype = 'density_raster';

                    var newSource = iD.BackgroundSource(newOverlayer);
                    backgroundSources.push(newSource);
                }


            }
        }
        var base = selection.selectAll('.background-layer')
            .data([0]);

        base.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer background-layer');

        base.call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) { return d.source().name(); });

        overlays.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer layer-overlay');

        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();

        //Added for EGD-plugin
        var footprint = selection.selectAll('.footprint-layer')
        .data([0]);

        footprint.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer footprint-layer');

        footprint.call(footprintLayer);

        var gpx = selection.selectAll('.layer-gpx')
            .data([0]);

        gpx.enter().insert('div')
            .attr('class', 'layer-layer layer-gpx');

        gpx.call(gpxLayer);
        var mapillary = selection.selectAll('.layer-mapillary')
            .data([0]);

        mapillary.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary');

        mapillary.call(mapillaryLayer);
    }

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with addSource below
    background.addNewBackgroundResource = function (newRes) {
        var newSource = iD.BackgroundSource(newRes);
        backgroundSources.push(newSource);
    };

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with removeSource below
    background.removeBackgroundResource = function(name){
        var src;

        for (var i = 0; i < backgroundSources.length; i++) {
            src = backgroundSources[i];
            if (src.name() === name) {
                backgroundSources.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }
        }
    };

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with addNewBackgroundResource above
    background.addSource = function(d) {
        var source = iD.BackgroundSource(d);
        backgroundSources.push(source);
        background.toggleOverlayLayer(source);
    };

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with removeBackgroundResource above
    background.removeSource = function(d) {
        var source = findSource(d.id);
        for (var i = backgroundSources.length-1; i >= 0; i--) {
            var layer = backgroundSources[i];
            if (layer === source) {
                backgroundSources.splice(i, 1);
            }
        }
        background.toggleOverlayLayer(source);
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        gpxLayer.dimensions(_);
        //Added for EGD-plugin
        footprintLayer.dimensions(_);
        mapillaryLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        baseLayer.source(d);
        dispatch.change();
        updateImagery();

        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enable();
    };

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    background.gpxLayerFiles = function(fileList) {
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
            background.zoomToGpxLayer();
            dispatch.change();
        };

        reader.readAsText(f);
    };

    background.zoomToGpxLayer = function() {
        if (background.hasGpxLayer()) {
            var map = context.map(),
                viewport = map.trimmedExtent().polygon(),
                coords = _.reduce(gpxLayer.geojson().features, function(coords, feature) {
                    var c = feature.geometry.coordinates;
                    return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
                }, []);

            if (!iD.geo.polygonIntersectsPolygon(viewport, coords)) {
                var extent = iD.geo.Extent(d3.geo.bounds(gpxLayer.geojson()));
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }
        }
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enable(!gpxLayer.enable());
        dispatch.change();
    };

    background.showsMapillaryLayer = function() {
        return mapillaryLayer.enable();
    };

    background.toggleMapillaryLayer = function() {
        mapillaryLayer.enable(!mapillaryLayer.enable());
        dispatch.change();
    };

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.id === 'custom' && baseLayer.source().id === 'custom') ||
            //Added for EGD-plugin
            (d.id === 'dgBackground' && baseLayer.source().id === 'dgBackground') ||
            (d.id === 'dgCollection' && overlayLayers.some(function(l) { return l.source().id === 'dgCollection'; })) ||
            overlayLayers.some(function(l) { return l.source() === d; });
    };

    background.overlayLayerSources = function() {
        return overlayLayers.map(function (l) { return l.source(); });
    };

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with modified toggleOverlayLayer below
    background.showOverlayLayer = function(d){
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (layer.source().name() === d.name()) {
                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    //TODO: Document why this was added for Hoot
    //FIXME: Possibly consolidate with modified toggleOverlayLayer below
    background.hideOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (layer.source().name() === d.name()) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }
        }

    };

    //FIXME: Possibly consolidate with modified showOverlayLayer/hideOverlayLayer above
    background.toggleOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            //TODO: Document why this was modified for Hoot
            if (layer.source().name() === d.name()) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }

            if (layer.source() === d || (d.id === 'dgCollection' && d.id === layer.source().id)) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    //TODO: Document why this was added for Hoot
    background.addOrUpdateOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (d.id === layer.source().id) {
                overlayLayers.splice(i, 1);
//                dispatch.change();
//                updateImagery();
//                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    //Added for EGD-plugin
    background.updateFootprintLayer = function(d) {
        footprintLayer.geojson(d);
        dispatch.change();
    };
    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.change();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.change();
        return background;
    };
    background.load = function(imagery) {
        backgroundSources = imagery.map(function(source) {
            if (source.type === 'bing') {
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

    var q = iD.util.stringQs(location.hash.substring(1)),
        chosen = q.background || q.layer;

    if (chosen && chosen.indexOf('custom:') === 0) {
        background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
    } else {
            background.baseLayerSource(findSource(chosen) || findSource(iD.data.hootConfig.defaultBaseMap) || backgroundSources[1]);
    }

    var locator = _.find(backgroundSources, function(d) {
        return d.overlay && d.default;
    });

    if (locator) {
        background.toggleOverlayLayer(locator);
    }

    var overlays = (q.overlays || '').split(',');
    overlays.forEach(function(overlay) {
        overlay = findSource(overlay);
        if (overlay) background.toggleOverlayLayer(overlay);
    });

    var gpx = q.gpx;
    if (gpx) {
        d3.text(gpx, function(err, gpxTxt) {
            gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
            dispatch.change();
        });
    }
    };

    return d3.rebind(background, dispatch, 'on');
};
