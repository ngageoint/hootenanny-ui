iD.ui.dgCarousel = function(context) {
    var key = '⌘I';

    function dgcarousel(selection) {
        var shown = false;

        function hide() {
            setVisible(false);
        }

        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;
                if (show) {
                    selection.on('mousedown.carousel-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    pane.style('display', 'block')
                        .style('right', '-200px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                    getImageMetadata();
                } else {
                    pane.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-200px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.carousel-inside', null);
                }
            }
        }

        var pane = selection.append('div').attr('class', 'fillL map-overlay carousel-column content hide');

        pane.append('div')
            .attr('class', 'dgarrow up')
            .on('click', function() {
                var scrollable = d3.select('#dgCarouselThumbnails');
                var clientheight = scrollable.property('clientHeight');
                var scrolltop = scrollable.property('scrollTop');
                scrollable.transition().duration(1500)
                    .tween('uniquetweenname', scrollTopTween(scrolltop - clientheight));
            });

        var metadiv = pane.append('div')
            .attr('id', 'dgCarouselThumbnails')
            .attr('class', 'carousel-thumbnails');

        pane.append('div')
            .attr('class', 'dgarrow down')
            .on('click', function() {
                var scrollable = d3.select('#dgCarouselThumbnails');
                var clientheight = scrollable.property('clientHeight');
                var scrolltop = scrollable.property('scrollTop');
                scrollable.transition().duration(1500)
                    .tween('uniquetweenname', scrollTopTween(scrolltop + clientheight));
            });

        function scrollTopTween(scrollTop) {
            return function() {
                var i = d3.interpolateNumber(this.scrollTop, scrollTop);
                return function(t) { this.scrollTop = i(t); };
            };
        }

//        function mouseWheelScroll() {
//            window.console.log(d3.event);
//            var delta = Math.max(-1, Math.min(1, (d3.event.wheelDelta || -d3.event.detail)));
//            window.console.log(delta);
//            var scrollable = d3.select('#dgCarouselThumbnails');
//            var clientheight = scrollable.property('clientHeight');
//            var scrolltop = scrollable.property('scrollTop');
//            scrollable.transition().duration(1500)
//                .tween('uniquetweenname', scrollTopTween(scrolltop + ( delta * clientheight)));
//
//        }

        var ul = metadiv.append('ul')
            .attr('class', 'carousel-metadata-list')
            //.on('mousewheel.scroll', mouseWheelScroll)
            //.on('DOMMouseScroll.scroll', _.debounce(mouseWheelScroll, 1000)) // older versions of Firefox
            //.on('wheel.scroll', mouseWheelScroll) // newer versions of Firefox            ;
            ;

        var tooltip = bootstrap.tooltip()
            .placement('left')
            .html(true)
            .title(iD.ui.tooltipHtml(t('dgcarousel.title'), key));

        var button = selection.append('button')
            .attr('tabindex', -1)
            .on('click', toggle)
            .call(iD.svg.Icon('#icon-carousel', 'light'))
            .call(tooltip);

        button.append('span')
            .attr('class', 'icon dgcarousel light');

        context.map()
        .on('move.carousel-update', _.debounce(getImageMetadata, 1000));

        context.background()
        .on('baseLayerChange.carousel-update', _.debounce(getImageMetadata, 1000));

        var keybinding = d3.keybinding('dgcarousel')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);

        //context.surface().on('mousedown.carousel-outside', hide);
        context.container().on('mousedown.carousel-outside', hide);

        function getImageMetadata() {
            //get zoom
            if (context.map().zoom() > 13) {
                //get extent
                var extent = context.map().extent();
                var size = context.map().dimensions();
                if (extent && size) {
                    //get features from wfs
                    var dg = context.dgservices();
                    var activeService = (d3.select('#dgServiceSwitch').property('checked')) ? 'EGD' : 'GBM';
                    var activeProfile = d3.select('#dgProfiles').selectAll('li.active').attr('value');
                    dg.wfs.getFeatureInRaster(activeService, null/*connectId*/, activeProfile/*profile*/, extent, size, function(error, data) {
                        if (error) {
                            window.console.warn(error);
                        } else {
                            //Update dgservices variables tracking visible image metadata
                            //The first feature in the response is the top (visible) image
                            //in the stacking profile.  Record this metadata.
                            dg.imagemeta.add('DigitalGlobe ' + activeService + ' - ' + dg.getProfile(activeProfile),
                                data.features);
                        }
                    });
                    dg.wfs.getFeature(activeService, null/*connectId*/, activeProfile/*profile*/, extent, size, function(error, data) {
                        if (error) {
                            window.console.warn(error);
                        } else {
                            //window.console.log(data.totalFeatures);
                            //display available images in carousel

                            //remove image thumbnails already selected
                            var activeData = ul.selectAll('li.active').data();
                            var availableData = data.features.filter(function(d) {
                                return !(activeData.some(function(s) {
                                    return d.id === s.id;
                                }));
                            });

                            var images = ul.selectAll('li:not(.active)')
                                .data(availableData);

                            images.enter().append('li');

                            images.classed('carousel-zoom-warn', false)
                                .html(function(d) {
                                    return formatImageMetadata(d);
                                })
//An issue with overflow hidden is keeping this from being useful
//                                .call(bootstrap.tooltip()
//                                    .title(t('dgcarousel.thumbnail_tooltip'))
//                                    .placement('top')
//                                )
                                .on('click', function(d) {
                                    var active = !d3.select(this).classed('active');
                                    d3.select(this).classed('active', active);
                                    loadImage(d, active);
                                })
                                .on('dblclick', function(d) {
                                    loadMetadataPopup(d);
                                })
                                .on('mouseenter', function(d) {
                                    loadFootprint(d);
                                })
                                .on('mouseleave', function(d) {
                                    loadFootprint(d);
                                });

                            images.exit().remove();

                        }
                    });
                }

            } else {
                var images = ul.selectAll('li:not(.active)')
                .data([{message: t('dgcarousel.zoom_warning')}]);

                images.enter().append('li');

                images.classed('carousel-zoom-warn', true)
                .html(function(d) {
                    return formatZoomWarning(d);
                });

                images.exit().remove();
            }
        }

        function formatImageMetadata(d) {
            var imageDiv = '';

            imageDiv += '<div>' + d.properties.formattedDate + '</div>';
            imageDiv += '<span>' + d.properties.source + '</span>';
            imageDiv += '<span class=\'' + ((d.properties.colorBandOrder === 'RGB') ? 'dgicon rgb' : 'dgicon pan') + '\'></span>';

            return imageDiv;
        }

        function formatZoomWarning(d) {
            var imageDiv = '';

            imageDiv += '<div class=\'carousel-zoom-warn\'>' + d.message + '</div>';

            return imageDiv;
        }

        function loadImage(d, active) {
            var dg = context.dgservices();
            var activeService = (d3.select('#dgServiceSwitch').property('checked')) ? 'EGD' : 'GBM';
            var activeProfile = d3.select('#dgProfiles').selectAll('li.active').attr('value');
            var template = dg.wms.getMap(activeService, null/*connectId*/, activeProfile/*profile*/, d.properties.featureId);
            var terms = dg.terms(dg.service);
            var source = {
                    'name': d.properties.formattedDate + ', ' + d.properties.source,
                    'type': 'wms',
                    'description': d.properties.productType,
                    'template': template,
                    'scaleExtent': [
                        0,
                        20
                    ],
                    'polygon': [
                        [
                            [
                                -180,
                                -90
                            ],
                            [
                                -180,
                                90
                            ],
                            [
                                180,
                                90
                            ],
                            [
                                180,
                                -90
                            ],
                            [
                                -180,
                                -90
                            ]
                        ]
                    ],
                    'terms_url': terms,
                    'terms_text': d.properties.copyright,
                    'id': 'DigitalGlobe ' + activeService + ' - ' + d.properties.featureId,
                    'overlay': true
                };

            if (active) {
                context.background().addSource(source);
                //Add image to dg.imagemeta
                dg.imagemeta.add(source.id, [d]);
            } else {
                context.background().removeSource(source);
                //Remove image from dg.imagemeta
                dg.imagemeta.remove(source.id);
            }

        }

        function loadMetadataPopup(data) {
            if (d3.event) d3.event.preventDefault();
            popup.classed('hide', false);
            var metarows = metatable.selectAll('tr')
                .data(d3.entries(data.properties));
            metarows.enter()
                .append('tr')
                .attr('class', 'carousel-metadata-table');
            metarows.exit().remove();

            var metacells = metarows.selectAll('td')
                .data(function(d) { return d3.values(d); });

            metacells.enter()
                .append('td');

            metacells.attr('class', 'carousel-metadata-table')
                .text(function(d) { return d; });

            metacells.exit().remove();
        }

        function loadFootprint(d) {
            if (d3.event) d3.event.preventDefault();
            if (d3.event.type === 'mouseover' || d3.event.type === 'mouseenter') {
                context.background().updateFootprintLayer(d.geometry);
            } else {
                context.background().updateFootprintLayer({});
            }
        }

        var popup = d3.select('#content').append('div')
            .attr('class', 'carousel-popup hide');
        var metaheader = popup.append('div');
        metaheader.append('span')
            .append('label')
            .text(t('dgcarousel.popup_title'))
            .attr('class', 'carousel-popup');
        metaheader.append('span')
            .attr('class', 'carousel-close')
            .append('button')
            .attr('class', 'icon close dark')
            .on('click', function() {
                popup.classed('hide', true);
            })
            .on('mousedown', function() {
                if (d3.event) d3.event.preventDefault();
                if (d3.event) d3.event.stopPropagation();
            });

        var metatable = popup.append('div')
            .attr('class', 'carousel-metadata')
            .append('table')
            .attr('class', 'carousel-metadata-table');

    }

    return dgcarousel;
};
