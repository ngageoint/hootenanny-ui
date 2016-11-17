iD.ui.EntityEditor = function(context) {
    var dispatch = d3.dispatch('choose'),
        state = 'select',
        coalesceChanges = false,
        modified = false,
        base,
        id,
        preset,
        reference;

    var presetEditor = iD.ui.preset(context)
        .on('change', changeTags);
    var rawTagEditor = iD.ui.RawTagEditor(context)
        .on('change', changeTags);

    function entityEditor(selection) {
        var entity = context.entity(id),
            tags = _.clone(entity.tags);

        var $header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var $enter = $header.enter().append('div')
            .attr('class', 'header fillL cf');

        $enter.append('button')
            .attr('class', 'fl preset-reset preset-choose')
            .append('span')
            .html('&#9668;');

        $enter.append('button')
            .attr('class', 'fr preset-close')
            .call(iD.svg.Icon(modified ? '#icon-apply' : '#icon-close'));

        $enter.append('h3');

        // Update
        $header.select('h3')
            .text(t('inspector.edit') + ': ' + id);

        $header.select('.preset-close')
            .on('click', function() {
                context.enter(iD.modes.Browse(context));
            });

        var $body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        $enter = $body.enter().append('div')
            .attr('class', 'inspector-body');

        var schemaSwitcher = iD.ui.SchemaSwitcher(context);
        $enter.append('div').call(schemaSwitcher, function() {
             //Do we need to translate tags?
            if (context.translationserver().activeTranslation() !== 'OSM') {
                entity = context.entity(context.selectedIDs()[0]);
                context.translationserver().translateEntity(entity, updateTags);
            } else {
                entity = context.entity(context.selectedIDs()[0]);
                updateTags(context.presets().match(entity, context.graph()), entity.tags);
            }
        });

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
                dispatch.choose(preset);
            });

        // Update
        $body.select('.preset-list-item button')
            .call(iD.ui.PresetIcon()
                .geometry(context.geometry(id))
                .preset(preset));

        //Do we need to translate tags?
        if (context.translationserver().activeTranslation() !== 'OSM' && !_.isEmpty(entity.tags)) {
            context.translationserver().translateEntity(entity, updateTags);
        } else {
            updateTags(preset, tags);
        }

    function updateTags(preset, tags) {
        $body.select('.preset-list-item .label')
            .text(preset.name());

        $body.select('.inspector-preset')
            .call(presetEditor
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .state(state));

        $body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .state(state));

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

        function historyChanged() {
            if (state === 'hide') return;

            var entity = context.hasEntity(id),
                graph = context.graph();
            if (!entity) return;

            entityEditor.preset(context.presets().match(entity, graph));
            entityEditor.modified(base !== graph);
            entityEditor(selection);
        }

    }

    function clean(o) {

        function cleanVal(k, v) {
            function keepSpaces(k) {
                var whitelist = ['opening_hours', 'service_times', 'collection_times',
                    'operating_times', 'smoking_hours', 'happy_hours'];
                return _.some(whitelist, function(s) { return k.indexOf(s) !== -1; });
            }

            var blacklist = ['description', 'note', 'fixme'];
            if (_.some(blacklist, function(s) { return k.indexOf(s) !== -1; })) return v;

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

            }

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

    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    function changeTagsCallback(changed, onInput) {
        var entity = context.entity(id),
            annotation = t('operations.change_tags.annotation'),
            tags = _.extend({}, entity.tags, changed);

        if (!onInput) {
            tags = clean(tags);
        }
        if (!_.isEqual(entity.tags, tags)) {
            var activeConflict = context.hoot().control.conflicts.activeConflict(0);
            if (coalesceChanges) {
                context.overwrite(iD.actions.ChangeTags(id, tags), annotation);
            } else {
                context.perform(iD.actions.ChangeTags(id, tags), annotation);
                coalesceChanges = !!onInput;
            }

            //This updates the review tag table
            if (activeConflict) {
                var reviewItem = context.entity(activeConflict),
                    reviewAgainstItem = context.entity(context.hoot().control.conflicts.activeConflict(1));
                if (entity.id === reviewItem.id || entity.id === reviewAgainstItem.id) {
                    context.hoot().control.conflicts.map.featurehighlighter
                        .highlightLayer(reviewItem,reviewAgainstItem, false);
                }
            }
        }
    }

    function changeTags(changed, onInput) {
        var translatedTags = rawTagEditor.tags();
        var entity = context.entity(id);
        //Do we need to translate tags?
        if (context.translationserver().activeTranslation() !== 'OSM' && !_.isEmpty(entity.tags)) {
            //Don't call translate on input events like keypress
            //wait til the field loses focus
            if (!onInput) {
                //some changeTags events fire even when tag hasn't changed
                if (d3.entries(changed).every(function(c) {
                    return d3.entries(translatedTags).some(function(d) {
                        return c.key === d.key && c.value === d.value;
                    });
                })) {
                    return; //return if no real change
                }

                //deleted tags are represented as undefined
                //remove these before translating
                var translatedEntity = entity.copy(context.graph(), []);
                translatedEntity.tags = d3.entries(_.assign(translatedTags, changed)).reduce(function(tags, tag) {
                    if (tag.value !== undefined) tags[tag.key] = tag.value;
                    return tags;
                }, {});
                context.translationserver().translateToOsm(entity.tags, translatedEntity, onInput, changeTagsCallback);
            }
        } else {
            changeTagsCallback(changed, onInput);
        }

    }

    entityEditor.modified = function(_) {
        if (!arguments.length) return modified;
        modified = _;
        d3.selectAll('button.preset-close use')
            .attr('xlink:href', (modified ? '#icon-apply' : '#icon-close'));
    };

    entityEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return entityEditor;
    };

    entityEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        base = context.graph();
        entityEditor.preset(context.presets().match(context.entity(id), base));
        entityEditor.modified(false);
        coalesceChanges = false;
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

    return d3.rebind(entityEditor, dispatch, 'on');
};
