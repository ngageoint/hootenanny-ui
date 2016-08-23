/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.validation is HGIS validation cotrol which performs review processing on HGIS validation layer.
//
//  NOTE: This should be merged with Conflicts review modules.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//      14 Apr. 2016 eslint changes -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.validation = function(context) {
    var event = d3.dispatch('featureLoaded');
    var validation = {};
    var feature, relation, member;
    var mapid, layerName;

    validation.begin = function(params) {
        mapid = params.mapId;
        layerName = params.name;
        //Add the UI elements
        var container = d3.select('#content')
            .append('div')
            .attr('id', 'validation-container')
            .classed('pin-bottom review-block unclickable validation-container', true)
            .append('div')
            .classed('validation col12 fillD pad1 space clickable', true)
            ;

        var meta = container.append('span')
            .attr('id', 'validation-meta')
            .classed('_icon info dark pad0y space', true);


        var buttons = [
            {
                id: 'next',
                text: 'Next',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('n'),
                action: function() { validation.getItem('forward'); }
            },
            {
                id: 'previous',
                text: 'Previous',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('p'),
                action: function() { validation.getItem('backward'); }
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
            keybinding.on(d.cmd, function() { d3.event.preventDefault(); d.action(); });
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
            .on('click', function (d) { //NOTE: Can maybe use _debounce here, instead of enabled attr
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
        context.hoot().control.view.on('layerRemove.validation', function () {
            context.hoot().control.view.on('layerRemove.validation', null);
            validation.end();
        });

        context.MapInMap.on('zoomPan.validation', function() {
            if (!context.MapInMap.hidden()) {
                //Populate the map-in-map with review items location and status
                Hoot.model.REST('ReviewGetGeoJson', mapid, context.MapInMap.extent(), function (gj) {
                    context.MapInMap.loadGeoJson(gj.features);
                });
            }
        });

        validation.end = function() {
            d3.select('#validation-container').remove();
            //Disable validation keybindings
            d3.keybinding('validation').off();
            d3.keybinding('choices').off();
            //Clear map-in-map
            context.MapInMap.loadGeoJson([]);
            context.MapInMap.on('zoomPan.validation', null);
        };

        validation.updateMeta = function(d) {
            meta.html('<strong class="review-note">' + 'Note: ' + d.tags['hoot:review:note'] + '<br>'
                + 'Validation items remaining: ' + d.unreviewedCount
                //+ '  (Verified: ' + (+d.totalCount - +d.unreviewedCount) + ')';
                + '</strong>');
        };

        validation.presentChoices = function() {
            //Separate out the choice tags
            var d = relation.tags;
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

            var choiceButtons = choices.map(function(b, i) {
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

            //Disable iD edit tool keybinding
            //NOTE: Not sure how to re-enable yet (F5 anyone?)
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
        validation.getItem('forward');
    };

    validation.getItem = function(direction) {
        Hoot.model.REST('ReviewGetStatistics', mapid, function (error, response) {
            //console.log(response);
            var metadata = response;
            var data = {
                mapId: mapid,
                direction: direction,
                sequence: -999
            };

            function loadFeature() {
                //Position the map
                var extent = relation.extent(context.graph());
                //console.log(extent);
                context.map().centerZoom(extent.center(), 19);

                //Get the relation member
                member = relation.memberByRole('reviewee');
                var fid = member.id;
                //Get the full feature
                feature = context.hasEntity(fid);

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
                _.extend(metadata, {tags: relation.tags});
                validation.updateMeta(metadata);

                validation.presentChoices();

                event.featureLoaded();
            }

            Hoot.model.REST('reviewGetNext', data, function (error, response) {
                //console.log(response);
                if (response.resultCount === 0) {
                    validation.end();
                    iD.ui.Alert('Validation complete', 'notice');
                } else if (response.resultCount === 1) {

                    //See if the validation relation has already been loaded in the map view
                    var rid = 'r' + response.relationId + '_' + mapid;
                    relation = context.hasEntity(rid);
                    if (relation) {
                        //console.log('already have relation');
                        loadFeature();
                    } else {
                        //console.log('must wait for relation to load');
                        context.loadEntity(rid, function(err, ent) {
                            relation = ent.data[0];
                            //Temp workaround to load member until https://github.com/ngageoint/hootenanny/issues/324
                            //is resolved.
                            var mid = relation.members[0].id;
                            feature = context.hasEntity(mid);
                            if (!feature) {
                                //console.log('must wait for feature to load');
                                context.loadEntity(mid, function() {
                                    loadFeature();
                                }, mapid, layerName);
                            } else {
                                loadFeature();
                            }
                        }, mapid, layerName);
                    }

                    if (!context.MapInMap.hidden()) {
                        //Populate the map-in-map with review items location and status
                        Hoot.model.REST('ReviewGetGeoJson', mapid, context.MapInMap.extent(), function (gj) {
                            context.MapInMap.loadGeoJson(gj.features);
                        });
                    }

                } else {
                    iD.ui.Alert(JSON.stringify(response), 'notice');
                }
            });
        });
    };

    //Update selectItem to work with the current feature
    validation.selectItem = function() {
        var extent = relation.extent(context.graph());
        context.map().centerZoom(extent.center(), 19);
        context.enter(iD.modes.Select(context, [feature.id]).suppressMenu(true));
    };

    validation.verify = function(choice) {
        //console.log(JSON.stringify(choice));

        var newTags = _.clone(feature.tags);
        //Add the validation tags from the users choice
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
        newTags = _.omit(newTags, function(v) {
            return v.match(/\${.*}/g);
        });
        //console.log(newTags);

        //Change tags
        context.perform(
           iD.actions.ChangeTags(feature.id, newTags), t('operations.change_tags.annotation')
        );

        //Remove the review relation
        context.perform(
            iD.actions.DeleteMember(relation.id, member.index), t('operations.delete_member.annotation')
        );
        context.perform(
            iD.actions.DeleteRelation(relation.id), t('operations.delete.annotation.relation')
        );

        //Save tag changes
        iD.modes.Save(context).save(context, function () {
            //Advance to next item
            validation.getItem('forward');
        });

    };

    return d3.rebind(validation, event, 'on');
};
