iD.ui.Background = function(context) {
    var key = 'B',
        opacities = [1, 0.75, 0.5, 0.25],
        directions = [
            ['left', [1, 0]],
            ['top', [0, -1]],
            ['right', [-1, 0]],
            ['bottom', [0, 1]]],
        opacityDefault = (context.storage('background-opacity') !== null) ?
            (+context.storage('background-opacity')) : 0.5,
        customTemplate = '',
        //Added for EGD-plugin
        dgServices = context.dgservices();

    // Can be 0 from <1.3.0 use or due to issue #1923.
    if (opacityDefault === 0) opacityDefault = 0.5;

    function background(selection) {

        function setOpacity(d) {
            var bg = context.container().selectAll('.background-layer')
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);

            if (!iD.detect().opera) {
                iD.util.setTransform(bg, 0, 0);
            }

            opacityList.selectAll('li')
                .classed('active', function(_) { return _ === d; });

            context.storage('background-opacity', d);
        }

        function selectLayer() {
            function active(d) {
                return context.background().showsLayer(d);
            }

            //Modified for EGD-plugin
            content.selectAll('.layer, .custom_layer, .dg_layer')
                .classed('active', active)
                .selectAll('input')
                .property('checked', active);
        }

        //Added for EGD-plugin
        function selectProfile(value) {
            function active(d) {
                return d.value === value;
            }
            profiles.selectAll('li')
                .classed('active', active);
            //profiles.classed('hide', true);
        }

        //Added for EGD-plugin
        function selectCollection(value) {
            function active(d) {
                return d.value === value;
            }
            collections.selectAll('li')
                .classed('active', active);
            //collections.classed('hide', true);
        }

        function clickSetSource(d) {
            d3.event.preventDefault();
            context.background().baseLayerSource(d);
            selectLayer();
        }

        function editCustom() {
            d3.event.preventDefault();
            var template = window.prompt(t('background.custom_prompt'), customTemplate);
            if (!template ||
                template.indexOf('google.com') !== -1 ||
                template.indexOf('googleapis.com') !== -1 ||
                template.indexOf('google.ru') !== -1) {
                selectLayer();
                return;
            }
            setCustom(template);
        }

        function setCustom(template) {
            context.background().baseLayerSource(iD.BackgroundSource.Custom(template));
            selectLayer();
            context.storage('background-custom-template', template);
        }

        function clickSetOverlay(d) {
            d3.event.preventDefault();
            context.background().toggleOverlayLayer(d);
            selectLayer();
        }

        //Added for EGD-plugin
        function clickAddOrUpdateOverlay(d) {
            d3.event.preventDefault();
            context.background().addOrUpdateOverlayLayer(d);
            selectLayer();
        }


        function drawList(layerList, type, change, filter) {
            var sources = context.background()
                .sources(context.map().extent())
                .filter(filter);

            var layerLinks = layerList.selectAll('li.layer')
                .data(sources, function(d) { return d.name(); });

            var enter = layerLinks.enter()
                //Modified for EGD-plugin
                .insert('li', '.dg_layer')//insert li before element of class dg_layer
                .attr('class', 'layer');

            // only set tooltips for layers with tooltips
            enter.filter(function(d) { return d.description; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return d.description; })
                    .placement('top'));

            var label = enter.append('label');

            label.append('input')
                .attr('type', type)
                .attr('name', 'layers')
                .on('change', change);

            label.append('span')
                .text(function(d) { return d.name(); });

            layerLinks.exit()
                .remove();

            layerList.style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
        }

        function update() {
            backgroundList.call(drawList, 'radio', clickSetSource, function(d) { return !d.overlay; });
            overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) { return d.overlay; });

            selectLayer();

            var source = context.background().baseLayerSource();
            if (source.id === 'custom') {
                customTemplate = source.template;
            }
        }

        function clickNudge(d) {

            var timeout = window.setTimeout(function() {
                    interval = window.setInterval(nudge, 100);
                }, 500),
                interval;

            d3.select(this).on('mouseup', function() {
                window.clearInterval(interval);
                window.clearTimeout(timeout);
                nudge();
            });

            function nudge() {
                var offset = context.background()
                    .nudge(d[1], context.map().zoom())
                    .offset();
                resetButton.classed('disabled', offset[0] === 0 && offset[1] === 0);
            }
        }

        function hide() { setVisible(false); }

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
                    selection.on('mousedown.background-inside', function() {
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
                    selection.on('mousedown.background-inside', null);
                }
            }
        }


        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('background.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(tooltip),
            shown = false;

        button.append('span')
            .attr('class', 'icon layers light');


        var opa = content.append('div')
                .attr('class', 'opacity-options-wrapper');

        opa.append('h4')
            .text(t('background.title'));

        var opacityList = opa.append('ul')
            .attr('class', 'opacity-options');

        opacityList.selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
            .attr('data-original-title', function(d) {
                return t('background.percent_brightness', { opacity: (d * 100) });
            })
            .on('click.set-opacity', setOpacity)
            .html('<div class="select-box"></div>')
            .call(bootstrap.tooltip()
                .placement('left'))
            .append('div')
            .attr('class', 'opacity')
            .style('opacity', String);

        var backgroundList = content.append('ul')
            .attr('class', 'layer-list');

        //Added for EGD-plugin

        if (dgServices.enabled) {
            var dgbackground = backgroundList.append('li')
                .attr('class', 'dg_layer')
                .call(bootstrap.tooltip()
                    .title(t('background.dgbg_tooltip'))
                    .placement('top'))
                .datum(dgServices.backgroundSource());

            dgbackground.append('button')
                .attr('class', 'dg-layer-profile')
                .call(bootstrap.tooltip()
                    .title(t('background.dgbg_button'))
                    .placement('left'))
                .on('click', function () {
                    d3.event.preventDefault();
                    profiles.classed('hide', function() { return !profiles.classed('hide'); });
                })
                .append('span')
                .attr('class', 'icon layers dark');

            var label = dgbackground.append('label');

            label.append('input')
                .attr('type', 'radio')
                .attr('name', 'layers')
                .on('change', function(d) {
                    d3.event.preventDefault();
                    clickSetSource(iD.BackgroundSource(d));
                });

            label.append('span')
                .text(t('background.dgbg'));

            var profiles = content.append('div')
            .attr('id', 'dgProfiles')
            .attr('class', 'dgprofile hide'); //fillL map-overlay col3 content

            //from http://proto.io/freebies/onoff/
            var serviceSwitch = profiles.append('div')
                .attr('class', 'onoffswitch');
            serviceSwitch.append('input')
                .attr('type', 'checkbox')
                .attr('name', 'onoffswitch')
                .attr('class', 'onoffswitch-checkbox')
                .attr('id', 'dgServiceSwitch')
                .on('change', function() {
                    //profiles.classed('hide', function() { return !profiles.classed('hide'); });
                    //TODO update visible db layers when service changes
                });
            var serviceLabel = serviceSwitch.append('label')
                .attr('for', 'dgServiceSwitch')
                .attr('class', 'onoffswitch-label');
            serviceLabel.append('div')
                .attr('class', 'onoffswitch-inner');
            serviceLabel.append('div')
                .attr('class', 'onoffswitch-switch');

            var profileList = profiles.append('ul')
                .attr('class', 'layer-list');

            profileList.selectAll('li')
                .data(dgServices.profiles).enter()
                .append('li')
                .attr('class', function(d) {
                    return (dgServices.defaultProfile === d.value) ? 'dgprofile active' : 'dgprofile';
                })
                .text(function(d) { return d.text; })
                .attr('value', function(d) { return d.value; })
                .on('click', function(d) {
                    d3.event.preventDefault();
                    selectProfile(d.value);
                    var activeService = (serviceSwitch.selectAll('input').property('checked')) ? 'EGD' : 'GBM';
                    var bsource = dgServices.backgroundSource(activeService/*service*/, null/*connectId*/, d.value/*profile*/);
                    clickSetSource(iD.BackgroundSource(bsource));
                    //Update radio button datum for dgbackground
                    dgbackground.selectAll('input').datum(bsource);
                });
        }
        //END: Added for EGD-plugin

        var custom = backgroundList.append('li')
            .attr('class', 'custom_layer')
            .datum(iD.BackgroundSource.Custom());

        custom.append('button')
            .attr('class', 'layer-browse')
            .call(bootstrap.tooltip()
                .title(t('background.custom_button'))
                .placement('left'))
            .on('click', editCustom)
            .append('span')
            .attr('class', 'icon geocode');

        label = custom.append('label');

        label.append('input')
            .attr('type', 'radio')
            .attr('name', 'layers')
            .on('change', function () {
                if (customTemplate) {
                    setCustom(customTemplate);
                } else {
                    editCustom();
                }
            });

        label.append('span')
            .text(t('background.custom'));

        var overlayList = content.append('ul')
            .attr('class', 'layer-list');

        //Added for EGD-plugin

        if (dgServices.enabled) {
            var dgcollection = overlayList.append('li')
            .attr('class', 'dg_layer')
            .call(bootstrap.tooltip()
                .title(t('background.dgcl_tooltip'))
                .placement('top'))
            .datum(dgServices.collectionSource());

            dgcollection.append('button')
                .attr('class', 'dg-layer-profile')
                .call(bootstrap.tooltip()
                    .title(t('background.dgcl_button'))
                    .placement('left'))
                .on('click', function() {
                    d3.event.preventDefault();
                    collections.classed('hide', function() { return !collections.classed('hide'); });
                })
                .append('span')
                .attr('class', 'icon layers dark');

            label = dgcollection.append('label');

            label.append('input')
                .attr('type', 'checkbox')
                .attr('name', 'layers')
                .on('change', function() {
                    d3.event.preventDefault();
                    var activeService = (serviceSwitch.selectAll('input').property('checked')) ? 'EGD' : 'GBM';
                    clickSetOverlay(iD.BackgroundSource(dgServices.collectionSource(activeService)));
                });

            label.append('span')
                .text(t('background.dgcl'));

            var collections = content.append('div')
            .attr('class', 'dgprofile hide'); //fillL map-overlay col3 content

            var collectionList = collections.append('ul')
                .attr('class', 'layer-list');

            collectionList.selectAll('li')
                .data(dgServices.collections).enter()
                .append('li')
                .attr('class', function(d) {
                    return (dgServices.defaultCollection === d.value) ? 'dgprofile active' : 'dgprofile';
                })
                .text(function(d) { return d.text; })
                .attr('value', function(d) { return d.value; })
                .on('click', function(d) {
                    d3.event.preventDefault();
                    selectCollection(d.value);
                    var activeService = (serviceSwitch.selectAll('input').property('checked')) ? 'EGD' : 'GBM';
                    //var activeProfile = profiles.selectAll('li.active').attr('value');
                    clickAddOrUpdateOverlay(iD.BackgroundSource(dgServices.collectionSource(activeService/*service*/, null/*connectId*/, 'Default_Profile'/*profile*/, d.value/*freshness*/)));
                });
        }
        //ENDAdded for EGD-plugin

        // Disabling per customer request
        // Feature #5248
    /*    var adjustments = content.append('div')
            .attr('class', 'adjustments');

        adjustments.append('a')
            .text(t('background.fix_misalignment'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                nudgeContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var nudgeContainer = adjustments.append('div')
            .attr('class', 'nudge-container cf')
            .style('display', 'none');

        nudgeContainer.selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .on('mousedown', clickNudge);

        var resetButton = nudgeContainer.append('button')
            .attr('class', 'reset disabled')
            .on('click', function () {
                context.background().offset([0, 0]);
                resetButton.classed('disabled', true);
            });

        resetButton.append('div')
            .attr('class', 'icon undo');
*/
        context.map()
            .on('move.background-update', _.debounce(update, 1000));

        context.background()
            .on('change.background-update', update);

        //TODO: Document why this was modified for Hoot
        context.map()
        .on('drawVector',function(){
            update();
        });

        //TODO: Document why this was modified for Hoot
        context.map()
        .on('updateBackgroundList',function(){
            update();
        });

        update();
        setOpacity(opacityDefault);

        var keybinding = d3.keybinding('background')
            .on(key, toggle)
            .on('F', hide)
            .on('H', hide);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.background-outside', hide);
        context.container().on('mousedown.background-outside', hide);
    }

    return background;
};
