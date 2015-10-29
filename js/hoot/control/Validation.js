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
            },
            {
                id: 'select',
                text: 'Select',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('s'),
                action: function() { validation.selectItem(); }
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
            .on('click', function (d) { //TODO: Can maybe use _debounce here, instead of enabled attr
                var b = d3.select(this);
                if (b.attr('enabled')) {
                    d.action();
                    b.attr('enabled', false);

                    //Wait for map data to load to enable button, add handler for 'loaded' event
                    var e = 'featureLoaded';
                    context.hoot().control.validation.on(e, function() {
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
            context.hoot().control.view.on('layerRemove.validation', null);
            validation.end();
        });

        validation.end = function() {
            d3.select('#validation-container').remove();
            //Disable validation keybindings
            d3.keybinding('validation').off();
            d3.keybinding('choices').off();
        };

        validation.updateMeta = function(d) {
            meta.html('<strong class="review-note">' + 'Note: ' + d.tags['hoot:review:note'] + '<br>'
                + 'Validation items remaining: ' + (+d.total - +d.reviewedcnt)
                + '  (Verified: ' + d.reviewedcnt
                + ', Locked: ' + d.lockedcnt + ')</strong>');
        };

        validation.presentChoices = function(feature, d) {
            //Separate out the choice tags
            var choices = d3.entries(d)
                .filter(function(c) {
                    return c.key.indexOf('hoot:review:choices') === 0;
                }).sort(function (a, b) {
                    if (a.key > b.key) {
                        return 1;
                    }
                    if (a.key < b.key) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                }).map(function(c) {
                    return JSON.parse(c.value.replace(/\\/g,''));
                });

            choiceButtons = choices.map(function(b, i) {
                var n = i + 1;
                return {
                    id: 'choice' + n,
                    text: n + '. ' + b.label,
                    description: b.description,
                    color: 'loud',
                    key: n.toString(),
                    action: function() { validation.verify(feature, choices[i]); }
                };
            });

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
                            //console.log(e);
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
        validation.getItem(mapid, 'forward');
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
            if (response.status == 'noneavailable') {
                validation.end();
                iD.ui.Alert('Validation complete', 'notice');
            } else if (response.status === 'success') {
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
                        });
                    }
                }, lockPeriod);


                //See if the feature has already been loaded in the map view
                var fid = item.type.charAt(0) + item.id + '_' + mapid;
                var feature = context.hasEntity(fid);
                if (feature) {
                    //console.log('already have feature');
                    loadFeature();
                } else {
                    //console.log('must wait for feature to load');
                    //Wait for map data to load, add handler for 'loaded' event
                    var e = 'loaded.validation';
                    context.connection().on(e, function() {
                        //console.log(e);
                        loadFeature();
                        //Unregister the handler
                        context.connection().on(e, null);
                    });
                }

                function loadFeature() {

                    var fid = item.type.charAt(0) + item.id + '_' + mapid;
                    var feature = context.hasEntity(fid);
                    //Select the feature
                    context.enter(iD.modes.Select(context, [fid]).suppressMenu(true));
                    //Have to call Select twice because the feature might not be drawn yet
                    var ev = 'drawVector.validation';
                    context.map().on(ev, function() {
                        //console.log(ev);
                        context.enter(iD.modes.Select(context, [fid]).suppressMenu(true));
                        //Unregister the handler
                        context.map().on(ev, null);
                    });

                    //Update metadata for validation workflow
                    _.extend(response, {tags: feature.tags});
                    validation.updateMeta(response);

                    validation.presentChoices(feature, feature.tags);

                    event.featureLoaded();
                }

                //Update selectItem to work with the current feature
                validation.selectItem = function() {
                    context.enter(iD.modes.Select(context, [fid]).suppressMenu(true));
                };

            } else {
                iD.ui.Alert(response.status, 'notice');
            }
        });
    };

    validation.verify = function(feature, choice) {
        //console.log(JSON.stringify(choice));

        var newTags = _.clone(feature.tags);

        //Perform tag changes
        _.extend(newTags, choice.changes.replaceTags);
        _.extend(newTags, choice.changes.appendTags);

        //Remove hoot:review:* tags
        newTags = _.omit(newTags, function (value, key) {
            return key.match(/hoot:review/g);
        });

        //Format the token tags
        var imagery = context.history().getVisibleImagery();
        var metadata = context.dgservices().imagemeta.sources;
        var tokenTags = _.map(imagery, function(i) {
            return metadata[i] || {'${BASEMAP_IMAGE_SOURCE}': i};
        });
        var tokenMap = _.reduce(tokenTags, function(obj, lyr) {
            _.each(_.keys(lyr), function(k) {
                if (obj[k]) {
                    obj[k].push(lyr[k]);
                } else {
                    obj[k] = [lyr[k]];
                }
            });
            return obj;
        }, {});
        //console.log(JSON.stringify(tokenMap));

        //Substitute for the token tags
        //Need to update to full lodash.js build to use _.invert, _.has and other functions
        // var invertTags = _.invert(newTags);
        // _.each(_.keys(tokenMap), function(t) {
        //     if (_.has(invertTags, t)) {
        //         newTags[invertTags[t]] = tokenMap[t].join(';');
        //     }
        // });
        var invert = function(obj) {

            var new_obj = {};

            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    new_obj[obj[prop]] = prop;
                }
            }

            return new_obj;
        };

        var invertTags = invert(newTags);
        //console.log(invertTags);

        _.each(_.keys(tokenMap), function(t) {
            if (_.some(_.keys(invertTags), function(i) {
                    return i === t;
                })) {
                newTags[invertTags[t]] = tokenMap[t].join(';');
            }
        });
        //console.log(newTags);

        //Remove token tags that have not be substituted
        newTags = _.omit(newTags, function(v, k) {
            return v.match(/\${.*}/g);
        });

        //Change tags
        context.perform(
           iD.actions.ChangeTags(feature.id, newTags), t('operations.change_tags.annotation')
        );

        //Save tag changes
        iD.modes.Save(context).save(context, function () {
            //Advance to next item
            validation.getItem(feature.mapId, 'forward');
        });

    };

    return d3.rebind(validation, event, 'on');
}