Hoot.control.validation = function(context, sidebar) {
    var event = d3.dispatch('featureLoaded');
    var validation = {};
    //Tracks the current review id, used as offset param to unlock review
    //when Previous or Next buttons are used
    var currentReviewId;
    //Keeps the item lock alive while the browser session is active
    var heartBeatTimer;

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
            // {
            //     id: 'verified',
            //     text: 'Verified',
            //     color: 'loud',
            //     icon: '_icon check',
            //     cmd: iD.ui.cmd('v'),
            //     action: validation.verify
            // },
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
                    var e = 'featureLoaded';
                    context.hoot().control.validation.on(e, function() {
                        console.log(e);
                        b.attr('enabled', true);
                        context.hoot().control.validation.on(e, null);
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

            //Disable validation keybindings
            d3.keybinding('validation').off();
            d3.keybinding('choices').off();

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
                return JSON.parse(c.value);//JSON.parse(c.value.replace(/\\/g,''));
            });

            //console.log(choices);

            choiceButtons = choices.map(function(b, i) {
                var n = i + 1;
                return {
                    id: 'choice' + n,
                    text: n + '. ' + b.label,
                    description: b.description,
                    color: 'loud',
                    key: n.toString(),
                    action: function() { validation.verify(choices[i]); }
                };
            });
            //console.log(JSON.stringify(choiceButtons));

            //Disable iD edit tool keybinding
            //TODO: Not sure how to re-enable yet (F5 anyone?)
            d3.keybinding('mode-buttons').off();

            var keybinding = d3.keybinding('choices');
            choiceButtons.forEach(function(d) {

                keybinding.on(d.key, function() { d3.event.preventDefault(); d.action(); });
                keybinding.on('num-' + d.key, function() { d3.event.preventDefault(); d.action(); });
            });

            d3.select(document)
                .call(keybinding);

            var tooltip = bootstrap.tooltip()
            .placement('top')
            .html(true)
            .title(function (d) {
                return iD.ui.tooltipHtml(d.description, d.key);
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
                        var e = 'featureLoaded';
                        context.hoot().control.validation.on(e, function() {
                            console.log(e);
                            b.attr('enabled', true);
                            context.hoot().control.validation.on(e, null);
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
        //Stop keeping the current review alive
        if (heartBeatTimer) {
            clearInterval(heartBeatTimer);
        }

        var data = {
            mapId: mapid,
            direction: direction,
            offset: currentReviewId
        };

        Hoot.model.REST('reviewGetNext', data, function (error, response) {
            //console.log(response);
            if (response.status === 'success') {
                //Position the map
                var item = response.reviewItem;
                currentReviewId = item.reviewId;
                var center = item.displayBounds.split(',').slice(0, 2).map(function(d) { return +d; });
                context.map().centerZoom(center, 19);

                var lockPeriod = 150000;
                //Refresh lock at half of service lock length
                if (response.locktime) {
                    lockPeriod = (1 * response.locktime) / 2;
                }
                //Ping until advancing to next item so we keep the lock alive
                heartBeatTimer = setInterval(function() {
                    if(item){

                        var heartBeatData = {
                            mapId: mapid,
                            reviewid: item.uuid,
                            reviewAgainstUuid: item.itemToReviewAgainst.uuid
                        };

                        Hoot.model.REST('reviewUpdateStatus', heartBeatData, function (error, response) {

                            if(error){
                                clearInterval(heartBeatTimer);
                                iD.ui.Alert('Failed to update review status.','warning');
                                   return;
                            }
                            if(callback){
                                callback(response);
                            }
                        });
                    }
                }, lockPeriod);


                //See if the feature has already been loaded in the map view
                var fid = item.type.charAt(0) + item.id + '_' + mapid;
                var feature = context.hasEntity(fid);
                if (feature) {
                    loadFeature();
                } else {
                    //Wait for map data to load, add handler for 'loaded' event
                    var e = 'loaded.validation';
                    context.connection().on(e, function() {
                        console.log(e);
                        loadFeature();
                        //Unregister the loaded handler
                        context.connection().on(e, null);
                    });
                }

                function loadFeature() {

                    var fid = item.type.charAt(0) + item.id + '_' + mapid;

                    //Select the feature
                    context.enter(iD.modes.Select(context, [fid]).suppressMenu(true));

                    var feature = context.hasEntity(fid);
                    //console.log(feature);

                    //Update metadata for validation workflow
                    _.extend(response, {tags: feature.tags});
                    validation.updateMeta(response);

                    // Returns a random integer between min (included) and max (included)
                    // Using Math.round() will give you a non-uniform distribution!
                    function getRandomIntInclusive(min, max) {
                      return Math.floor(Math.random() * (max - min + 1)) + min;
                    }
                    //Present the verification choices
                    var mock = [
                    {
                      "place": "town",
                      "hoot:review:needs": "yes",
                      "poi": "yes",
                      "hoot:review:choices:1": "{\"label\":\"Confirmed\",\"description\":\"You can look at the point and tell what it is (e.g. mosque or airport)\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"confirmed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:2": "{\"label\":\"Assessed\",\"description\":\"The point is on a building, but you can't verify its type (e.g. hair salon).\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"assessed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:3": "{\"label\":\"Reported\",\"description\":\"Imagery is pixelated or cloudy -- can not be assessed.\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"reported\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:note": "Flagged for imagery validation",
                      "name": "Manitou Springs"
                    },
                    {
                      "poi": "yes",
                      "hoot:review:choices:1": "{\"label\":\"Foo\",\"description\":\"You can look at the point and tell what it is (e.g. mosque or airport)\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"confirmed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:2": "{\"label\":\"Bar\",\"description\":\"The point is on a building, but you can't verify its type (e.g. hair salon).\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"assessed\",\"hgis:accuracy\":\"high\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:review:choices:3": "{\"label\":\"Baz\",\"description\":\"Imagery is pixelated or cloudy -- can not be assessed.\",\"changes\":{\"replaceTags\":{\"hgis:imagery_confirmed\":\"reported\"},\"appendTags\":{\"source:geometry\":\"${BASEMAP_IMAGE_SOURCE}\",\"source:geometry:sensor\":\"${BASEMAP_IMAGE_SENSOR}\",\"source:geometry:date\":\"${BASEMAP_IMAGE_DATETIME}\",\"source:geometry:id\":\"${BASEMAP_IMAGE_ID}\"}}}",
                      "hoot:status": "1",
                      "hoot:review:needs": "yes",
                      "name": "Garden of the Gods",
                      "leisure": "park",
                      "uuid": "{87ba9abc-16dc-4e59-a9cc-fef70051fd97}",
                      "error:circular": "1000",
                      "hoot": "Merged_AllDataTypes_validate"
                    }
                    ]
                    validation.presentChoices(mock[getRandomIntInclusive(0,1)]);

                    //console.log(JSON.stringify(feature.tags));
                    event.featureLoaded();
                }
            } else {

            }
        });
    };

    validation.verify = function(choice) {
        console.log(JSON.stringify(choice));
    };

    return d3.rebind(validation, event, 'on');
}