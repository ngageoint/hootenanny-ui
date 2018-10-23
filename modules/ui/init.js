import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';

import { behaviorHash } from '../behavior';
import { modeBrowse } from '../modes';
import { services } from '../services';
import { svgDefs, svgIcon } from '../svg';
import { utilGetDimensions } from '../util/dimensions';
import { utilRebind } from '../util';

import { uiAccount } from './account';
import { uiBackground } from './background';
import { uiContributors } from './contributors';
import { uiCoordinates } from './coordinates';
import { uiDgcarousel } from './dgcarousel';
import { uiFeatureInfo } from './feature_info';
import { uiFullScreen } from './full_screen';
import { uiGeolocate } from './geolocate';
import { uiHelp } from './help';
import { uiInfo } from './info';
import { uiIntro } from './intro';
import { uiLoading } from './loading';
import { uiMapData } from './map_data';
import { uiMapInMap } from './map_in_map';
import { uiModes } from './modes';
import { uiPasteTags } from './paste_tags';
import { uiRestore } from './restore';
import { uiSave } from './save';
import { uiScale } from './scale';
import { uiShortcuts } from './shortcuts';
import { uiSidebar } from './sidebar';
import { uiSpinner } from './spinner';
import { uiSplash } from './splash';
import { uiStatus } from './status';
import { uiTools } from './tools';
import { uiUndoRedo } from './undo_redo';
import { uiVersion } from './version';
import { uiZoom } from './zoom';
import { uiCmd } from './cmd';

//import HootOld from '../hoot/hootOld';

