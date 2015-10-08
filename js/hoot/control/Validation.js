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
                text: 'Verified',
                color: 'loud',
                icon: '_icon check',
                cmd: iD.ui.cmd('v'),
                action: validation.verify
            },
            {
                id: 'next',
                text: 'Next',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('n'),
                action: function() { validation.getItem(mapid, 'forward'); }
            },
            {
                id: 'previous',
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
            return iD.ui.tooltipHtml(t('verification.' + d.id + '.description'), d.cmd);
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

        var choicesbar = container.append('span')
            .classed('fr space', true);


        //Remove UI elements when layer is removed
        context.hoot().control.view.on('layerRemove.validation', function (layerName, isPrimary) {
            d3.select('#validation-container').remove();
            context.hoot().control.view.on('layerRemove.validation', null);
        });

        validation.updateMeta = function(d) {
            meta.html('<strong class="review-note">' + 'Note: ' + d.tags['hoot:review:note'] + '<br>'
                + 'Validation items remaining: ' + (+d.total - +d.reviewedcnt)
                + '  (Verified: ' + d.reviewedcnt
                + ', Locked: ' + d.lockedcnt + ')</strong>');
        };

        validation.presentChoices = function(d) {
            //Separate out the choice tags
            var choices = d3.entries(d).filter(function(c) {
                return c.key.indexOf('hoot:review:choices') === 0;
            }).map(function(c) {
                return JSON.parse(c.value);
            });

            console.log(choices);

            choiceButtons = choices.map(function(b, i) {
                var n = i + 1;
                return {
                    id: 'choice' + n,
                    text: n + '. ' + b.label,
                    description: b.description,
                    color: 'fill-grey button round pad0y pad1x dark small strong',
                    cmd: iD.ui.cmd(n.toString()),
                    action: function() { validation.verify(choices[i]); }
                };
            });
            console.log(choiceButtons);

            var keybinding = d3.keybinding('choices');
            choiceButtons.forEach(function(d) {
                keybinding.on(d.cmd, function() { d3.event.preventDefault(); d.action(); })
            });

            d3.select(document)
                .call(keybinding);

            var tooltip = bootstrap.tooltip()
            .placement('top')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(d.description, d.cmd);
            });

            var choicebuttons = choicesbar.selectAll('a')
                .data(choiceButtons);

            choicebuttons.enter().append('a')
                .attr('href', '#')
                .attr('enabled', true);

            choicebuttons.exit().remove();

            choicebuttons.text(function (d) {
                    return d.text;
                })
                .style('background-color', function (d) {
                    return d.color;
                })
                .style('color', '#fff')
                .attr('class', function (d) {
                    return 'inline button dark ' + d.color + ' pad0y pad2x keyline-all ' + d.icon + ' ' + d.id;
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
                    //console.log('loaded.validation');

                    var fid = item.type.charAt(0) + item.id + '_' + mapid;

                    //Select the feature
                    context.enter(iD.modes.Select(context, [fid]).suppressMenu(true));

                    var feature = context.hasEntity(fid);
                    //console.log(feature);
                    context.connection().on('loaded.validation', null);

                    //Update metadata for validation workflow
                    _.extend(response, {tags: feature.tags});
                    validation.updateMeta(response);

                    //Present the verification choices
                    var mock = {
                      "place": "town",
                      "hoot:review:needs": "yes",
                      "poi": "yes",
                      "hoot:review:choices:1": "{\"label\":\"Confirmed\",\"description\":\"You can look at the point and tell what it is (e.g. mosque or airport)\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"confirmed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:2": "{\"label\":\"Assessed\",\"description\":\"The point is on a building, but you can't verify its type (e.g. hair salon).\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"assessed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:3": "{\"label\":\"Reported\",\"description\":\"Imagery is pixelated or cloudy -- can not be assessed.\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"reported\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:note": "Flagged for imagery validation",
                      "name": "Manitou Springs"
                    }
                    validation.presentChoices(mock);

                    //console.log(JSON.stringify(feature.tags));
                });
            } else {

            }
        });
    };

    validation.verify = function(choice) {
        console.log(JSON.stringify(choice));
    };

    return d3.rebind(validation, event, 'on');
}