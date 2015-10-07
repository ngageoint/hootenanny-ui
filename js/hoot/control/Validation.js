Hoot.control.validation = function(context, sidebar) {
    var validation = {};

    validation.begin = function(mapid) {
        //Add the UI elements
        var container = d3.select('#content')
            .append('div')
            .attr('id', 'validation-container')
            .classed('pin-bottom review-block unclickable', true)
            .append('div')
            .classed('validation col12 fillD pad1 space clickable', true)
            ;

        var meta = container.append('span')
            .classed('_icon info dark pad0y space', true);

        var buttons = [
            {
                id: 'verified',
                name: 'foo',
                text: 'Verified',
                color: 'loud',
                icon: '_icon check',
                cmd: iD.ui.cmd('v'),
                action: validation.verify
            },
            {
                id: 'next',
                name: 'review_foward',
                text: 'Next',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                input: 'test',
                cmd: iD.ui.cmd('n'),
                action: function() { validation.getItem(mapid, 'forward'); }
            },
            {
                id: 'previous',
                name: 'review_backward',
                text: 'Previous',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('p'),
                action: function() { validation.getItem(mapid, 'backward'); }
            }
        ];

        var keybinding = d3.keybinding('validation');
        buttons.forEach(function(d) {
            keybinding.on(d.cmd, function() { d3.event.preventDefault(); d.action(); })
        });

        d3.select(document)
            .call(keybinding);

        var tooltip = bootstrap.tooltip()
        .placement('top')
        .html(true)
        .title(function (d) {
            return iD.ui.tooltipHtml(t('review.' + d.id + '.description'), d.cmd);
        });

        var buttonbar = container.append('span')
            .classed('fr space', true);
        buttonbar.selectAll('a')
            .data(buttons)
            .enter().append('a')
            .attr('href', '#')
            .attr('enabled', true)
            .text(function (d) {
                return d.text;
            })
            .style('background-color', function (d) {
                return d.color;
            })
            .style('color', '#fff')
            .attr('class', function (d) {
                return 'fr inline button dark ' + d.color + ' pad0y pad2x keyline-all ' + d.icon + ' ' + d.id;
            })
            .on('click', function (d) {
                var b = d3.select(this);
                if (b.attr('enabled')) {
                    d.action();
                    b.attr('enabled', false);

                    //Wait for map data to load to enable button, add handler for 'loaded' event
                    var e = 'loaded.validation.button';
                    context.connection().on(e, function() {
                        console.log(e);
                        b.attr('enabled', true);
                        context.connection().on(e, null);
                    });
                } else {
                    iD.ui.Alert('Please wait. Processing validation.','notice');
                }
            })
            .call(tooltip);


        //Remove UI elements when layer is removed
        context.hoot().control.view.on('layerRemove.validation', function (layerName, isPrimary) {
            console.log('boo');
            d3.select('#validation-container').remove();
            context.hoot().control.view.on('layerRemove.validation', null);
        });

        validation.updateMeta = function(d) {
            meta.html('<strong class="review-note">' + 'Review note: ' + d.tags['hoot:review:note'] + '<br>'
                + 'Review items remaining: ' + (+d.total - +d.reviewedcnt)
                + '  (Verified: ' + d.reviewedcnt
                + ', Locked: ' + d.lockedcnt + ')</strong>');
        };

        //Get the first validation item
        this.getItem(mapid, 'forward');
    };

    validation.getItem = function(mapid, direction) {
        var data = {
            mapId: mapid,
            direction: direction
        };

        Hoot.model.REST('reviewGetNext', data, function (error, response) {
            console.log(response);
            if (response.status === 'success') {
                //Position the map
                var item = response.reviewItem;
                var center = item.displayBounds.split(',').slice(0, 2).map(function(d) { return +d; });
                context.map().centerZoom(center, 19);

                //Wait for map data to load, add handler for 'loaded' event
                context.connection().on('loaded.validation', function() {
                    console.log('loaded.validation');

                    var fid = item.type.slice(0, 1) + item.id + '_' + mapid;
                    var feature = context.hasEntity(fid);
                    console.log(feature);
                    context.connection().on('loaded.validation', null);

                    //Update metadata for validation workflow
                    _.extend(response, {tags: feature.tags});
                    validation.updateMeta(response);
                });
            } else {

            }
        });
    };

    validation.verifyItem = function() {

    };

    return d3.rebind(validation, event, 'on');
}