iD.Map = function(context) {
    var dimensions = [1, 1],
        //TODO: Document why this was modified for Hoot
        dispatch = d3.dispatch('move', 'drawn', 'maxImportZoomChanged', 'drawVector', 'updateBackgroundList'),
        projection = context.projection,
        roundedProjection = iD.svg.RoundProjection(projection),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale() * 2 * Math.PI)
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        transformStart,
        transformed = false,
        minzoom = 0,
        points = iD.svg.Points(roundedProjection, context),
        vertices = iD.svg.Vertices(roundedProjection, context),
        lines = iD.svg.Lines(projection),
        areas = iD.svg.Areas(projection),
        midpoints = iD.svg.Midpoints(roundedProjection, context),
        labels = iD.svg.Labels(projection, context),
        supersurface, surface,
        mouse,
        mousemove,
        //TODO: Document why this was added for Hoot
        editableZoom = 2,
        visibleZoom = 16,
        loadVectorOnTilesLoad = false;


    function map(selection) {
        context.history()
            .on('change.map', function(){
                redraw(undefined, undefined, true);
            });
        context.background()
            .on('change.map', redraw);
        context.features()
            .on('redraw.map', redraw);
        //TODO: Document why this was added for Hoot
        context.connection()
            .on('layer', redraw);

        selection
            .on('dblclick.map', dblClick)
            .call(zoom);

        supersurface = selection.append('div')
            .attr('id', 'supersurface');

        // Need a wrapper div because Opera can't cope with an absolutely positioned
        // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
        var dataLayer = supersurface.append('div')
            .attr('class', 'layer-layer layer-data');

        map.surface = surface = dataLayer.append('svg')
            .on('mousedown.zoom', function() {
                if (d3.event.button === 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) redraw();
            })
            .attr('id', 'surface')
            .call(iD.svg.Surface(context));

        supersurface.call(context.background());

        surface.on('mousemove.map', function() {
            mousemove = d3.event;
        });

        surface.on('mouseover.vertices', function() {
            if (map.editable() && !transformed) {
                var hover = d3.event.target.__data__;
                surface.call(vertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                dispatch.drawn({full: false});
            }
        });

        surface.on('mouseout.vertices', function() {
            if (map.editable() && !transformed) {
                var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                surface.call(vertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                dispatch.drawn({full: false});
            }
        });

        context.on('enter.map', function() {
            if (map.editable() && !transformed) {
                var all = context.intersects(map.extent()),
                    filter = d3.functor(true),
                    graph = context.graph();

                all = context.features().filter(all, graph);
                surface.call(vertices, graph, all, filter, map.extent(), map.zoom());
                surface.call(midpoints, graph, all, filter, map.trimmedExtent());
                dispatch.drawn({full: false});
            }
        });

        map.dimensions(selection.dimensions());

        labels.supersurface(supersurface);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

    function drawVector(difference, extent) {
        var graph = context.graph(),
            features = context.features(),
            all = context.intersects(map.extent()),
            data, filter,
            //TODO: Document why this was added for Hoot
            hidden=context.connection().hiddenLayers();

        if (difference) {
            var complete = difference.complete(map.extent());
            data = _.compact(_.values(complete));
            filter = function(d) { return d.id in complete; };
            features.clear(data);

        } else {
            // force a full redraw if gatherStats detects that a feature
            // should be auto-hidden (e.g. points or buildings)..
            if (features.gatherStats(all, graph, dimensions)) {
                extent = undefined;
            }

            if (extent) {
                data = context.intersects(map.extent().intersection(extent));
                var set = d3.set(_.pluck(data, 'id'));
                filter = function(d) { return set.has(d.id); };

            } else {
                //TODO: Document why this was added for Hoot
                all=_.filter(all, function(a) { return !_.contains(hidden, a.mapId); });
                data = all;
                filter = d3.functor(true);
            }
        }

        //Disable autoHidden feature filtering when in review mode
        if (!(context.hoot().control.conflicts && context.hoot().control.conflicts.reviewIds))
            data = features.filter(data, graph);

        d3.selectAll('.vertex').remove();
        //d3.selectAll('.shadow').remove();

        surface
            .call(vertices, graph, data, filter, map.extent(), map.zoom())
            .call(lines, graph, data, filter)
            .call(areas, graph, data, filter)
            .call(midpoints, graph, data, filter, map.trimmedExtent())
            //TODO: determine why Hoot has disabled this behavior
            //.call(labels, graph, data, filter, dimensions, !difference && !extent)
            .call(points, data, filter);

        //TODO: Document why this was added for Hoot
        var lastLoadedLayer = context.connection().lastLoadedLayer();
        if(lastLoadedLayer){
            var modifiedId = lastLoadedLayer.toString();
            d3.selectAll('.tag-hoot-'+modifiedId).each(function(){d3.select(this).moveToFront();});
        }


        dispatch.drawn({full: true});
        //TODO: Document why this was added for Hoot
        dispatch.drawVector();
    }

    function editOff() {
        context.features().resetStats();
        surface.selectAll('.layer *').remove();
        dispatch.drawn({full: true});
        //TODO: Document why this was added for Hoot
        dispatch.drawVector();
    }

    function dblClick() {
        if (!dblclickEnabled) {
            d3.event.preventDefault();
            d3.event.stopImmediatePropagation();
        }
    }

    function zoomPan() {
    	//Added for measure layer
        if(context.mode().id=='measure-add-line' || context.mode().id=='measure-add-area' || context.mode().id=='clip-bounding-box'){return;}
        else{d3.select('.measure-layer').selectAll('g').remove();}

    	if (Math.log(d3.event.scale) / Math.LN2 - 8 < minzoom + 1) {
            surface.interrupt();
            iD.ui.flash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            setZoom(context.minEditableZoom(), true);
            queueRedraw();
            dispatch.move(map);
            return;
        }

        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale / (2 * Math.PI));

        var scale = d3.event.scale / transformStart[0],
            tX = Math.round((d3.event.translate[0] / scale - transformStart[1][0]) * scale),
            tY = Math.round((d3.event.translate[1] / scale - transformStart[1][1]) * scale);

        transformed = true;
        iD.util.setTransform(supersurface, tX, tY, scale);
        queueRedraw();

        dispatch.move(map);
    }

    function resetTransform() {
        if (!transformed) return false;
        iD.util.setTransform(supersurface, 0, 0);
        transformed = false;
        return true;
    }

    function redraw(difference, extent, waitOnLoad) {
    	loadVectorOnTilesLoad = waitOnLoad;

        if (!surface) return;

        clearTimeout(timeoutId);

        //Added for measure layer
        d3.select('.measure-layer').selectAll('g').remove();

        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform()) {
            difference = extent = undefined;
        }

        var zoom = String(~~map.zoom());
        if (surface.attr('data-zoom') !== zoom) {
            surface.attr('data-zoom', zoom)
                .classed('low-zoom', zoom <= 16);
        }

        if (!difference) {
            supersurface.call(context.background());
        }

        //TODO: Document why this was modified for Hoot
        // The reason for implementing loadVectorOnTilesLoad is following
        // 1. User swaps layer
        // 2. Tile loads but since tile loading takes long time before all entities loaded vector
        //    tries to be rendered. But all entities are still being reloaded causing no entity found error.
        // Since loadVectorOnTilesLoad get set to true only when redraw is called from history
        // Also reason for keeping the code for rendering drawvector is that if we wait for loadtiles to finish
        // the drawing line and rendering vectors gets really slow.
        // So may be we need to loadtiles only when data gets loaded not during panning and zooming
        if (map.editable() && map.zoom()<=visibleZoom) {
            context.connection().tileZoom(2);

            context.connection().loadTiles(projection, dimensions,  function(){
                if(loadVectorOnTilesLoad === true){
                    if (context.hoot().control.conflicts && context.hoot().control.conflicts.reviewIds) {
                        drawVector(difference, extent);
                    } else {
                        map.drawVectorFar(difference, extent);
                    }
                    loadVectorOnTilesLoad = false;
                }
                //
            });
            if(!loadVectorOnTilesLoad){
                if (context.hoot().control.conflicts && context.hoot().control.conflicts.reviewIds) {
                    drawVector(difference, extent);
                } else {
                    map.drawVectorFar(difference, extent);
                }
            }

            //TODO: determine why Hoot has disabled this behavior
            //drawVector(difference, extent);
        } else if (map.editable()) {
            context.connection().tileZoom(16);
            context.connection().loadTiles(projection, dimensions,  function(){
                if(loadVectorOnTilesLoad === true){
                    drawVector(difference, extent);
                    loadVectorOnTilesLoad = false;
                }

            });
            if(!loadVectorOnTilesLoad){
                drawVector(difference, extent);
            }


        } else {
            //TODO: Document why this was added for Hoot
            if(map.zoom() >= visibleZoom){
                context.connection().loadTiles(projection, dimensions);
            }
            editOff();
        }


        transformStart = [
            projection.scale() * 2 * Math.PI,
            projection.translate().slice()];

        return map;
    }

    var timeoutId;
    function queueRedraw() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() { redraw(); }, 300);
    }

    function pointLocation(p) {
        var translate = projection.translate(),
            scale = projection.scale() * 2 * Math.PI;
        return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
    }

    function locationPoint(l) {
        var translate = projection.translate(),
            scale = projection.scale() * 2 * Math.PI;
        return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
    }

    map.mouse = function() {
        var e = mousemove || d3.event, s;
        while ((s = e.sourceEvent)) e = s;
        return mouse(e);
    };

    map.mouseCoordinates = function() {
        return projection.invert(map.mouse());
    };

    map.dblclickEnable = function(_) {
        if (!arguments.length) return dblclickEnabled;
        dblclickEnabled = _;
        return map;
    };

    function interpolateZoom(_) {
        var k = projection.scale(),
            t = projection.translate();

        surface.node().__chart__ = {
            x: t[0],
            y: t[1],
            k: k * 2 * Math.PI
        };

        setZoom(_);
        projection.scale(k).translate(t);  // undo setZoom projection changes

        zoom.event(surface.transition());
    }

    function setZoom(_, force) {
        if (_ === map.zoom() && !force)
            return false;
        var scale = 256 * Math.pow(2, _),
            center = pxCenter(),
            l = pointLocation(center);
        scale = Math.max(1024, Math.min(256 * Math.pow(2, 24), scale));
        projection.scale(scale / (2 * Math.PI));
        zoom.scale(scale);
        var t = projection.translate();
        l = locationPoint(l);
        t[0] += center[0] - l[0];
        t[1] += center[1] - l[1];
        projection.translate(t);
        zoom.translate(projection.translate());
        return true;
    }

    function setCenter(_) {
        var c = map.center();
        if (_[0] === c[0] && _[1] === c[1])
            return false;
        var t = projection.translate(),
            pxC = pxCenter(),
            ll = projection(_);
        projection.translate([
            t[0] - ll[0] + pxC[0],
            t[1] - ll[1] + pxC[1]]);
        zoom.translate(projection.translate());
        return true;
    }

    map.pan = function(d) {
        if(!d3.select('#jobsBG').classed('hidden')){return;}
    	var t = projection.translate();
        t[0] += d[0];
        t[1] += d[1];
        projection.translate(t);
        zoom.translate(projection.translate());
        dispatch.move(map);
        return redraw();
    };

    map.dimensions = function(_) {
        if (!arguments.length) return dimensions;
        var center = map.center();
        dimensions = _;
        surface.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = iD.util.fastMouse(supersurface.node());
        setCenter(center);
        return redraw();
    };

    map.zoomIn = function() { interpolateZoom(~~map.zoom() + 1); };
    map.zoomOut = function() { interpolateZoom(~~map.zoom() - 1); };

    map.center = function(loc) {
        if (!arguments.length) {
            return projection.invert(pxCenter());
        }

        if (setCenter(loc)) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.zoom = function(z) {
    	if (!arguments.length) {
            //TODO: Document why this was modified for Hoot
            var zoomVal = Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.LN2 - 8, 0);

            if(document.getElementById('sidebar2')){
                /*if(zoomVal < hootMaxImportZoom){
                    var nodes = document.getElementById('sidebar2').getElementsByTagName('*');
                    for(var i = 0; i < nodes.length; i++)
                    {
                         nodes[i].disabled = true;
                         nodes[i].style.opacity=0.5;
        }

                    nodes = document.getElementById('sidebar2').getElementsByClassName('button');
                    for(var i = 0; i < nodes.length; i++)
                    {
                        nodes[i].disabled = true;
                            nodes[i].style.opacity=0.5;
                    }
                    dispatch.maxImportZoomChanged();
                }
                else*/{
                    var nodes = document.getElementById('sidebar2').getElementsByTagName('*');
                    for(var i = 0; i < nodes.length; i++)
                    {
                         nodes[i].disabled = false;
                         nodes[i].style.opacity=1.0;
                    }
                    nodes = document.getElementById('sidebar2').getElementsByClassName('button');
                    for(var i = 0; i < nodes.length; i++)
                    {
                        nodes[i].disabled = false;
                        nodes[i].style.opacity=1.0;
                    }
                }
            }



            return zoomVal;
        }

        if (z < minzoom) {
            surface.interrupt();
            iD.ui.flash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            z = context.minEditableZoom();
        }

        if (setZoom(z)) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.zoomTo = function(entity, zoomLimits) {
        var extent = entity.extent(context.graph());
        if (!isFinite(extent.area())) return;

        var zoom = map.trimmedExtentZoom(extent);
        zoomLimits = zoomLimits || [context.minEditableZoom(), 20];
        map.centerZoom(extent.center(), Math.min(Math.max(zoom, zoomLimits[0]), zoomLimits[1]));
    };
    //TODO: Document why this was added for Hoot
    map.getZoomLevel = function(minlon, minlat, maxlon, maxlat) {
        var lowerLeftExtent = iD.geo.Extent([minlon, minlat]);
        var upperRightExtent = iD.geo.Extent([maxlon, maxlat]);
        var extent = lowerLeftExtent.extend(upperRightExtent);

        return map.extentZoom(extent);
    };

    //TODO: Document why this was added for Hoot
    map.zoomToExtent = function(minlon, minlat, maxlon, maxlat, zoomLimits) {
        var lowerLeftExtent = iD.geo.Extent([minlon, minlat]);
        var upperRightExtent = iD.geo.Extent([maxlon, maxlat]);
        var extent = lowerLeftExtent.extend(upperRightExtent);

        var curZoom = map.getZoomLevel(minlon, minlat, maxlon, maxlat, zoomLimits);
        zoomLimits = zoomLimits || [6, 20];
        map.centerZoom(extent.center(), Math.min(Math.max(curZoom, zoomLimits[0]), zoomLimits[1]));
    };

    map.centerZoom = function(loc, z) {
        var centered = setCenter(loc),
            zoomed   = setZoom(z);

        if (centered || zoomed) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.centerEase = function(loc) {
        var from = map.center().slice(),
            t = 0,
            stop;

        surface.one('mousedown.ease', function() {
            stop = true;
        });

        d3.timer(function() {
            if (stop) return true;
            map.center(iD.geo.interp(from, loc, (t += 1) / 10));
            return t === 10;
        }, 20);
        return map;
    };

    map.extent = function(_) {
        if (!arguments.length) {
            return new iD.geo.Extent(projection.invert([0, dimensions[1]]),
                                 projection.invert([dimensions[0], 0]));
        } else {
            var extent = iD.geo.Extent(_);
            map.centerZoom(extent.center(), map.extentZoom(extent));
        }
    };

    map.trimmedExtent = function() {
        var headerY = 60, footerY = 30, pad = 10;
        return new iD.geo.Extent(projection.invert([pad, dimensions[1] - footerY - pad]),
                projection.invert([dimensions[0] - pad, headerY + pad]));
    };

    function calcZoom(extent, dim) {
        var tl = projection([extent[0][0], extent[1][1]]),
            br = projection([extent[1][0], extent[0][1]]);

        // Calculate maximum zoom that fits extent
        var hFactor = (br[0] - tl[0]) / dim[0],
            vFactor = (br[1] - tl[1]) / dim[1],
            hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
            vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
            newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

        return newZoom;
    }

    map.extentZoom = function(_) {
        return calcZoom(iD.geo.Extent(_), dimensions);
    };

    map.trimmedExtentZoom = function(_) {
        var trimY = 120, trimX = 40,
            trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
        return calcZoom(iD.geo.Extent(_), trimmed);
    };

    //TODO: Document why this was modified for Hoot
    map.editable = function(_) {
        if(!_){
            return map.zoom() >= editableZoom;

        }
        editableZoom = _;
        return map.zoom() >= editableZoom;
    };



    map.minzoom = function(_) {
        if (!arguments.length) return minzoom;
        minzoom = _;
        return map;
    };

    //TODO: Document why this was added for Hoot
    map.updateBackground = function(){
        dispatch.updateBackgroundList();
    };

    //TODO: Document why this was added for Hoot
    map.drawVectorFar = function(difference, extent) {
        var graph = context.graph(),
            features = context.features(),
            all = context.intersects(map.extent()),
            data, filter, hidden=context.connection().hiddenLayers();

        if (difference) {
            var complete = difference.complete(map.extent());
            data = _.compact(_.values(complete));
            filter = function(d) { return d.id in complete; };
            features.clear(data);

        } else {
            // force a full redraw if gatherStats detects that a feature
            // should be auto-hidden (e.g. points or buildings)..
            if (features.gatherStats(all, graph, dimensions)) {
                extent = undefined;
            }

            if (extent) {
                data = context.intersects(map.extent().intersection(extent));
                var set = d3.set(_.pluck(data, 'id'));
                filter = function(d) { return set.has(d.id); };

            } else {
                all=_.filter(all, function(a) { return !_.contains(hidden, a.mapId); });
                data = all;
                filter = d3.functor(true);
            }
        }

        data = features.filter(data, graph);

        d3.selectAll('.vertex').remove();
        //d3.selectAll('.shadow').remove();

        var farLine = iD.svg.FarLine(projection);
        var farArea = iD.svg.FarArea(projection);

        surface
        .call(farLine, graph, data, filter)
        .call(farArea, graph, data, filter)
        .call(points, data, filter);

        var lastLoadedLayer = context.connection().lastLoadedLayer();
        if(lastLoadedLayer){
          var modifiedId = lastLoadedLayer.toString();
            d3.selectAll('.tag-hoot-'+modifiedId).each(function(){d3.select(this).moveToFront();});
        }


        if (typeof context.hoot === 'function') {
            if(!context.hoot().model.conflicts.reviews){
                dispatch.drawVector();
                return;
            }

            var mapid = context.hoot().model.layers.getmapIdByName(context.connection().lastLoadedLayer());
            var reviews = context.hoot().model.conflicts.reviews.reviewableItems;
            var conflicts = _.map(reviews,function(d){return d.type.charAt(0)+d.id+'_'+ mapid;});
            _.each(conflicts,function(d){d3.select('.'+d).classed('activeReviewFeature', true).moveToFront();});
        }

        dispatch.drawn({full: true});
        dispatch.drawVector();

    };
    return d3.rebind(map, dispatch, 'on');
};
