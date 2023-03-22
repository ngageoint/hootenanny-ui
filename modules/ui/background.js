import _debounce from 'lodash-es/debounce';

import {
    descending as d3_descending,
    ascending as d3_ascending
} from 'd3-array';

import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiBackgroundDisplayOptions } from './background_display_options';
import { uiBackgroundOffset } from './background_offset';
import { uiCmd } from './cmd';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiMapInMap } from './map_in_map';
import { uiSettingsCustomBackground } from './settings/custom_background';
import { uiSlider } from './slider';
import { uiTooltipHtml } from './tooltipHtml';
import { utilCallWhenIdle } from '../util';
import { tooltip } from '../util/tooltip';

export function uiBackground(context) {
    var key = t('background.key');

    var _customSource = context.background().findSource('custom');
    var _previousBackground = context.background().findSource(context.storage('background-last-used-toggle'));
    var _shown = false;

    var _backgroundList = d3_select(null);
    var _overlayList = d3_select(null);
    var _layerToggleList = d3_select(null);
    var _displayOptionsContainer = d3_select(null);
    var _offsetContainer = d3_select(null);

    var backgroundDisplayOptions = uiBackgroundDisplayOptions(context);
    var backgroundOffset = uiBackgroundOffset(context);
    var collections, profiles;
    var settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var dgServices = context.dgservices();


    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(tooltip().destroyAny);

            if (d === _previousBackground) {
                item.call(tooltip()
                    .placement(placement)
                    .html(true)
                    .title(function() {
                        var tip = '<div>' + t('background.switch') + '</div>';
                        return uiTooltipHtml(tip, uiCmd('⌘' + key));
                    })
                );
            } else if (description || isOverflowing) {
                item.call(tooltip()
                    .placement(placement)
                    .title(description || d.name())
                );
            }
        });
    }


    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('.layer, .dg_layer')
            .classed('active', active)
            .classed('switch', function(d) { return d === _previousBackground; })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function selectProfile(value) {
        function active(d) {
            return d.value === value;
        }
        profiles.selectAll('li')
            .classed('active', active);
    }


    function selectCollection(value) {
        function active(d) {
            return d === value;
        }
        collections.selectAll('li')
            .classed('active', active);
    }


    async function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        _previousBackground = context.background().baseLayerSource();
        context.storage('background-last-used-toggle', _previousBackground.id);
        context.storage('background-last-used', d.id);
        context.background().baseLayerSource(d);
        _backgroundList.call(updateLayerSelections);
        document.activeElement.blur();

        if (d.extent && d.type === 'tms') {
            //ask if user wants to zoom to basemap
            let message = 'Do you want to zoom to base layer?',
                confirm = await Hoot.message.confirm(message);

            if (confirm) {
                context.extent(d.extent);
            }
        }
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            chooseBackground(_customSource);
        } else {
            _customSource.template('');
            chooseBackground(context.background().findSource('none'));
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomBackground);
    }


    function chooseOverlay(d) {
        d3_event.preventDefault();
        context.background().toggleOverlayLayer(d);
        _overlayList.call(updateLayerSelections);
        document.activeElement.blur();
        if (d.slider){
            toggleOverlaySlider(d);
        }
    }

    function clickAddOrUpdateOverlay(d) {
        d3_event.preventDefault();
        context.background().addOrUpdateOverlayLayer(d);
        _backgroundList.call(updateLayerSelections);
    }

    function addOverlaySlider(d, element){
        var transparencySlider = uiSlider(context),
            tslide = element.append('div').attr('id' , d.id+'-slider-div'),
            tileOverlay = d3_select('.layer-list li.'+ d.id);

        tslide.call(transparencySlider, changeOpacity, !tileOverlay.classed('active'), d.id, 'Overlay');

        if (!tileOverlay.classed('active')){
            toggleOverlaySlider(d);
        }

        function changeOpacity(range) {
            d3_selectAll('.layer-overlay.'+d.id)
            .style('opacity', range / 100 );
        }
    }

    function toggleOverlaySlider(d){
        var overlay = context.background().showsLayer(d),
            transSliderDiv = d3_select('#transparency-slider-'+d.id);

        if (overlay){
            transSliderDiv.classed('hide', false);
        } else {
            transSliderDiv.classed('hide', true);
        }
    }

    function drawListItems(layerList, type, change, filter) {
        var sources = context.background()
            .sources(context.map().extent())
            .filter(filter);

        var layerLinks = layerList.selectAll('li.layer')
            .data(sources, function(d) { return d.name(); });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .insert('li', '.dg_layer')
            .attr('class', function(d){
                return 'layer ' + d.id;
            })
            .classed('layer-custom', function(d) { return d.id === 'custom'; })
            .classed('best', function(d) { return d.best(); });

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'layer-browse')
            .call(tooltip()
                .title(t('settings.custom_background.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'best')
            .call(tooltip()
                .title(t('background.best_imagery'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .html('&#9733;');

        enter.each(function(d){
            if (d.imagery_plugin){
                enter
                    .append('button')
                    .attr('class', 'layer-meta')
                    .attr('style', 'height:31px;')
                    .call(tooltip()
                        .title(t('background.image_metadata'))
                        .placement((textDirection === 'rtl') ? 'right' : 'left'))
                    .call(svgIcon('#iD-icon-inspect'));
            }
        });

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'layers')
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return d.name(); });

        enter.each(function(d){
            if (d.slider) {
                var element = d3_select(this);
                element.attr('style', 'display:block;height:100%;');
                addOverlaySlider(d, element);
            }
        });


        layerList.selectAll('li.layer')
            .sort(sortSources)
            .style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');

        layerList
            .call(updateLayerSelections);


        function sortSources(a, b) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }
    }


    function renderBackgroundList(selection) {
        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .attr('dir', 'auto')
            .merge(container);

        if (dgServices.enabled) {
            var dgbackground = _backgroundList.append('li')
                .attr('class', 'dg_layer')
                /*.call(tooltip()
                    .title(t('background.dgbg_tooltip'))
                    .placement('top'))*/
                .datum(dgServices.backgroundSource());

            dgbackground.append('button')
                .attr('class', 'dg-layer-profile')
                .call(tooltip()
                    .title(t('background.dgbg_button'))
                    .placement('left'))
                .on('click', function () {
                    d3_event.preventDefault();
                    profiles.classed('hide', function() { return !profiles.classed('hide'); });
                })
                .call(svgIcon('#iD-icon-layers'));

            var label = dgbackground.append('label');

            label.append('input')
                .attr('type', 'radio')
                .attr('name', 'layers')
                .on('change', function(d) {
                    d3_event.preventDefault();
                    chooseBackground(d);
                });

            label.append('span')
                .text(t('background.dgbg'));

            profiles = selection.append('div')
            .attr('id', 'dgProfiles')
            .attr('class', 'dgprofile hide'); //fillL map-overlay col3 content


            profiles
                .append('div')
                .attr('class', 'imagery-faq')
                .append('a')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .call(svgIcon('#iD-icon-out-link', 'inline'))
                .append('span')
                .text('Use my EVWHS Connect ID')
                .on('click', function() {
                    var cid = window.prompt(t('background.evwhs_prompt'));
                    if (!cid) { return; }

                    var extent = context.map().extent();
                    var size = context.map().dimensions();
                    var activeProfile = d3_select('.dgprofile.active').datum().value;

                    dgServices.wfs.getFeatureInRaster(cid/*connectId*/, activeProfile/*profile*/, extent, size, function(error, data) {
                        if (error) {
                            console.error(error);
                            alert('The Connect Id and User Name/Password combination could not be verified with EVWHS.  Please try again.');
                        } else {
                            if (data) console.log('Verifed EVWHS Connect Id and User Name/Password.');
                            dgServices.evwhs.connectId(cid);
                            var bsource = dgServices.backgroundSource(cid/*connectId*/, activeProfile/*profile*/);
                            chooseBackground(bsource);
                        }
                    });
                });

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
                    d3_event.preventDefault();
                    selectProfile(d.value);
                    var bsource = dgServices.backgroundSource(null/*connectId*/, d.value/*profile*/);
                    chooseBackground(bsource);
                    //Update radio button datum for dgbackground
                    dgbackground.selectAll('input').datum(bsource);
                });
        }


        // add minimap toggle below list
        var minimapEnter = selection.selectAll('.minimap-toggle-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list minimap-toggle-list')
            .append('li')
            .attr('class', 'layer minimap-toggle-item');

        var minimapLabelEnter = minimapEnter
            .append('label')
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.minimap.tooltip'), t('background.minimap.key')))
                .placement('top')
            );

        minimapLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                uiMapInMap.toggle();
            });

        minimapLabelEnter
            .append('span')
            .text(t('background.minimap.description'));


        // the layer toggle list
        _layerToggleList = selection.append('ul')
             .attr('class', 'layer-list layer-toggle-list');

        // "Info / Report a Problem" link
        // selection.selectAll('.imagery-faq')
        //     .data([0])
        //     .enter()
        //     .append('div')
        //     .attr('class', 'imagery-faq')
        //     .append('a')
        //     .attr('target', '_blank')
        //     .attr('tabindex', -1)
        //     .call(svgIcon('#icon-out-link', 'inline'))
        //     .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
        //     .append('span')
        //     .text(t('background.imagery_source_faq'));
    }


    function renderOverlayList(selection) {
        var container = selection.selectAll('.layer-overlay-list')
            .data([0]);

        _overlayList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-overlay-list')
            .attr('dir', 'auto')
            .merge(container);

        if (dgServices.enabled) {
            var dgcollection = _overlayList.append('li')
            .attr('class', 'dg_layer')
            .datum(dgServices.collectionSource());

            dgcollection.append('button')
                .attr('class', 'dg-layer-profile')
                .call(tooltip()
                    .title(t('background.dgcl_button'))
                    .placement('left'))
                .on('click', function() {
                    d3_event.preventDefault();
                    collections.classed('hide', function() { return !collections.classed('hide'); });
                })
                .call(svgIcon('#iD-icon-layers'));

            var label = dgcollection.append('label');

            label.append('input')
                .attr('type', 'checkbox')
                .attr('name', 'layers')
                .on('change', function() {
                    d3_event.preventDefault();
                    chooseOverlay(dgServices.collectionSource());
                });

            label.append('span')
                .text(t('background.dgcl'));

            collections = selection.append('div')
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
                    d3_event.preventDefault();
                    selectCollection(d.value);
                    clickAddOrUpdateOverlay(dgServices.collectionSource(null/*connectId*/, 'Default_Profile'/*profile*/, d.value/*freshness*/));
                });
        }
    }

    function update() {

        _backgroundList
            .call(drawListItems, 'radio', chooseBackground, function(d) { return !d.isHidden() && !d.overlay; });

        _overlayList
            .call(drawListItems, 'checkbox', chooseOverlay, function(d) { return !d.isHidden() && d.overlay; });

        _displayOptionsContainer
            .call(backgroundDisplayOptions);

        _offsetContainer
            .call(backgroundOffset);
    }


    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        if (_previousBackground) {
            chooseBackground(_previousBackground);
        }
    }


    function background(selection) {

        function hidePane() {
            setVisible(false);
        }

        function togglePane() {
            if (d3_event) d3_event.preventDefault();
            paneTooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== _shown) {
                button.classed('active', show);
                _shown = show;

                if (show) {
                    uiMapData.hidePane();
                    uiHelp.hidePane();
                    update();

                    pane
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                } else {
                    pane
                        .style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });
                }
            }
        }


        var pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('background.description'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', togglePane)
            .call(svgIcon('#iD-icon-layers', 'light'))
            .call(paneTooltip);


        var heading = pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('background.title'));

        heading
            .append('button')
            .on('click', function() { uiBackground.hidePane(); })
            .call(svgIcon('#iD-icon-close'));


        var content = pane
            .append('div')
            .attr('class', 'pane-content');

        // background list
        content
            .append('div')
            .attr('class', 'background-background-list-container')
            .call(uiDisclosure(context, 'background_list', true)
                .title(t('background.backgrounds'))
                .content(renderBackgroundList)
            );

        // overlay list
        content
            .append('div')
            .attr('class', 'background-overlay-list-container')
            .call(uiDisclosure(context, 'overlay_list', true)
                .title(t('background.overlays'))
                .content(renderOverlayList)
            );

        // dg collection list
        let collections = content
            .append('div')
            .attr('id', 'dgProfiles')
            .attr('class', 'dgprofile hide');

        // display options
        _displayOptionsContainer = content
            .append('div')
            .attr('class', 'background-display-options');

        // offset controls
        _offsetContainer = content
            .append('div')
            .attr('class', 'background-offset');

        // add listeners
        context.map()
            .on('move.background-update', _debounce(utilCallWhenIdle(update), 1000));

        context.background()
            .on('change.background-update', update);


        update();

        context.keybinding()
            .on(key, togglePane)
            .on(uiCmd('⌘' + key), quickSwitch);

        uiBackground.hidePane = hidePane;
        uiBackground.togglePane = togglePane;
        uiBackground.setVisible = setVisible;
    }

    return background;
}
