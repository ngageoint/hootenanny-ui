iD.ui.PresetList = function(context) {
    var event = d3.dispatch('choose'),
        id,
        currentPreset,
        autofocus = false;

    function presetList(selection) {
        var geometry = context.geometry(id),
            presets = context.presets().matchGeometry(geometry);

        selection.html('');

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        var message = messagewrap.append('h3')
            .text(t('inspector.choose'));

        if (context.entity(id).isUsed(context.graph())) {
            messagewrap.append('button')
                .attr('class', 'preset-choose')
                .on('click', function() { event.choose(currentPreset); })
                .append('span')
                //.attr('class', 'icon forward');
                .html('&#9658;');
        } else {
            messagewrap.append('button')
                .attr('class', 'close')
                .on('click', function() {
                    context.enter(iD.modes.Browse(context));
                })
                .call(iD.svg.Icon('#icon-close'));
                /*.append('span')
                .attr('class', 'icon close');*/
        }

        function keydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                 d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                iD.operations.Delete([id], context)();
            } else if (search.property('value').length === 0 &&
                (d3.event.ctrlKey || d3.event.metaKey) &&
                d3.event.keyCode === d3.keybinding.keyCodes.z) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.undo();
            } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
                d3.select(this).on('keydown', null);
            }
        }

        function keypress() {
            // enter
            var value = search.property('value');
            if (d3.event.keyCode === 13 && value.length) {
                list.selectAll('.preset-list-item:first-child').datum().choose();
            }
        }

        function createPresetFromTDS(schemaElem) {
            var newPreset = {};
            //newPreset.icon = 'highway-road';
            newPreset.geometry = schemaElem.geom.toLowerCase();
            newPreset.tags = {};
            newPreset['hoot:featuretype'] = schemaElem.desc;
            newPreset['hoot:transtype'] = filterType;
            newPreset['hoot:fcode'] = schemaElem.fcode;
            newPreset.name = schemaElem.desc + ' (' + schemaElem.fcode + ')';
            return iD.presets.Preset(filterType + '/' + schemaElem.fcode,
                newPreset, {});
        }
        function searchResHandler (value, results) {

            message.text(t('inspector.results', {
                n: results.collection.length,
                search: value
            }));
            list.call(drawList, results);
        }

        function inputevent() {
            var value = search.property('value');
            list.classed('filtered', value.length);
            if (value.length) {
                presets = context.presets().matchGeometry(geometry);

                var filterType = d3.select('#presettranstype').value();

                if(filterType === 'OSM') {
                    var results = presets.search(value, geometry);
                    searchResHandler(value, results);
                } else {
                    d3.xhr(window.location.protocol + '//' + window.location.hostname +
                        Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
                    '/schema?geometry='+ geometry + '&translation=' + filterType + '&searchstr=' +
                    value + '&maxlevdst=' + iD.data.hootConfig.presetMaxLevDistance +
                    '&limit=' + iD.data.hootConfig.presetMaxDisplayNum )
                    .get(function(error, resp){
                       if(!error){
                        var transSchema = JSON.parse(resp.responseText);
                        var newCollection = [];
                        _.each(transSchema, function(elem){

                            var fCode = elem.fcode;
                            var curPreset = _.find(context.presets().collection,
                                function(item){
                                    return item.id === filterType + '/' + fCode;
                                });

                            if(!curPreset){

                                var newPreset = createPresetFromTDS(elem);
                                newCollection.push(newPreset);
                            }

                        });


                        var res = iD.presets.Collection(_.unique(
                            newCollection
                        ));
                        searchResHandler(value, res);

                       }

                    });
                }


            } else {
                list.call(drawList, presets);
                message.text(t('inspector.choose'));
            }
        }

            var searchWrap = selection.append('div')
                .attr('class', 'search-header');

            var search = searchWrap.append('input')
                .attr('class', 'preset-search-input')
                .attr('placeholder', t('inspector.search'))
                .attr('type', 'search')
                .on('keydown', keydown)
                .on('keypress', keypress)
                .on('input', inputevent);

        searchWrap
            .call(iD.svg.Icon('#icon-search', 'pre-text'));

            if (autofocus) {
                search.node().focus();
            }



            var listWrap = selection.append('div')
                .attr('class', 'inspector-body fill-white');



            var ftypeWrap = listWrap.append('div')
                        .classed('fill-white small round', true)
                        .style('margin-left', '20px')
                        .style('margin-right', '20px')
                        .style('margin-top', '10px')
                        .html(function () {
                            return '<label class="pad1x pad0y strong fill-white round-top keyline-all">' + 'Filter By Type' + '</label>';
                        });

             var comboIntput = ftypeWrap.append('input')
                        .attr('id', 'presettranstype')
                        .attr('type', 'text')
                        .attr('value', iD.util.getCurrentTranslation());

            // Link this with plg.getTranslations();
            var comboData = ['OSM','TDSv61', 'TDSv40', 'MGCP'];
            var combo = d3.combobox()
                    .data(_.map(comboData, function (n) {
                        return {
                            value: n,
                            title: n
                        };
                    }));

            comboIntput.style('width', '100%')
                .call(combo);

            comboIntput.on('change', function(){
                var container = d3.select('#preset-list-container');
                container.selectAll('.preset-list-item').remove();
                presets = context.presets().defaults(geometry, 36);
                // Get the current translation filter type
                var filterType = d3.select('#presettranstype').value();
                var filteredCollection = getFilteredPresets(filterType, presets.collection);
                iD.util.setCurrentTranslation(filterType);
                // Replace with filtered
                presets.collection = filteredCollection;

                container.call(drawList, presets);

                if(!d3.select('#entity_editor_presettranstype').empty()){
                    if(d3.select('#entity_editor_presettranstype').value() !== filterType){
                        iD.util.changeComboValue('#entity_editor_presettranstype',filterType);
                    }
                }

                // Trigger search on input value
                search.trigger('input');
            });

        presets = context.presets().defaults(geometry, 36);
        // Get the current translation filter type
        var filterType = d3.select('#presettranstype').value();
        var filteredCollection = getFilteredPresets(filterType, presets.collection);
        // Replace with filtered
        presets.collection = filteredCollection;

        var list = listWrap.append('div')
            .attr('id', 'preset-list-container')
            .attr('class', 'preset-list fillL cf')
            .call(drawList, presets);
    }

    function getFilteredPresets(filterType, presets) {
        var filterRes = presets;
        // When OSM type get all that does not have hoot:transtype
        if(filterType === 'OSM') {
            filterRes = _.filter(presets, function(prs){
                if(prs === undefined){
                    return false;
                }
                return (!prs['hoot:transtype']);
            });
        } else {
            // If not OSM type then get ones with hoot:transtype and further filter

            filterRes = _.filter(presets, function(prs){
                return (prs['hoot:transtype'] && prs['hoot:transtype'] === filterType);
            });
        }

        return filterRes;
    }


    function drawList(list, presets) {
        var collection = presets.collection.map(function(preset) {
            return preset.members ? CategoryItem(preset) : PresetItem(preset);
        });

        var items = list.selectAll('.preset-list-item')
            .data(collection, function(d) { return d.preset.id; });

        items.enter().append('div')
            .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replace('/', '-'); })
            .classed('current', function(item) { return item.preset === currentPreset; })
            .each(function(item) {
                d3.select(this).call(item);
            })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        items.order();

        items.exit()
            .remove();
    }

    function CategoryItem(preset) {
        var box, sublist, shown = false;

        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap category col12');

            wrap.append('button')
                .attr('class', 'preset-list-button')
                .classed('expanded', false) //iD v1.9.2
                .call(iD.ui.PresetIcon()
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', function() {
                    //iD v1.9.2
                    var isExpanded = d3.select(this).classed('expanded');
                    var triangle = isExpanded ? '▶ ' :  '▼ ';
                    d3.select(this).classed('expanded', !isExpanded);
                    d3.select(this).selectAll('.label').text(triangle + preset.name());
                    item.choose();
                })
                .append('div')
                .attr('class', 'label')
                .text(function() {
                  return '▶ ' + preset.name(); //iD v1.9.2
                });

            box = selection.append('div')
                .attr('class', 'subgrid col12')
                .style('max-height', '0px')
                .style('opacity', 0);

            box.append('div')
                .attr('class', 'arrow');

            sublist = box.append('div')
                .attr('class', 'preset-list fillL3 cf fl');
        }

        item.choose = function() {
            if (!box || !sublist) return; //iD v1.9.2

            if (shown) {
                shown = false;
                box.transition()
                    .duration(200)
                    .style('opacity', '0')
                    .style('max-height', '0px')
                    .style('padding-bottom', '0px');
            } else {
                shown = true;
                sublist.call(drawList, preset.members);
                box.transition()
                    .duration(200)
                    .style('opacity', '1')
                    .style('max-height', 200 + preset.members.collection.length * 80 + 'px')
                    .style('padding-bottom', '20px');
            }
        };

        item.preset = preset;

        return item;
    }

    function PresetItem(preset) {
        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap col12');

            wrap.append('button')
                .attr('class', 'preset-list-button')
                .call(iD.ui.PresetIcon()
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            wrap.call(item.reference.button);
            selection.call(item.reference.body);
        }

        item.choose = function() {
            context.presets().choose(preset);

            var filterType = d3.select('#presettranstype').value();


            if(filterType === 'OSM') {

                context.perform(
                    iD.actions.ChangePreset(id, currentPreset, preset),
                    t('operations.change_tags.annotation'));

                event.choose(preset);

            } else {
                var data = {};
                data.fcode = preset['hoot:fcode'];
                // Get directly from object . Value from combo could be description
                data.translation = preset['hoot:transtype'];
                // set tags
                Hoot.model.REST('TDSToOSMByFCode', data, function (resp) {
                    if(resp){
                        var cnt = resp.responseText;
                        var osm = JSON.parse(cnt);
                        for(var key in osm.attrs){
                            preset.tags[key] = osm.attrs[key];
                        }

                        context.perform(
                            iD.actions.ChangePreset(id, currentPreset, preset),
                            t('operations.change_tags.annotation'));

                        event.choose(preset);

                    } else {
                        // error
                    }

                });
            }

        };

        item.help = function() {
            d3.event.stopPropagation();
            item.reference.toggle();
        };

        item.preset = preset;
        item.reference = iD.ui.TagReference(preset.reference(context.geometry(id)), context);

        return item;
    }

    presetList.autofocus = function(_) {
        if (!arguments.length) return autofocus;
        autofocus = _;
        return presetList;
    };

    presetList.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        presetList.preset(context.presets().match(context.entity(id), context.graph()));
        return presetList;
    };

    presetList.preset = function(_) {
        if (!arguments.length) return currentPreset;
        currentPreset = _;
        return presetList;
    };

    return d3.rebind(presetList, event, 'on');
};
