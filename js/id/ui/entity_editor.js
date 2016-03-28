iD.ui.EntityEditor = function(context) {
    var event = d3.dispatch('choose'),
        state = 'select',
        id,
        preset,
        reference;

    var presetEditor = iD.ui.preset(context)
        .on('change', changeTags);
    var rawTagEditor = iD.ui.RawTagEditor(context)
        .on('change', changeTags);
    
    var currentTranslation = 'OSM'; // default to OSM
    var currentMeta;
    var allTranslatedFields = [];
    var allTransTags;
    var noShowDefs;
    var plg;

    function entityEditor(selection) {
        var plugins = context.ui().plugins;
        plg = plugins.getEntityEditorPlugin(iD.data.hootConfig.pluginhost);


        var ltds = context.hoot().view.ltdstags;
        var appPane = d3.select('#app');
        if(appPane.classed('hidden') == true){
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
            .append('span')
            .attr('class', 'icon close');

        $enter.append('h3');

        // Update

        $header.select('h3')
            .text(t('inspector.edit') + ': ' + id);




        var ftypeWrap = $enter.append('div')
            .classed('fill-white small round', true)
            .style('margin-left', '20px')
            .style('margin-right', '30px')
            .style('margin-top', '2px')
            .html(function (field) {
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
        comboIntput.on('change', function(param){
            var filterType = d3.select('#entity_editor_presettranstype').value();
            currentTranslation = filterType;
            iD.util.setCurrentTranslation(currentTranslation);
            var currentData = _.find(comboData, function(d){
                return d.name === filterType;
            });

            currentMeta = currentData.meta;
            entityEditor(selection);

            if(!d3.select('#presettranstype').empty()){
                if(d3.select('#presettranstype').value()!=filterType){
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
            entityEditor(selection);
        }


        function populateBody(modPreset, defTags, defRawTags, transInfo, translatedFields, transTags){
            if(!d3.select('#entity_editor_presettranstype').empty()){
                currentTranslation = iD.util.getCurrentTranslation(); //d3.select('#entity_editor_presettranstype').value();             
            }

            if(translatedFields !== undefined){
                allTranslatedFields = translatedFields;
            }
            
            if(transTags !== undefined) {
                allTransTags = transTags;
            }
            
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

        if(currentTranslation == 'OSM') {
            populateBody(preset, tags, tags);
        } else {
            plg.translateEntity(context, entity, currentTranslation, tags, 
                preset, currentMeta, populateBody);            
        }

    }

    function clean(o) {
        var out = {}, k, v;
        /*jshint -W083 */
        for (k in o) {
            if (k && (v = o[k]) !== undefined) {
                out[k] = v.split(';').map(function(s) { return s.trim(); }).join(';');
            }
        }
        /*jshint +W083 */
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
                 context.hoot().control.conflicts.map.featurehighlighter
                 .highlightLayer(context.hoot().control.conflicts.activeEntity());
            }
        }
    }
    function changeTags(changed) {
        var entity = context.entity(id);
 
        // for all non OSM translation
        if(currentTranslation != 'OSM') {
            plg.updateEntityEditor(entity, changed, rawTagEditor, currentTranslation,
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
        entityEditor.preset(context.presets().match(context.entity(id), context.graph()));
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
