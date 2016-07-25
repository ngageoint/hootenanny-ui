iD.ui.EntityEditor = function(context) {
    var event = d3.dispatch('choose'),
        state = 'select',
        id,
        preset,
        reference,
		/* Added for iD v1.9.2 */
        //coalesceChanges = false,
        modified = false,
        base;

    var presetEditor = iD.ui.preset(context)
        .on('change', changeTags);
    var rawTagEditor = iD.ui.RawTagEditor(context)
        .on('change', changeTags);

    var currentTranslation = 'OSM'; // default to OSM
    var currentMeta;
    // eslint never used
    // var allTranslatedFields = [];
    // var allTransTags;
    // var noShowDefs;
    var plg;

    function entityEditor(selection) {
        var plugins = context.ui().plugins;
        plg = plugins.getEntityEditorPlugin(iD.data.hootConfig.pluginhost);


        // var ltds = context.hoot().view.ltdstags;
        var appPane = d3.select('#app');
        if(appPane.classed('hidden') === true){
            appPane.classed('hidden', false);
        }


        var entity = context.entity(id),
            tags = _.clone(entity.tags);

        var $header = selection.selectAll('.header')
            .data([0]);

        // Enter

        var $enter = $header.enter().append('div')
            .attr('class', 'header fillL cf');


        $enter.append('button')
            .attr('class', 'fr preset-close')
            .call(iD.svg.Icon(modified ? '#icon-apply' : '#icon-close'));

        $enter.append('h3');

        // Update
        $header.select('h3')
            .text(t('inspector.edit') + ': ' + id);




        var ftypeWrap = $enter.append('div')
            .classed('fill-white small round', true)
            .style('margin-left', '20px')
            .style('margin-right', '30px')
            .style('margin-top', '2px')
            .html(function () {
                return '<label class="form-label">' + 'Filter By Type' + '</label>';
            });

        currentTranslation = iD.util.getCurrentTranslation();
         var comboIntput = ftypeWrap.append('input')
                    .attr('id', 'entity_editor_presettranstype')
                    .attr('type', 'text')
                    .attr('value', currentTranslation);

        var comboData = plg.getTranslations();
        var combo = d3.combobox()
                .data(_.map(comboData, function (n) {
                    return {
                        value: n.name,
                        title: n.name
                    };
                }));

        comboIntput.style('width', '100%')
            .call(combo);

        // When translation combo value change then we get the translation filter
        // and rerun entity Editor
        comboIntput.on('change', function(){
            var filterType = d3.select('#entity_editor_presettranstype').value();
            currentTranslation = filterType;
            iD.util.setCurrentTranslation(currentTranslation);
            var currentData = _.find(comboData, function(d){
                return d.name === filterType;
            });

            currentMeta = currentData.meta;
            entityEditor(selection);

            if(!d3.select('#presettranstype').empty()){
                if(d3.select('#presettranstype').value() !== filterType){
                    iD.util.changeComboValue('#presettranstype',filterType);
                }
            }
        });


        $header.select('.preset-close')
            .on('click', function() {
                context.enter(iD.modes.Browse(context));
            });

        var $body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter

        $enter = $body.enter().append('div')
            .attr('class', 'inspector-body');

        $enter.append('div')
            .attr('class', 'preset-list-item inspector-inner')
            .append('div')
            .attr('class', 'preset-list-button-wrap')
            .append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(bootstrap.tooltip()
                .title(t('inspector.back_tooltip'))
                .placement('bottom'))
            .append('div')
            .attr('class', 'label');

        $body.select('.preset-list-button-wrap')
            .call(reference.button);

        $body.select('.preset-list-item')
            .call(reference.body);

        $enter.append('div')
            .attr('class', 'inspector-border inspector-preset');

        $enter.append('div')
            .attr('class', 'inspector-border raw-tag-editor inspector-inner');

        $enter.append('div')
            .attr('class', 'inspector-border raw-member-editor inspector-inner');

        $enter.append('div')
            .attr('class', 'raw-membership-editor inspector-inner');

        selection.selectAll('.preset-reset')
            .on('click', function() {
                event.choose(preset);
            });

        // Update

        $body.select('.preset-list-item button')
            .call(iD.ui.PresetIcon()
                .geometry(context.geometry(id))
                .preset(preset));

        $body.select('.preset-list-item .label')
            .text(preset.name());


        function historyChanged() {
            if (state === 'hide') return;
            var entity = context.hasEntity(id);
            if (!entity) return;
            entityEditor.preset(context.presets().match(entity, context.graph()));
            entityEditor.modified(base !== context.graph());
            entityEditor(selection);
        }


        function populateBody(modPreset, defTags, defRawTags, transInfo /*, translatedFields , transTags*/){
            if(!d3.select('#entity_editor_presettranstype').empty()){
                currentTranslation = iD.util.getCurrentTranslation(); //d3.select('#entity_editor_presettranstype').value();
            }

            // eslint never used
            // if(translatedFields !== undefined){
            //     allTranslatedFields = translatedFields;
            // }

            // if(transTags !== undefined) {
            //     allTransTags = transTags;
            // }

            $body.select('.inspector-preset')
                .call(presetEditor
                    .preset(modPreset)
                    .entityID(id)
                    .tags(defTags)
                    .state(state));

            $body.select('.raw-tag-editor')
                .call(rawTagEditor
                    .preset(modPreset)
                    .entityID(id)
                    .tags(defRawTags)
                    .state(state)
                    .entityTranslation(transInfo));

            if (entity.type === 'relation') {
                $body.select('.raw-member-editor')
                    .style('display', 'block')
                    .call(iD.ui.RawMemberEditor(context)
                        .entityID(id));
            } else {
                $body.select('.raw-member-editor')
                    .style('display', 'none');
            }

            $body.select('.raw-membership-editor')
                .call(iD.ui.RawMembershipEditor(context)
                    .entityID(id));


            context.history()
                .on('change.entity-editor', historyChanged);
        }

        if(currentTranslation === 'OSM') {
            populateBody(preset, tags, tags);
        } else {
            plg.translateEntity(context, entity, currentTranslation, tags,
                preset, currentMeta, populateBody);
        }

    }

    function clean(o) {

        function cleanVal(k, v) {
            function keepSpaces(k) {
                var whitelist = ['opening_hours', 'service_times', 'collection_times',
                    'operating_times', 'smoking_hours', 'happy_hours'];
                return _.any(whitelist, function(s) { return k.indexOf(s) !== -1; });
            }

            var blacklist = ['description', 'note', 'fixme'];
            if (_.any(blacklist, function(s) { return k.indexOf(s) !== -1; })) return v;

            var cleaned = v.split(';')
                .map(function(s) { return s.trim(); })
                .join(keepSpaces(k) ? '; ' : ';');

            // The code below is not intended to validate websites and emails.
            // It is only intended to prevent obvious copy-paste errors. (#2323)

            // clean website- and email-like tags
            if (k.indexOf('website') !== -1 ||
                k.indexOf('email') !== -1 ||
                cleaned.indexOf('http') === 0) {
                cleaned = cleaned
                    .replace(/[\u200B-\u200F\uFEFF]/g, '');  // strip LRM and other zero width chars

            // clean email-like tags
            } /*else if (k.indexOf('email') !== -1) {
                cleaned = cleaned
                    .replace(/[\u200B-\u200F\uFEFF]/g, '')  // strip LRM and other zero width chars
                    .replace(/[^\w\+\-\.\/\?\|~!@#$%^&*'`{};=]/g, '');  // note: ';' allowed as OSM delimiter
            }*/

            return cleaned;
        }

        var out = {}, k, v;
        for (k in o) {
            if (k && (v = o[k]) !== undefined) {
                out[k] = cleanVal(k, v);
            }
        }
        return out;
    }

    function changeTagsHandler(changed) {
        var entity = context.entity(id);
        var tags = clean(_.extend({}, entity.tags, changed));
        if (!_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(id, tags),
                t('operations.change_tags.annotation'));
            var activeConflict = context.hoot().control.conflicts.activeConflict(0);
            if(activeConflict){
                var reviewItem = context.entity(activeConflict),
                    reviewAgainstItem = context.entity(context.hoot().control.conflicts.activeConflict(1));
                if (entity.id === reviewItem.id || entity.id === reviewAgainstItem.id) {
                    context.hoot().control.conflicts.map.featurehighlighter
                        .highlightLayer(reviewItem,reviewAgainstItem,false);
                }
            }
        }
    }
    function changeTags(changed) {
        var entity = context.entity(id);

        // for all non OSM translation
        if(currentTranslation !== 'OSM') {
            plg.updateEntityEditor(context.graph(), entity, changed, rawTagEditor, currentTranslation,
            function(OSMEntities){
                           // store to internal
                //entity.tags = {};
                changeTagsHandler(OSMEntities);

            });


        } else {
            changeTagsHandler(changed);
        }


    }
    entityEditor.changeTags = function(changed, id){
        var entity = context.entity(id),
        tags = clean(_.extend({}, entity.tags, changed));
        if (!_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(id, tags),
                t('operations.change_tags.annotation'));
        }
    };

    entityEditor.modified = function(_) {
        if (!arguments.length) return modified;
        modified = _;
        d3.selectAll('button.preset-close use')
            .attr('xlink:href', (modified ? '#icon-apply' : '#icon-close'));
    };

    entityEditor.removeTags = function(changed, id){
        var entity = context.entity(id),
        tags = clean(changed);
        if (!_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(id, tags),
                t('operations.change_tags.annotation'));
        }
    };

    entityEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return entityEditor;
    };

    entityEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
		//added in iD v1.9.2
		base = context.graph();
        entityEditor.preset(context.presets().match(context.entity(id), base));
        entityEditor.modified(false);
        //coalesceChanges = false;
        return entityEditor;
    };

    entityEditor.preset = function(_) {
        if (!arguments.length) return preset;
        if (_ !== preset) {
            preset = _;
            reference = iD.ui.TagReference(preset.reference(context.geometry(id)), context)
                .showing(false);
        }
        return entityEditor;
    };

    return d3.rebind(entityEditor, event, 'on');
};
