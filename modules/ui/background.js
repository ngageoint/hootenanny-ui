import _debounce from 'lodash-es/debounce';

import {
    descending as d3_descending,
    ascending as d3_ascending
} from 'd3-array';

import {
    event as d3_event,
    select as d3_select
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
import { uiTooltipHtml } from './tooltipHtml';
import { utilCallWhenIdle } from '../util';
import { tooltip } from '../util/tooltip';
import { rendererBackgroundSource } from '../renderer/background_source';

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

        selection.selectAll('.layer')
            .classed('active', active)
            .classed('switch', function(d) { return d === _previousBackground; })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    async function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        _previousBackground = context.background().baseLayerSource();
        context.storage('background-last-used-toggle', _previousBackground.id);
        context.storage('background-last-used', d.id);
        context.background().baseLayerSource(d);
        _backgroundList.call(updateLayerSelections);
        document.activeElement.blur();

        if (d.extent && d.type === 'tms') {
            //ask if user wants to zoom to basemaps
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
    }


    // function chooseCollection( value ) {
    //     function active( d ) {
    //         return d.value === value;
    //     }
    //
    //     // collections
    //     //     .selectAll( 'li' )
    //     //     .classed( 'active', active );
    //     //collections.classed('hide', true);
    // }
    //
    // function addOrUpdateOverlay( d ) {
    //     d3.event.preventDefault();
    //     context.background().addOrUpdateOverlayLayer( d );
    //     selectLayer();
    // }


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
            .attr('class', 'layer')
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
        selection.selectAll('.imagery-faq')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .text(t('background.imagery_source_faq'));
    }

    function renderLayerToggle() {
        const getlist = Object.values(Hoot.layers.loadedLayers);

        _layerToggleList.html('');

        let updateList = _layerToggleList.selectAll('.layer-toggle-item')
            .data(getlist);

        updateList.exit().remove();

        updateList = updateList.enter()
            .append('li')
            .attr('class', 'layer layer-toggle-item')
            .merge(updateList);

        let updateButton = updateList.selectAll('.lyrcntrlbtn')
            .data(d => [d]);

        updateButton.exit().remove();

        updateButton = updateButton.enter()
            .append('button')
            .call(tooltip().title('Click to have layer be on top').placement('left'))
            .attr('class', data => {
                let classes = `keyline-left fr fill-${data.color}`;

                // First item should have the button hidden
                if (getlist.length > 1 && getlist[0] === data) {
                    classes += ' hidden';
                }
                return classes;
            })
            .on('click', function(data) {
                var feature = d3.select(this.parentNode).node();
                var prev = feature.previousElementSibling;

                if (!prev) {
                    return;
                }
                _layerToggleList.node()
                    .insertBefore(feature, prev);

                //turn top layer 'move up' button off
                d3.select(feature).select('button')
                    .classed('hidden', true);
                //turn bottom layer 'move up' button on
                d3.select(prev).select('button')
                    .classed('hidden', false);

                Hoot.layers.setTopLayer(Number(data.id));
            })
            .append('span')
            .classed('material-icons', true)
            .text('arrow_upward');

        // create labels
        let updateLabel = updateList.selectAll('.layer-toggle-item-label')
            .data(d => [d]);

        updateLabel.exit().remove();

        updateLabel = updateLabel.enter()
            .append('label')
            .classed('layer-toggle-item-label', true)
            .merge(updateLabel);

        updateLabel.text(data =>  data.name);

        // create checkboxes
        let updateInput = updateLabel.selectAll('.layer-toggle-item-input')
            .data(d => [d]);

        updateInput.exit().remove();

        updateInput = updateInput.enter()
            .append('input')
            .classed('layer-toggle-item-input', true)
            .merge(updateInput);

        updateInput
            .attr('type', 'checkbox')
            .property('checked', true)
            .on('change', function(d) {
                Hoot.layers.toggleLayerVisibility(d);
            });
    }

    function renderOverlayList(selection) {
        var container = selection.selectAll('.layer-overlay-list')
            .data([0]);

        _overlayList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-overlay-list')
            .attr('dir', 'auto')
            .merge(container);
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

        if (dgServices.enabled) {
            let dgCollection = _overlayList
                .append('li')
                .attr('class', 'dg_layer')
                .call(tooltip()
                    .title(t('background.dgcl_button'))
                    .placement('left')
                )
                .datum(dgServices.collectionSource());

            dgCollection.append('button')
                .attr('class', 'dg-layer-profile')
                .call(tooltip()
                    .title(t( 'background.dgcl_button'))
                    .placement('left')
                )
                .on('click', () => {
                    d3.event.preventDefault();
                    collections.classed('hide', () => !collections.classed('hide'));
                })
                .call(svgIcon( '#iD-icon-layers'));

            let label = dgCollection.append('label');

            label
                .append('input')
                .attr('type', 'checkbox')
                .attr('name', 'layers')
                .on('change', d => {
                    function active( d ) {
                        return context.background().showsLayer( d );
                    }

                    context.background().toggleOverlayLayer( rendererBackgroundSource(d) );
                    document.activeElement.blur();

                    dgCollection
                        .classed( 'active', active )
                        .selectAll( 'input' )
                        .property( 'checked', active );
                });

            label
                .append( 'span' )
                .text( t( 'background.dgcl' ) );

            let collectionList = collections
                .append( 'ul' )
                .attr( 'class', 'layer-list' );

            collectionList
                .selectAll( 'li' )
                .data( dgServices.collections )
                .enter()
                .append( 'li' )
                .attr( 'class', d => dgServices.defaultCollection === d.value ? 'dgprofile active' : 'dgprofile' )
                .text( d => d.text )
                .attr( 'value', d => d.value)
                .on( 'click', d => {
                    function active( d ) {
                        return context.background().showsLayer( d );
                    }

                    d3.event.preventDefault();

                    let source = rendererBackgroundSource( dgServices.collectionSource( null, 'Default_Profile', d.value ) );

                    collections
                        .selectAll( 'li' )
                        .classed( 'active', dd => {
                            return dd.value === d.value;
                        } );

                    context
                        .background()
                        .addOrUpdateOverlayLayer( source );

                    dgCollection
                        .classed( 'active', active )
                        .selectAll( 'input' )
                        .property( 'checked', active );
                } );
        }

        update();

        context.keybinding()
            .on(key, togglePane)
            .on(uiCmd('⌘' + key), quickSwitch);

        uiBackground.hidePane = hidePane;
        uiBackground.togglePane = togglePane;
        uiBackground.setVisible = setVisible;
        uiBackground.renderLayerToggle = renderLayerToggle;
    }

    return background;
}
