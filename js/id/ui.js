iD.ui = function(context) {
    function render(container) {
        var map = context.map();

        if (iD.detect().opera) container.classed('opera', true);

        var hash = iD.behavior.Hash(context);

        hash();

        if (!hash.hadHash) {
            map.centerZoom(context.hoot().center, context.hoot().zoom);
        }

        container.append('svg')
            .attr('id', 'defs')
            .call(iD.svg.Defs(context));


        //Create a ref to sidebar, so Hoot can override???
        var sidebar = container.append('div')
            .attr('id', 'sidebar')
            .attr('class', 'col4')
            .call(ui.sidebar);

        var app = sidebar.append('div')
            .attr('id', 'app')
            .classed('col12', true)
            .style('postion', 'absolute');

        var content = container.append('div')
            .attr('id', 'content');

        var bar = content.append('div')
            .attr('id', 'bar')
            .attr('class', 'fillD');
        bar.style('top', '60px');
        
        var m = content.append('div')
            .attr('id', 'map')
            .call(map);

        content.append('div')
            .attr('class', 'map-in-map')
            .style('display', 'none')
            .call(iD.ui.MapInMap(context));

        content.append('div')
        	.attr('class','infobox fillD2')
        	.style('display','none')
        	.call(iD.ui.Info(context));
        
        bar.append('div')
            .attr('class', 'spacer col4');

        var limiter = bar.append('div')
            .attr('class', 'limiter');

        limiter.append('div')
	        .attr('class', 'button-wrap col1')
	        .call(iD.ui.Tools(context));        
        
        limiter.append('div')
            .attr('class', 'button-wrap joined col3')
            .call(iD.ui.Modes(context), limiter);

        limiter.append('div')
            .attr('class', 'button-wrap joined col1')
            .call(iD.ui.UndoRedo(context));

        limiter.append('div')
            .attr('class', 'button-wrap col1')
            .call(iD.ui.Save(context));

        bar.append('div')
            .attr('class', 'spinner')
            .call(iD.ui.Spinner(context));
        
        bar.append('div')
        	.attr('class','warning')
        	.call(iD.ui.Warning(context,false,''));

        var controls = bar.append('div')
            .attr('class', 'map-controls');

        controls.append('div')
            .attr('class', 'map-control zoombuttons')
            .call(iD.ui.Zoom(context));

        controls.append('div')
            .attr('class', 'map-control geolocate-control')
            .call(iD.ui.Geolocate(map));

        controls.append('div')
            .attr('class', 'map-control background-control')
            .call(iD.ui.Background(context));

        if (iD.dgservices().enabled) {
            controls.append('div')
                .attr('class', 'map-control carousel-control')
                .call(iD.ui.dgCarousel(context));
        }

        controls.append('div')
            .attr('class', 'map-control map-data-control')
            .call(iD.ui.MapData(context));

        controls.append('div')
            .attr('class', 'map-control help-control')
            .call(iD.ui.Help(context));

 //START: Hoot may have wanted to disable this by commenting out
       var about = content.append('div')
            .attr('id', 'about');

        /*about.append('div')
            .attr('id', 'attrib')
            .call(iD.ui.Attribution(context));*/

        var footer = about.append('div')
            .attr('id', 'footer')
            .attr('class', 'fillD');

        footer.append('div')
            .attr('id', 'scale-block')
            .call(iD.ui.Scale(context));

        var aboutList = footer.append('div')
            .attr('id', 'info-block')
            .append('ul')
            .attr('id', 'about-list');

        if (!context.embed()) {
            aboutList.call(iD.ui.Account(context));
        }

        /*aboutList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'http://github.com/openstreetmap/iD')
            .text(iD.version);

        var bugReport = aboutList.append('li')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', 'https://github.com/openstreetmap/iD/issues');

        bugReport.append('span')
            .attr('class','icon bug light');

        bugReport.call(bootstrap.tooltip()
                .title(t('report_a_bug'))
                .placement('top')
            );

        aboutList.append('li')
            .attr('class', 'feature-warning')
            .attr('tabindex', -1)
            .call(iD.ui.FeatureInfo(context));

        aboutList.append('li')
            .attr('class', 'user-list')
            .attr('tabindex', -1)
            .call(iD.ui.Contributors(context));*/

        aboutList.append('li')
          .attr('class','coordinates')
          .attr('tabindex',-1)
          .call(iD.ui.Coordinates(context));

        /*footer.append('div')
            .attr('class', 'api-status')
            .call(iD.ui.Status(context));*/
 //END: Hoot may have wanted to disable this by commenting out

        //TODO: Document why this was added for Hoot

        var hootSidebar2 = app.append('div')
            .attr('id', 'sidebar2')
            .classed('col12 pad2 sidebar', true);

        context.hoot().control.loadSidebarControls(context, hootSidebar2);
            //.call(ui.sidebar.hoot);
        var sdHeight = document.getElementById('app').clientHeight;
        hootSidebar2.style({
            'max-height': sdHeight + 'px',
            'overflow': 'auto'
        });

        window.onbeforeunload = function() {
            return context.save();
        };

        window.onunload = function() {
            context.history().unlock();
        };

        d3.select(window).on('resize.editor', function() {
            map.dimensions(m.dimensions());
            //TODO: Document why this was modified for Hoot
            var sdHeight = document.getElementById('app').clientHeight;
            hootSidebar2.style({
                'max-height': sdHeight + 'px',
                'overflow': 'auto'
            });
        });

        function pan(d) {
            return function() {
                context.pan(d);
            };
        }

        // pan amount
        var pa = 5;

        var keybinding = d3.keybinding('main')
            .on('⌫', function() { d3.event.preventDefault(); })
            .on('←', pan([pa, 0]))
            .on('↑', pan([0, pa]))
            .on('→', pan([-pa, 0]))
            .on('↓', pan([0, -pa]));

        d3.select(document)
            .call(keybinding);

        context.enter(iD.modes.Browse(context));

        context.container()
            .call(iD.ui.Splash(context))
            .call(iD.ui.Restore(context));

        var authenticating = iD.ui.Loading(context)
            .message(t('loading_auth'));

        context.connection()
            .on('authenticating.ui', function() {
                context.container()
                    .call(authenticating);
            })
            .on('authenticated.ui', function() {
                authenticating.close();
            });
    }

    function ui(container) {
        context.container(container);
        context.loadLocale(function() {
            //TODO: Document why this was added for Hoot
            context.hoot().loadUtilities(context);
            render(container);
            //TODO: Document why this was added for Hoot
            d3.select('.map-overlay').append('ul')
                .attr('class', 'layer-list layer-list-hoot')
                .style('font-size','12px');
        });
    }

    ui.sidebar = iD.ui.Sidebar(context);

    ui.plugins = iD.ui.plugins();

    return ui;
};

iD.ui.tooltipHtml = function(text, key) {
    var s = '<span>' + text + '</span>';
    if (key) {
        s += '<div class="keyhint-wrap">' +
            '<span> ' + (t('tooltip_keyhint')) + ' </span>' +
            '<span class="keyhint"> ' + key + '</span></div>';
    }
    return s;
};
