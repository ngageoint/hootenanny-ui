iD.Background = function(context) {
    var dispatch = d3.dispatch('change','baseLayerChange'),
        baseLayer = iD.TileLayer()
            .projection(context.projection),
        /*gpxLayer = iD.GpxLayer(context, dispatch)
            .projection(context.projection),*/
        //Added for EGD-plugin
        footprintLayer = iD.FootprintLayer(context, dispatch)
            .projection(context.projection),
        //Added for Hoot review all relations tool
        reviewLayer = iD.ReviewLayer(context, dispatch)
            .projection(context.projection),
        //Added for Hoot review merge tool
        arrowLayer = iD.ArrowLayer(context, dispatch)
            .projection(context.projection),
        //Added for Hoot measurement tool
        measureLayer = iD.MeasureLayer(context, dispatch)
            .projection(context.projection),
        /*mapillaryLayer = iD.MapillaryLayer(context),*/
        overlayLayers = [];

    var backgroundSources;

    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }

    //Added to remove the Locator Overlay layer on layers that have their own labels on
    //the initial launch of the map
    function checkLocatorNeed(locatorNeed){
        if (locatorNeed === 'MAPNIK' || locatorNeed === 'USGS Topographic Maps'){
            return false;
        } else{
            return true;
        }
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

        // Removed for iD v1.9.2
        /*var gpx = context.layers().layer('gpx');
        if (gpx && gpx.enabled() && gpx.hasGpx()) {
            imageryUsed.push('Local GPX');
        }*/

        context.history().imageryUsed(imageryUsed);
    }

    // Allows us to define 'digitalglobe' as the defaultBaseMap
    function getDefaultBaseMap() {
      var dgre = /digitalglobe/i;
      if (dgre.test(iD.data.hootConfig.defaultBaseMap)) {
          var dg = iD.dgservices();
          return iD.BackgroundSource(dg.backgroundSource(undefined, undefined, undefined));
      } else {
          return findSource(iD.data.hootConfig.defaultBaseMap);
      }
    }

    //Need to document why this was modified for Hoot
    function background(selection) {
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

        //Added for Hoot review-relation-goto tool
        var review = selection.selectAll('.review-layer')
        .data([0]);

        review.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer review-layer');

        review.call(reviewLayer);

        //Added for Hoot review merge tool
        var arrow = selection.selectAll('.arrow-layer')
        .data([0]);

        arrow.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer arrow-layer');

        arrow.call(arrowLayer);

        //Added for Hoot measurement tool
        var measure = selection.selectAll('.measure-layer')
        .data([0]);

        measure.enter().insert('div','.layer-data')
            .attr('class','layer-layer measure-layer');

        measure.call(measureLayer);

        // Removed for iD v1.9.2
        /*var gpx = selection.selectAll('.layer-gpx')
            .data([0]);

        gpx.enter().insert('div')
            .attr('class', 'layer-layer layer-gpx');

        gpx.call(gpxLayer);
        var mapillary = selection.selectAll('.layer-mapillary')
            .data([0]);

        mapillary.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary');

        mapillary.call(mapillaryLayer);*/

    }

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with addSource below
    background.addNewBackgroundResource = function (newRes) {
        var newSource = iD.BackgroundSource(newRes);
        backgroundSources.push(newSource);
    };

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with removeSource below
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

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with addNewBackgroundResource above
    background.addSource = function(d) {
        var source = iD.BackgroundSource(d);
        backgroundSources.push(source);
        background.toggleOverlayLayer(source);
    };

    background.updateSource = function(d) {
        var source = findSource(d.id);
        for (var i = backgroundSources.length-1; i >= 0; i--) {
            var layer = backgroundSources[i];
            if (layer === source) {
                backgroundSources[i] = iD.BackgroundSource(d);
                background.addOrUpdateOverlayLayer(backgroundSources[i]);
                break;
            }
        }
    };

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with removeBackgroundResource above
    background.removeSource = function(d) {
        var source = findSource(d.id);
        for (var i = backgroundSources.length-1; i >= 0; i--) {
            var layer = backgroundSources[i];
            if (layer === source) {
                backgroundSources.splice(i, 1);
                background.hideOverlayLayer(source);
                break;
            }
        }
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        // Removed for iD v1.9.2
        /*gpxLayer.dimensions(_);*/
        //Added for EGD-plugin
        footprintLayer.dimensions(_);
        //Added for Hoot review relation tool
        reviewLayer.dimensions(_);
        //Added for Hoot review merge tool
        arrowLayer.dimensions(_);
        //Added for Hoot measurement tool
        measureLayer.dimensions(_);
        // Removed for iD v1.9.2
        /*mapillaryLayer.dimensions(_);*/

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        baseLayer.source(d);
        dispatch.change();
        dispatch.baseLayerChange();
        updateImagery();

        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    // Removed for iD v1.9.2
    /*background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enable();
    };*/

    // function toDom(x) {
    //     return (new DOMParser()).parseFromString(x, 'text/xml');
    // }

    // Removed for iD v1.9.2
    /*background.gpxLayerFiles = function(fileList) {
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
            iD.ui.MapInMap.gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
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

            if (!iD.geo.polygonIntersectsPolygon(viewport, coords, true)) {
                var extent = iD.geo.Extent(d3.geo.bounds(gpxLayer.geojson()));
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }
        }
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enable(!gpxLayer.enable());
        iD.ui.MapInMap.gpxLayer.enable(!iD.ui.MapInMap.gpxLayer.enable());
        dispatch.change();
    };

    background.showsMapillaryLayer = function() {
        return mapillaryLayer.enable();
    };

    background.toggleMapillaryLayer = function() {
        mapillaryLayer.enable(!mapillaryLayer.enable());
        dispatch.change();
    };*/

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.id === 'custom' && baseLayer.source().id === 'custom') ||
            //Added for EGD-plugin
            (d.name() === 'DigitalGlobe Imagery' && (baseLayer.source().id && baseLayer.source().id.indexOf('DigitalGlobe') === 0)) ||
            (d.name() === 'DigitalGlobe Imagery Collection' && overlayLayers.some(function(l) {
                return l.source().id  === 'dgCollection';
            })) ||
            overlayLayers.some(function(l) { return l.source() === d; });
    };

    background.overlayLayerSources = function() {
        return overlayLayers.map(function (l) { return l.source(); });
    };

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with modified toggleOverlayLayer below
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

    //Need to document why this was added for Hoot
    //To fix, Possibly consolidate with modified toggleOverlayLayer below
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

    //To fix, Possibly consolidate with modified showOverlayLayer/hideOverlayLayer above
    background.toggleOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            //Need to document why this was modified for Hoot
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

    //Need to document why this was added for Hoot
    background.addOrUpdateOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (d.id === layer.source().id) {
                overlayLayers.splice(i, 1);
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

    //Added for Hoot review relation tool
    background.updateReviewLayer = function(d,e) {
        d3.selectAll('.gotoreview').remove();
        reviewLayer.geojson(d,e);
        dispatch.change();
    };

    //Added for Hoot review merge tool
    background.updateArrowLayer = function(d) {
        arrowLayer.geojson(d);
        dispatch.change();
    };

  //Added for Hoot measurement tool
    background.updateMeasureLayer = function(d) {
		d3.select('.measure-layer').selectAll('g').remove();
        measureLayer.geojson(d);
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
        //Added in v1.9.2 iD merge

        //eslint never used
        // function parseMap(qmap) {
        //     if (!qmap) return false;
        //     var args = qmap.split('/').map(Number);
        //     if (args.length < 3 || args.some(isNaN)) return false;
        //     return iD.geo.Extent([args[1], args[2]]);
        // }

        var q = iD.util.stringQs(location.hash.substring(1)),
            chosen = q.background || q.layer//,
            //eslint never used
            //extent = parseMap(q.map),
            //best
            ;

        // End of addition from 1.9.2 merge

        backgroundSources = imagery.map(function(source) {
            if (source.type === 'bing') {
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

        // if (!chosen && extent) {
        //     best = _.find(this.sources(extent), function(s) { return s.best(); });
        // }

        if (chosen && chosen.indexOf('custom:') === 0) {
            background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
        } else {
            background.baseLayerSource(findSource(chosen) || getDefaultBaseMap() || backgroundSources[1]);
        }

        var locator = _.find(backgroundSources, function(d) {
            return d.overlay && d.default;
        });

        if (locator && checkLocatorNeed(background.baseLayerSource().imageryUsed())) {
            background.toggleOverlayLayer(locator);
        }

        var overlays = (q.overlays || '').split(',');
        overlays.forEach(function(overlay) {
            overlay = findSource(overlay);
            // if (overlay) background.toggleOverlayLayer(overlay);
        });

        // var gpx = q.gpx;
        // if (gpx) {
        //     d3.text(gpx, function(err, gpxTxt) {
        //         if (!err) {
        //             gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
        //             iD.ui.MapInMap.gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
        //             dispatch.change();
        //         }
        //     });
        // }
    };

    return d3.rebind(background, dispatch, 'on');
};
