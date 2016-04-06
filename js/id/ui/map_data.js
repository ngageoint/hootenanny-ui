iD.ui.MapData = function(context) {
    var key = 'F',
        features = context.features().keys(),
        layers = context.layers(),
        fills = ['wireframe', 'partial', 'full'],
        fillDefault = context.storage('area-fill') || 'partial',
        fillSelected = fillDefault;


    function map_data(selection) {

        function showsFeature(d) {
            return context.features().enabled(d);
        }

        function autoHiddenFeature(d) {
            return context.features().autoHidden(d);
        }

        function clickFeature(d) {
            context.features().toggle(d);
            update();
        }

        function showsFill(d) {
            return fillSelected === d;
        }

        function setFill(d) {
            _.each(fills, function(opt) {
                context.surface().classed('fill-' + opt, Boolean(opt === d));
            });

            fillSelected = d;
            if (d !== 'wireframe') {
                fillDefault = d;
                context.storage('area-fill', d);
            }
            update();
        }

        function toggleLayer(which) {
            var layer = layers.layer(which);
            if (layer) {
                layer.enabled(!layer.enabled());
                update();
            }
        }

        function clickGpx() {
            toggleLayer('gpx');
        }

        function clickMapillaryImages() {
            toggleLayer('mapillary-images');
        }

        function clickMapillarySigns() {
            toggleLayer('mapillary-signs');
        }


        function drawMapillaryItems(selection) {
            var mapillaryImages = layers.layer('mapillary-images'),
                mapillarySigns = layers.layer('mapillary-signs'),
                supportsMapillaryImages = mapillaryImages && mapillaryImages.supported(),
                supportsMapillarySigns = mapillarySigns && mapillarySigns.supported(),
                showsMapillaryImages = supportsMapillaryImages && mapillaryImages.enabled(),
                showsMapillarySigns = supportsMapillarySigns && mapillarySigns.enabled();

            var mapillaryList = selection
                .selectAll('.layer-list-mapillary')
                .data([0]);

            // Enter
            mapillaryList
                .enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-mapillary');

            var mapillaryImageLayerItem = mapillaryList
                .selectAll('.list-item-mapillary-images')
                .data(supportsMapillaryImages ? [0] : []);

            var enterImages = mapillaryImageLayerItem.enter()
                .append('li')
                .attr('class', 'list-item-mapillary-images');

            var labelImages = enterImages.append('label')
                .call(bootstrap.tooltip()
                    .title(t('mapillary_images.tooltip'))
                    .placement('top'));

            labelImages.append('input')
                .attr('type', 'checkbox')
                .on('change', clickMapillaryImages);

            labelImages.append('span')
                .text(t('mapillary_images.title'));


            var mapillarySignLayerItem = mapillaryList
                .selectAll('.list-item-mapillary-signs')
                .data(supportsMapillarySigns ? [0] : []);

            var enterSigns = mapillarySignLayerItem.enter()
                .append('li')
                .attr('class', 'list-item-mapillary-signs');

            var labelSigns = enterSigns.append('label')
                .call(bootstrap.tooltip()
                    .title(t('mapillary_signs.tooltip'))
                    .placement('top'));

            labelSigns.append('input')
                .attr('type', 'checkbox')
                .on('change', clickMapillarySigns);

            labelSigns.append('span')
                .text(t('mapillary_signs.title'));

            // Update
            mapillaryImageLayerItem
                .classed('active', showsMapillaryImages)
                .selectAll('input')
                .property('checked', showsMapillaryImages);

            mapillarySignLayerItem
                .classed('active', showsMapillarySigns)
                .selectAll('input')
                .property('checked', showsMapillarySigns);

            // Exit
            mapillaryImageLayerItem.exit()
                .remove();
            mapillarySignLayerItem.exit()
                .remove();
        }


        function drawGpxItem(selection) {
            var gpx = layers.layer('gpx'),
                hasGpx = gpx && gpx.hasGpx(),
                showsGpx = hasGpx && gpx.enabled();

            var gpxLayerItem = selection
                .selectAll('.layer-list-gpx')
                .data(gpx ? [0] : []);

            // Enter
            var enter = gpxLayerItem.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-gpx')
                .append('li')
                .classed('list-item-gpx', true);

            enter.append('button')
                .attr('class', 'list-item-gpx-extent')
                .call(bootstrap.tooltip()
                    .title(t('gpx.zoom'))
                    .placement('left'))
                .on('click', function() {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    gpx.fitZoom();
                })
                .call(iD.svg.Icon('#icon-search'));

            enter.append('button')
                .attr('class', 'list-item-gpx-browse')
                .call(bootstrap.tooltip()
                    .title(t('gpx.browse'))
                    .placement('left'))
                .on('click', function() {
                    d3.select(document.createElement('input'))
                        .attr('type', 'file')
                        .on('change', function() {
                            gpx.files(d3.event.target.files);
                        })
                        .node().click();
                })
                .call(iD.svg.Icon('#icon-geolocate'));

            var labelGpx = enter.append('label')
                .call(bootstrap.tooltip()
                    .title(t('gpx.drag_drop'))
                    .placement('top'));

            labelGpx.append('input')
                .attr('type', 'checkbox')
                .on('change', clickGpx);

            labelGpx.append('span')
                .text(t('gpx.local_layer'));

            // Update
            gpxLayerItem
                .classed('active', showsGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);

            // Exit
            gpxLayerItem.exit()
                .remove();
        }


        function drawList(selection, data, type, name, change, active) {
            var items = selection.selectAll('li')
                .data(data);

            // Enter
            var enter = items.enter()
                .append('li')
                .attr('class', 'layer')
                .call(bootstrap.tooltip()
                    .html(true)
                    .title(function(d) {
                        var tip = t(name + '.' + d + '.tooltip'),
                            key = (d === 'wireframe' ? 'W' : null);

                        if (name === 'feature' && autoHiddenFeature(d)) {
                            tip += '<div>' + t('map_data.autohidden') + '</div>';
                        }
                        return iD.ui.tooltipHtml(tip, key);
                    })
                    .placement('top')
                );

            var label = enter.append('label');

            label.append('input')
                .attr('type', type)
                .attr('name', name)
                .on('change', change);

            label.append('span')
                .text(function(d) { return t(name + '.' + d + '.description'); });

            // Update
            items
                .classed('active', active)
                .selectAll('input')
                .property('checked', active)
                .property('indeterminate', function(d) {
                    return (name === 'feature' && autoHiddenFeature(d));
                });

            // Exit
            items.exit()
                .remove();
        }


        function update() {
            dataLayerContainer.call(drawMapillaryItems);
            dataLayerContainer.call(drawGpxItem);

            fillList.call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);

            featureList.call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
        }

        function hidePanel() {
            setVisible(false);
        }

        function togglePanel() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function toggleWireframe() {
            if (d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
            setFill((fillSelected === 'wireframe' ? fillDefault : 'wireframe'));
            context.map().pan([0,0]);  // trigger a redraw
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    update();
                    selection.on('mousedown.map_data-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    content.style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    content.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.map_data-inside', null);
                }
            }
        }


        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('map_data.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', togglePanel)
                .call(iD.svg.Icon('#icon-data', 'light'))
                .call(tooltip),
            shown = false;

        content.append('h4')
            .text(t('map_data.title'));


        // data layers
        content.append('a')
            .text(t('map_data.data_layers'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                dataLayerContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var dataLayerContainer = content.append('div')
            .attr('class', 'data-data-layers')
            .style('display', 'block');


        // area fills
        content.append('a')
            .text(t('map_data.fill_area'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                fillContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var fillContainer = content.append('div')
            .attr('class', 'data-area-fills')
            .style('display', 'none');

        var fillList = fillContainer.append('ul')
            .attr('class', 'layer-list layer-fill-list');

        // line width
        content.append('a')
            .text(t('map_data.line_width'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                widthContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var widthContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'none');

       //var widthLabel = widthContainer.append('div').append('label').text('Path Width');

        widthContainer.append('input').attr('type','number')
            .classed('hoot-input settings-input',true)
            .attr('id','path-width').property('disabled',true)
            .attr('min',1).attr('max',25).attr('value',7)
            .on('change',function(){
                var lineWidth = d3.select('#path-width').value();
                if(lineWidth > -1 && lineWidth < 26) {lineWidth=lineWidth}
                else { lineWidth = lineWidth < 0 ? 0 : 25 }
                d3.select('#path-width').value(lineWidth);
                setLineWidth(true,lineWidth);
            });

        widthContainer.append('label').classed('settings-checkbox',true)
            .attr('for','path-width_default').text('Use default value')
            .append('input').attr('name','path-width_default')
            .attr('type','checkbox').attr('checked',true)
            .on('change',function(){
                d3.select('#' + this.name.replace('_default','')).property('disabled',this.checked);
                var lineWidth = d3.select('#path-width').value();
                if(lineWidth > -1 && lineWidth < 26) {lineWidth=lineWidth}
                else { lineWidth = lineWidth < 0 ? 0 : 25 }
                d3.select('#path-width').value(lineWidth);
                setLineWidth(!this.checked,lineWidth);
            });

        function setLineWidth(setWidth,width){
            var sheets = document.styleSheets[document.styleSheets.length - 1];
            var selectTxt = 'path.way.stroke';
            var reviewTxt = 'path.shadow.activeReviewFeature, path.shadow.activeReviewFeature2';

            _.find(sheets.cssRules, function(cssItem, cssIdx){if(cssItem.selectorText == selectTxt){ sheets.deleteRule(cssIdx);return true;};});
            _.find(sheets.cssRules, function(cssItem, cssIdx){if(cssItem.selectorText == reviewTxt){ sheets.deleteRule(cssIdx);return true;};});

            var reviewWidth = (parseInt(width)+10).toString();

            if(setWidth){sheets.insertRule(selectTxt + ' {stroke-width:' + width + ' !important}',sheets.cssRules.length-1);}
            if(setWidth){sheets.insertRule(reviewTxt + ' {stroke-width:' + reviewWidth + ' !important}',sheets.cssRules.length-1);}
        }

        // feature filters
        content.append('a')
            .text(t('map_data.map_features'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                featureContainer.style('display', exp ? 'none' : 'block');
                hEditedContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var featureContainer = content.append('div')
            .attr('class', 'data-feature-filters')
            .style('display', 'none');

        var featureList = featureContainer.append('ul')
            .attr('class', 'layer-list layer-feature-list');


        context.features()
            .on('change.map_data-update', update);

        var hEditedContainer = content.append('div')
            .attr('class', 'highlight-edited')
            .style('display', 'none');
        var hEditedItem = hEditedContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');
        var hEditedLabel = hEditedItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('highlight-edited.tooltip'))
                .placement('top'));
        hEditedLabel.append('input')
            .attr('type', 'checkbox')
            .on('click', function() {
                context.map().updateEditedHighlights();
            });
        hEditedLabel.append('span')
            .text(t('highlight-edited.title'));

        setFill(fillDefault);

        var keybinding = d3.keybinding('features')
            .on(key, togglePanel)
            .on('W', toggleWireframe)
            .on('B', hidePanel)
            .on('H', hidePanel);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.map_data-outside', hidePanel);
        context.container().on('mousedown.map_data-outside', hidePanel);
    }

    return map_data;
};
