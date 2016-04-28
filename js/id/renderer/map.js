iD.Map = function(context) {
    var dimensions = [1, 1],
        //Need to document why this was modified for Hoot
        dispatch = d3.dispatch('move', 'drawn', 'maxImportZoomChanged', 'drawVector', 'updateBackgroundList'),
        projection = context.projection,
        roundedProjection = iD.svg.RoundProjection(projection),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale() * 2 * Math.PI)
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        redrawEnabled = true,
        transformStart,
        transformed = false,
        minzoom = 0,
        //draw prefix added in iD v1.9.2
        drawLayers = iD.svg.Layers(projection, context),
        drawPoints = iD.svg.Points(roundedProjection, context),
        drawVertices = iD.svg.Vertices(roundedProjection, context),
        drawLines = iD.svg.Lines(projection, context),
        drawAreas = iD.svg.Areas(projection, context),
        drawMidpoints = iD.svg.Midpoints(roundedProjection, context),
        drawLabels = iD.svg.Labels(projection, context),
        supersurface,
        wrapper,
        surface,
        mouse,
        mousemove,
        //Need to document why this was added for Hoot
        editableZoom = 2,
        visibleZoom = 16,
        loadVectorOnTilesLoad = false;


    function map(selection) {
        context.history()
            .on('change.map', function() {
                redraw();
                map.updateEditedHighlights();
            });
        context.background()
            .on('change.map', redraw);
        context.features()
            .on('redraw.map', redraw);
        //Need to document why this was added for Hoot
        context.connection()
            .on('layer', redraw);

        //added in iD v1.9.2
        drawLayers
            .on('change.map', function() {
                context.background().updateImagery();
                redraw();
            });

        selection
            .on('dblclick.map', dblClick)
            .call(zoom);

        supersurface = selection.append('div')
            .attr('id', 'supersurface')
            //added in iD v1.9.2
            .call(iD.util.setTransform, 0, 0);

        // Need a wrapper div because Opera can't cope with an absolutely positioned
        // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
        //iD v1.9.2 wrapper replaced dataLayer var
        //For Hoot, kept layer-layer class as opposed to layer
        wrapper = supersurface
            .append('div')
            .attr('class', 'layer-layer layer-data');

        //changed in iD v1.9.2
        //map.surface = surface = dataLayer.append('svg')

       map.surface = surface = wrapper
            .call(drawLayers)
            .selectAll('.surface')
            .attr('id', 'surface');

        surface
            .on('mousedown.zoom', function() {
                if (d3.event.button === 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) redraw();
            })
            //changed in iD v1.9.2
            //.attr('id', 'surface')
            //.call(iD.svg.Surface(context));
            .on('mousemove.map', function() {
                mousemove = d3.event;
            })
            .on('mouseover.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.target.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.drawn({full: false});
                }
            })
            .on('mouseout.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.drawn({full: false});
                }
            });

        supersurface.call(context.background());

        //changed in iD v1.9.2
        /*surface.on('mousemove.map', function() {
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
        });*/

        context.on('enter.map', function() {
            if (map.editable() && !transformed) {
                var all = context.intersects(map.extent()),
                    filter = d3.functor(true),
                    graph = context.graph();

                all = context.features().filter(all, graph);
                surface
                    .call(drawVertices, graph, all, filter, map.extent(), map.zoom())
                    .call(drawMidpoints, graph, all, filter, map.trimmedExtent());
                dispatch.drawn({full: false});
            }
        });

        map.dimensions(selection.dimensions());

        drawLabels.supersurface(supersurface);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

    function drawVector(difference, extent) {
        var graph = context.graph(),
            features = context.features(),
            all = context.intersects(map.extent()),
            data, filter,
            //Need to document why this was added for Hoot
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
                //Need to document why this was added for Hoot
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
            .call(drawVertices, graph, data, filter, map.extent(), map.zoom())
            .call(drawLines, graph, data, filter)
            .call(drawAreas, graph, data, filter)
            .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
            //Need to determine why Hoot has disabled this behavior
            //.call(drawLabels, graph, data, filter, dimensions, !difference && !extent)
            .call(drawPoints, graph, data, filter);

        //Need to document why this was added for Hoot
        var lastLoadedLayer = context.connection().lastLoadedLayer();
        if(lastLoadedLayer){
            var modifiedId = lastLoadedLayer.toString();
            d3.selectAll('.tag-hoot-'+modifiedId).each(function(){d3.select(this).moveToFront();});
        }


        dispatch.drawn({full: true});
        //Need to document why this was added for Hoot
        dispatch.drawVector();
    }

    function editOff() {
        context.features().resetStats();
        // changed to .layer-osm in iD v1.9.2
        surface.selectAll('.layer-osm *').remove();
        dispatch.drawn({full: true});
        //Need to document why this was added for Hoot
        dispatch.drawVector();
    }

    function dblClick() {
        if (!dblclickEnabled) {
            d3.event.preventDefault();
            d3.event.stopImmediatePropagation();
        }
    }

    function zoomPan() {
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

        //Added in iD v1.9.2
        surface.selectAll('.radial-menu').interrupt().remove();
        iD.util.setTransform(supersurface, 0, 0);
        transformed = false;
        return true;
    }

    function redraw(difference, extent, waitOnLoad) {
        loadVectorOnTilesLoad = waitOnLoad;

        if (!surface) return;

        clearTimeout(timeoutId);

        //Added for measure layer
        //Update measurement lines
        var measureLines = d3.selectAll('[class*=measure-line-]');
        if(!measureLines.empty()){
            _.each(measureLines[0],function(b){
                var line = d3.select(b);
                var loc1 = line.attr('loc1').split(/,/).map(parseFloat);
                var c1 = context.projection(loc1);
                line.attr('x1',c1[0].toString()).attr('y1',c1[1].toString());
                var loc2 = line.attr('loc2').split(/,/).map(parseFloat);
                var c2 = context.projection(loc2);
                line.attr('x2',c2[0].toString()).attr('y2',c2[1].toString());
            });
        }

        var measureArea = d3.selectAll('.measure-area');
        if(!measureArea.empty()){
            _.each(measureArea[0],function(a){
                var measArea = d3.select(a);
                var newpts = '';
                var pts = measArea.attr('loc').trim().split(/ /);
                var ptsLength = measureArea.classed('measure-complete') ? pts.length : pts.length - 1;
                for(var p = 0; p < ptsLength; p++){
                    var newpt = pts[p].split(/,/).map(parseFloat);
                    var c = context.projection(newpt);
                    newpts = newpts + ' ' + c.toString();
                }
                measureArea.attr('points',newpts);
                measureArea.classed('updated',true);
            });
        }

        var measureLabel = d3.select('.measure-layer').select('text');
        if(!measureLabel.empty()){
            var labelmargin = !measureLines.empty() ? 10 : 30;
            var rectmargin = !measureLines.empty() ? 0 : 10;

            measureLabel = d3.select('.measure-layer').select('text');
            if(!measureLabel.empty()){
                var loc = d3.select(measureLabel[0][0]).attr('loc').split(/,/).map(parseFloat);
                var c = context.projection(loc);
                d3.select(measureLabel[0][0]).attr('x',c[0]+labelmargin).attr('y',c[1]+labelmargin);

                var tspans = measureLabel.selectAll('tspan');
                if(!tspans.empty()){
                    var diff = 0;
                    _.each(tspans[0],function(t){
                        d3.select(t).attr('x',c[0]+10).attr('y',c[1]+diff);
                        diff+=25;
                    });
                }
            }

            loc = d3.select(measureLabel[0][0]).attr('loc').split(/,/).map(parseFloat);
            c = context.projection(loc);
            d3.select(measureLabel[0][0]).attr('x', c[0]+rectmargin).attr('y',c[1]-(measureLabel.dimensions()[1]/2));
        }

        //Added for goto feature bubbles
        var gotoBubbles = d3.selectAll('.gotoreview');
        if(!gotoBubbles.empty())        {
            _.each(gotoBubbles[0],function(b){
                var offsetDiff = d3.select(b).classed('_way') ? 0 : 50;
                var loc = d3.select(b).attr('loc').split(/,/).map(parseFloat);
                var c = context.projection(loc);
                var transform = 'translate('.concat(c[0],',',c[1]-offsetDiff,')');
                d3.select(b).attr('transform',transform);
            });
        }

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

        //Need to document why this was modified for Hoot
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

            //Need to determine why Hoot has disabled this behavior
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
            //Need to document why this was added for Hoot
            if(map.zoom() >= visibleZoom){
                context.connection().loadTiles(projection, dimensions);
            }
            editOff();
        }

        // added in iD v1.9.2
        wrapper
            .call(drawLayers);

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

    //added in iD v1.9.2
    map.redrawEnable = function(_) {
        if (!arguments.length) return redrawEnabled;
        redrawEnabled = _;
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
        //drawLayers replaced surface in iD v1.9.2
        drawLayers.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = iD.util.fastMouse(supersurface.node());
        setCenter(center);
        return redraw();
    };

    function zoomIn(integer) {
      interpolateZoom(~~map.zoom() + integer);
    }

    function zoomOut(integer) {
      interpolateZoom(~~map.zoom() - integer);
    }

    map.zoomIn = function() { zoomIn(1); };
    map.zoomInFurther = function() { zoomIn(4); };

    map.zoomOut = function() { zoomOut(1); };
    map.zoomOutFurther = function() { zoomOut(4); };

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
            //Need to document why this was modified for Hoot
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
                else{*/
                    var nodes = document.getElementById('sidebar2').getElementsByTagName('*');
                    for(var i = 0; i < nodes.length; i++)
                    {
                         nodes[i].disabled = false;
                         nodes[i].style.opacity=1.0;
                    }
                    nodes = document.getElementById('sidebar2').getElementsByClassName('button');
                    for(i = 0; i < nodes.length; i++)
                    {
                        nodes[i].disabled = false;
                        nodes[i].style.opacity=1.0;
                    }
                // }
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
    //Need to document why this was added for Hoot
    map.getZoomLevel = function(minlon, minlat, maxlon, maxlat) {
        var lowerLeftExtent = iD.geo.Extent([minlon, minlat]);
        var upperRightExtent = iD.geo.Extent([maxlon, maxlat]);
        var extent = lowerLeftExtent.extend(upperRightExtent);

        return map.extentZoom(extent);
    };

    //Need to document why this was added for Hoot
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

    map.trimmedExtent = function(_) {
        if (!arguments.length) {
            var headerY = 60, footerY = 30, pad = 10;
            return new iD.geo.Extent(projection.invert([pad, dimensions[1] - footerY - pad]),
                    projection.invert([dimensions[0] - pad, headerY + pad]));
        } else {
            var extent = iD.geo.Extent(_);
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }
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

    //Need to document why this was modified for Hoot
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

    //Need to document why this was added for Hoot
    map.updateBackground = function(){
        dispatch.updateBackgroundList();
    };

    //Added in iD v1.9.2
    map.layers = drawLayers;

    //Need to document why this was added for Hoot
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

        var farLine = iD.svg.FarLine(projection, context);
        var farArea = iD.svg.FarArea(projection, context);

        surface
        .call(farLine, graph, data, filter, context)
        .call(farArea, graph, data, filter, context)
        .call(drawPoints, graph, data, filter, context);

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

    map.updateEditedHighlights = function() {
        //Clear any 'edited' class from features
        d3.selectAll('.edited').classed('edited unsaved', false);
        if (d3.select('div.highlight-edited input').node().checked) {
            //Add 'edited' class to edited but unsaved features
            context.history().difference().summary().map(function(d) {
                return d.entity.id;
            }).forEach(function(d) {
                d3.selectAll('.' + d).classed('edited unsaved', true);
            });
        }
    };

    map.updateSnapFeatures = function() {
        context.enableSnap = d3.select('div.enable-snap input').node().checked;
    };
    return d3.rebind(map, dispatch, 'on');
};