export function uiInit(context) {
    var uiInitCounter = 0;
    var dispatch = d3_dispatch('photoviewerResize');

    function render(container) {
        container
            .attr('dir', textDirection);

        var map = context.map();

        var hash = behaviorHash(context);
        hash();

        if (!hash.hadHash) {
            map.centerZoom([0, 0], 2);
        }

        container
            .append('svg')
            .attr('id', 'defs')
            .call(svgDefs(context));

        container
            .append('div')
            .attr('id', 'sidebar')
            .attr('class', 'col4')
            .call(ui.sidebar);

        var content = container
            .append('div')
            .attr('id', 'content')
            .attr('class', 'active');

        var bar = container
            .append('div')
            .attr('id', 'bar')
            .attr('class', 'fillD');

        content
            .append('div')
            .attr('id', 'map')
            .attr('dir', 'ltr')
            .call(map);

        content
            .call(uiMapInMap(context))
            .call(uiInfo(context));

        var limiter = bar.append('div')
            .attr('class', 'limiter');

        limiter
            .append( 'div' )
            .attr( 'class', 'button-wrap' )
            .call(uiTools(context));

        limiter
            .append( 'div' )
            .attr( 'class', 'button-wrap joined' )
            .call(uiPasteTags(context));

        limiter
            .append('div')
            .attr('class', 'button-wrap joined')
            .call(uiModes(context), limiter);

        limiter
            .append('div')
            .attr('class', 'button-wrap joined')
            .call(uiUndoRedo(context));

        limiter
            .append('div')
            .attr('class', 'button-wrap')
            .call(uiSave(context));

        // limiter
        //     .append('span')
        //     .attr('class', 'button-wrap col2')
        //     .call(uiSaveToOsm(context));

        bar
            .append('div')
            .attr('class', 'full-screen')
            .call(uiFullScreen(context));

        bar
            .append('div')
            .attr('class', 'spinner')
            .call(uiSpinner(context));


        var controls = bar
            .append('div')
            .attr('class', 'map-controls');

        controls
            .append('div')
            .attr('class', 'map-control zoombuttons')
            .call(uiZoom(context));

        controls
            .append('div')
            .attr('class', 'map-control geolocate-control')
            .call(uiGeolocate(context));

        controls
            .append('div')
            .attr('class', 'map-control background-control')
            .call(uiBackground(context));

        if (context.dgservices().enabled) {
            controls.append('div')
                .attr('class', 'map-control carousel-control')
                .call(uiDgcarousel(context));
        }

        controls
            .append('div')
            .attr('class', 'map-control map-data-control')
            .call(uiMapData(context));

        controls
            .append('div')
            .attr('class', 'map-control help-control')
            .call(uiHelp(context));


        var about = content
            .append('div')
            .attr('id', 'about');

        //about
        //    .append('div')
        //    .attr('id', 'attrib')
        //    .attr('dir', 'ltr')
        //    .call(uiAttribution(context));

        about
            .append('div')
            .attr('class', 'api-status')
            .call(uiStatus(context));


        var footer = about
            .append('div')
            .attr('id', 'footer')
            .attr('class', 'fillD');

        footer
            .append('div')
            .attr('id', 'flash-wrap')
            .attr('class', 'footer-hide');

        var footerWrap = footer
            .append('div')
            .attr('id', 'footer-wrap')
            .attr('class', 'footer-show');

        footerWrap
            .append('div')
            .attr('id', 'scale-block')
            .call(uiScale(context));

        var aboutList = footerWrap
            .append('div')
            .attr('id', 'info-block')
            .append('ul')
            .attr('id', 'about-list');

        //if (!context.embed()) {
        //    aboutList
        //        .call(uiAccount(context));
        //}

        aboutList
            .append('li')
            .attr('class', 'version')
            .call(uiVersion(context));

        //var issueLinks = aboutList
        //    .append('li');
        /*
        issueLinks
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/issues')
            .call(svgIcon('#iD-icon-bug', 'light'))
            .call(tooltip().title(t('report_a_bug')).placement('top'));

        issueLinks
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating')
            .call(svgIcon('#iD-icon-translate', 'light'))
            .call(tooltip().title(t('help_translate')).placement('top'));
        */

        aboutList
            .append('li')
            .attr('class', 'feature-warning')
            .attr('tabindex', -1)
            .call(uiFeatureInfo(context));

        aboutList.append('li')
            .attr('class', 'coordinates')
            .attr('tabindex', -1)
            .call(uiCoordinates(context));

        aboutList
            .append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(uiContributors(context));

        if (!context.embed()) {
            aboutList.call(uiAccount(context));
        }

        var photoviewer = content
            .append('div')
            .attr('id', 'photoviewer')
            .classed('al', true)       // 'al'=left,  'ar'=right
            .classed('hide', true);

        photoviewer
            .append('button')
            .attr('class', 'thumb-hide')
            .on('click', function () {
                if (services.streetside) { services.streetside.hideViewer(); }
                if (services.mapillary) { services.mapillary.hideViewer(); }
                if (services.openstreetcam) { services.openstreetcam.hideViewer(); }
            })
            .append('div')
            .call(svgIcon('#iD-icon-close'));

        photoviewer
            .append('button')
            .attr('class', 'resize-handle-xy')
            .on(
                'mousedown',
                buildResizeListener(photoviewer, 'photoviewerResize', dispatch, { resizeOnX: true, resizeOnY: true })
            );

        photoviewer
            .append('button')
            .attr('class', 'resize-handle-x')
            .on(
                'mousedown',
                buildResizeListener(photoviewer, 'photoviewerResize', dispatch, { resizeOnX: true })
            );

        photoviewer
            .append('button')
            .attr('class', 'resize-handle-y')
            .on(
                'mousedown',
                buildResizeListener(photoviewer, 'photoviewerResize', dispatch, { resizeOnY: true })
            );

        var mapDimensions = map.dimensions();

        // bind events
        window.onbeforeunload = function() {
            return context.save();
        };

        window.onunload = function() {
            context.history().unlock();
        };

        d3_select(window)
            .on('resize.editor', onResize);

        onResize();


        var pa = 80;  // pan amount
        var keybinding = d3_keybinding('main')
            .on('⌫', function() { d3_event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]))
            .on(['⇧←', uiCmd('⌘←')], pan([mapDimensions[0], 0]))
            .on(['⇧↑', uiCmd('⌘↑')], pan([0, mapDimensions[1]]))
            .on(['⇧→', uiCmd('⌘→')], pan([-mapDimensions[0], 0]))
            .on(['⇧↓', uiCmd('⌘↓')], pan([0, -mapDimensions[1]]));

        d3_select(document)
            .call(keybinding);

        context.enter(modeBrowse(context));

        if (!uiInitCounter++) {
            if (!hash.startWalkthrough) {
                context.container()
                    .call(uiSplash(context))
                    .call(uiRestore(context));
            }

            context.container()
                .call(uiShortcuts(context));
        }

        var osm = context.connection();
        var auth = uiLoading(context).message(t('loading_auth')).blocking(true);

        if (osm && auth) {
            osm
                .on('authLoading.ui', function() {
                    context.container()
                        .call(auth);
                })
                .on('authDone.ui', function() {
                    auth.close();
                });
        }

        uiInitCounter++;

        if (hash.startWalkthrough) {
            hash.startWalkthrough = false;
            context.container().call(uiIntro(context));
        }


        function onResize() {
            mapDimensions = utilGetDimensions(content, true);
            map.dimensions(mapDimensions);

            // shrink photo viewer if it is too big
            // (-90 preserves space at top and bottom of map used by menus)
            var photoDimensions = utilGetDimensions(photoviewer, true);
            if (photoDimensions[0] > mapDimensions[0] || photoDimensions[1] > (mapDimensions[1] - 90)) {
                var setPhotoDimensions = [
                    Math.min(photoDimensions[0], mapDimensions[0]),
                    Math.min(photoDimensions[1], mapDimensions[1] - 90),
                ];

                photoviewer
                    .style('width', setPhotoDimensions[0] + 'px')
                    .style('height', setPhotoDimensions[1] + 'px');

                dispatch.call('photoviewerResize', photoviewer, setPhotoDimensions);
            }
        }


        function pan(d) {
            return function() {
                d3_event.preventDefault();
                context.pan(d, 100);
            };
        }

        function buildResizeListener(target, eventName, dispatch, options) {
            var resizeOnX = !!options.resizeOnX;
            var resizeOnY = !!options.resizeOnY;
            var minHeight = options.minHeight || 240;
            var minWidth = options.minWidth || 320;
            var startX;
            var startY;
            var startWidth;
            var startHeight;

            function startResize() {
                var mapSize = context.map().dimensions();

                if (resizeOnX) {
                    var maxWidth = mapSize[0];
                    var newWidth = clamp((startWidth + d3_event.clientX - startX), minWidth, maxWidth);
                    target.style('width', newWidth + 'px');
                }

                if (resizeOnY) {
                    var maxHeight = mapSize[1] - 90;  // preserve space at top/bottom of map
                    var newHeight = clamp((startHeight + startY - d3_event.clientY), minHeight, maxHeight);
                    target.style('height', newHeight + 'px');
                }

                dispatch.call(eventName, target, utilGetDimensions(target, true));
            }

            function clamp(num, min, max) {
                return Math.max(min, Math.min(num, max));
            }

            function stopResize() {
                d3_select(window)
                    .on('.' + eventName, null);
            }

            return function initResize() {
                startX = d3_event.clientX;
                startY = d3_event.clientY;
                startWidth = target.node().getBoundingClientRect().width;
                startHeight = target.node().getBoundingClientRect().height;

                d3_select(window)
                    .on('mousemove.' + eventName, startResize, false)
                    .on('mouseup.' + eventName, stopResize, false);
            };
        }
    }


    var renderCallback;

    function ui(node, callback) {
        renderCallback = callback;
        var container = d3_select(node);
        context.container(container);
        context.loadLocale(function(err) {
            if (!err) {
                //const hootUI = new HootOld( context );

                render(container);

                context.hoot.init( context );
                //hootUI.init();
                //context.hoot = hootUI;
            }
            if (callback) {
                callback(err);
            }
        });
    }


    ui.restart = function(arg) {
        context.locale(arg);
        context.loadLocale(function(err) {
            if (!err) {
                context.container().selectAll('*').remove();
                render(context.container());
                if (renderCallback) renderCallback();
            }
        });
    };

    ui.sidebar = uiSidebar(context);

    return utilRebind(ui, dispatch, 'on');
}
