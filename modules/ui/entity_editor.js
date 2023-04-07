import _clone from 'lodash-es/clone';
import _isEmpty from 'lodash-es/isEmpty';
import _isEqual from 'lodash-es/isEqual';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import deepEqual from 'fast-deep-equal';

import { presetManager } from '../presets';
import { t, localizer } from '../core/localizer';
import { actionChangeTags } from '../actions/change_tags';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { utilArrayIdentical } from '../util/array';
import { utilCleanTags, utilCombinedTags, utilRebind } from '../util';

import { uiSectionEntityIssues } from './sections/entity_issues';
import { uiSectionFeatureType } from './sections/feature_type';
import { uiSectionPresetFields } from './sections/preset_fields';
import { uiSectionRawMemberEditor } from './sections/raw_member_editor';
import { uiSectionRawMembershipEditor } from './sections/raw_membership_editor';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';
import { uiSectionSelectionList } from './sections/selection_list';

export function uiEntityEditor(context) {
    var dispatch = d3_dispatch('choose');
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityIDs;
    var _activePresets = [];
    var _newFeature;

    var _translatedTags, _translatedPreset;
    var debouncedTranslateTo = _debounce(function(entity, hoot, updateTags) {
        addSchemaLoading();
        hoot.translations.translateEntity(entity)
            .then(data => updateTags(data.preset, data.tags));
        }, 500);
    var debouncedTranslateFrom = _debounce(function(osmTags, entity, onInput, updateTags){
        addSchemaLoading();
        Hoot.translations.translateToOsm(osmTags, entity, onInput)
            .then(osmTags => updateTags(osmTags, onInput));
        }, 500);

    function addSchemaLoading() {
        d3_selectAll('.tag-schema').selectAll('div.schema-loading')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'schema-loading');
    }

    var _sections;

    function entityEditor(selection) {

        var combinedTags = utilCombinedTags(_entityIDs, context.graph());

        // Header
        var header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        var direction = (localizer.textDirection() === 'rtl') ? 'forward' : 'backward';

        headerEnter
            .append('button')
            .attr('class', 'preset-reset preset-choose')
            .attr('title', t('inspector.back_tooltip'))
            .call(svgIcon(`#iD-icon-${direction}`));

        headerEnter
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.close'))
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon(_modified ? '#iD-icon-apply' : '#iD-icon-close'));

        headerEnter
            .append('h2');

        // Update
        header = header
            .merge(headerEnter);

        header.selectAll('h2')
            .text('')
            .call(_entityIDs.length === 1 ? t.append('inspector.edit') : t.append('inspector.edit_features'));

        header.selectAll('.preset-reset')
            .on('click', function() {
                dispatch.call('choose', this, _activePresets);
            });

        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        var bodyEnter = body.enter()
            .append('div')
            .attr('class', 'entity-editor inspector-body sep-top');

        // Update
        body = body
            .merge(bodyEnter);

        if (!_sections) {
            _presetFields = uiSectionPresetFields(context);
            _rawTagEditor = uiSectionRawTagEditor('raw-tag-editor', context);
            _sections = [
                uiSectionSchemaSwitcher(context, function() {
                  //Do we need to translate tags?
                  let entity = context.entity(context.selectedIDs()[0]);
                  if (hoot.activeTranslation() !== 'OSM') {
                      d3_selectAll('.tag-schema').append('div').attr('class', 'schema-loading');
                      debouncedTranslateTo(context, entity, hoot, updateTags);
                  } else {
                      updateTags(presetManager.match(entity, context.graph()), entity.tags);
                  }
                }),
                uiSectionSelectionList(context),
                uiSectionFeatureType(context).on('choose', function(presets) {
                    dispatch.call('choose', this, presets);
                }),
                uiSectionEntityIssues(context),
                _presetFields.on('change', changeTags).on('revert', revertTags),
                _rawTagEditor.on('change', changeTags),
                uiSectionCoordinateEditor(context).on('change', changeCoords),
                uiSectionRawMemberEditor(context),
                uiSectionRawMembershipEditor(context)
            ];
        }

        _sections.forEach(function(section) {
            if (section.entityIDs) {
                section.entityIDs(_entityIDs);
            }
            if (section.presets) {
                section.presets(_activePresets);
            }
            if (section.tags) {
                section.tags(combinedTags);
            }
            if (section.state) {
                section.state(_state);
            }
            body.call(section.render);
        });

        context.history()
            .on('change.entity-editor', historyChanged);

        let entity = context.entity(_entityIDs[0]), numTags = Object.keys(entity.tags).length;
        if (Hoot.translations.activeTranslation !== 'OSM' && 0 < numTags
            && !(numTags === 1 && entity.tags.area === 'yes')
        ) {
            debouncedTranslateTo(context, entity, hoot, updateTags);
        } else {
            var preset = _activePresets[0].id !== (Hoot.translations.activeTranslation + '/' + context.entity(_entityIDs[0]).geometry(context.graph()))
                ? presetManager.match(entity, context.graph())
                : _activePresets[0];

            updateTags(preset, entity.tags);
        }

        function historyChanged(difference) {
            if (selection.selectAll('.entity-editor').empty()) return;
            if (_state === 'hide') return;
            var significant = !difference ||
                    difference.didChange.properties ||
                    difference.didChange.addition ||
                    difference.didChange.deletion;
            if (!significant) return;

            _entityIDs = _entityIDs.filter(context.hasEntity);
            if (!_entityIDs.length) return;

            var priorActivePreset = _activePresets.length === 1 && _activePresets[0];

            loadActivePresets();

            var graph = context.graph();
            entityEditor.modified(_base !== graph);
            entityEditor(selection);

            if (priorActivePreset && _activePresets.length === 1 && priorActivePreset !== _activePresets[0]) {
                // flash the button to indicate the preset changed
                context.container().selectAll('.entity-editor button.preset-reset .label')
                    .style('background-color', '#fff')
                    .transition()
                    .duration(750)
                    .style('background-color', null);
            }
        }

        function updateTags(preset, tags) {
          if (!preset) preset = _activePresets[0];
          if (!tags) tags = {};
          if (preset && tags) {
              if (hoot.activeTranslation() !== 'OSM') {
                  if (hoot.activeMapRules()) context.validator().validateEntities(_entityIDs);
                  tags = _translatedTags = hoot.interestingTags(tags);
                  _translatedPreset = preset;
                  // show asymmetric translation warning if any
                  let oldPreset = hoot.checkFcodeChange();
                  if (oldPreset) {
                      hoot.checkFcodeChange(false);
                      alert('Feature Code ' + oldPreset.name()
                          + ' has been changed to ' + preset.name() + ' during translation.');
                  }
              }
              body.select('.preset-list-item .label')
                  .text(preset.name());

              body.call(
                _presetFields
                  .presets([preset])
                  .entityIDs(_entityIDs)
                  .tags(tags)
                  .state(_state)
                  .disclosureExpanded(true)
                  .render
              );

              body.call(
                _rawTagEditor
                  .presets([preset])
                  .entityIDs(_entityIDs)
                  .tags(tags)
                  .state(_state)
                  .render
              );

              // if (entity.type === 'relation') {
              //     body.select('.raw-member-editor')
              //         .style('display', 'block')
              //         .call(uiRawMembershipEditor(context)
              //             .entityID(_entityIDs[0]));
              // } else {
              //     body.select('.raw-member-editor')
              //         .style('display', 'none');
              // }

              // body.select('.raw-membership-editor')
              //     .call(uiRawMembershipEditor(context)
              //         .entityID(_entityIDs[0]));

              context.history()
                  .on('change.entity-editor', historyChanged);
          }
          d3_selectAll('.schema-loading').remove();
        }
    }

    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    // Use explicit entityIDs in case the selection changes before the event is fired.
    function changeTags(entityIDs, changed, onInput) {

        var actions = [];
        for (var i in entityIDs) {
            var entityID = entityIDs[i];
            var entity = context.entity(entityID);

            var tags = Object.assign({}, entity.tags);   // shallow copy

            if (typeof changed === 'function') {
                // a complex callback tag change
                tags = changed(tags);
            } else {
                for (var k in changed) {
                    if (!k) continue;
                    var v = changed[k];
                    if (typeof v === 'object') {
                        // a "key only" tag change
                        tags[k] = tags[v.oldKey];
                    } else if (v !== undefined || tags.hasOwnProperty(k)) {
                        tags[k] = v;
                    }
                }
            }

            if (!onInput) {
                tags = utilCleanTags(tags);
            }

            if (!deepEqual(entity.tags, tags)) {
                actions.push(actionChangeTags(entityID, tags));
            }
        }

        if (actions.length) {
            var combinedAction = function(graph) {
                actions.forEach(function(action) {
                    graph = action(graph);
                });
                return graph;
            };

            var annotation = t('operations.change_tags.annotation');

            if (_coalesceChanges) {
                context.overwrite(combinedAction, annotation);
            } else {
                context.perform(combinedAction, annotation);
                _coalesceChanges = !!onInput;
            }
        }

        // if leaving field (blur event), rerun validation
        if (!onInput) {
            context.validator().validate();
        }
    }

    function changeTagsCallback(entityIDs, changed, onInput) {
        var actions = [];
        for (var i in entityIDs) {
            var entityID = entityIDs[i];
            var entity = context.entity(entityID);

            var tags = Object.assign({}, entity.tags);   // shallow copy

            for (var k in changed) {
                if (!k) continue;
                var v = changed[k];
                if (typeof v === 'object') {
                    // a "key only" tag change
                    tags[k] = tags[v.oldKey];
                } else if (v !== undefined || tags.hasOwnProperty(k)) {
                    tags[k] = v;
                }
            }

            if (!onInput) {
                tags = utilCleanTags(tags);
            }

            if (!deepEqual(entity.tags, tags)) {
                actions.push(actionChangeTags(entityID, tags));
            }
        }

        if (actions.length) {
            var combinedAction = function(graph) {
                actions.forEach(function(action) {
                    graph = action(graph);
                });
                return graph;
            };

            var annotation = t('operations.change_tags.annotation');

            if (_coalesceChanges) {
                context.overwrite(combinedAction, annotation);
            } else {
                context.perform(combinedAction, annotation);
                _coalesceChanges = !!onInput;
            }
        }

        // if leaving field (blur event), rerun validation
        if (!onInput) {
            context.validator().validate();
        }
    }

    function changeTags(entityIDs, changed, onInput) {
        var translatedTags = _rawTagEditor.tags();
        for (var i in entityIDs) {
            var entityID = entityIDs[i];
            var entity = context.entity(entityID);


            //Do we need to translate tags?
            //This will need to bulk translate now that change tags takes mulitiple entities
            if (Hoot.translations.activeTranslation !== 'OSM') {
                //Don't call translate on input events like keypress
                //wait til the field loses focus
                if (!onInput) {
                    //bug https://github.com/DigitalGlobe/mapedit-id/issues/210
                    //tags are osm so there is no FCODE
                    if (!translatedTags[Hoot.translations.fcode()]) {
                        if (Object.keys(entity.tags).length && !Hoot.translations.needsFcode(entity.tags)) {
                            return;
                        } else if (changed.hasOwnProperty(_activePresets[0].id + '/' + Hoot.translations.fcode())) {
                            translatedTags[Hoot.translations.fcode()] = changed[_activePresets[0].id + '/' + Hoot.translations.fcode()];
                        }
                    }
                    //some change events fire even when tag hasn't changed
                    if (Object.entries(changed).every(function(c) {
                        return Object.entries(translatedTags).some(function(d) {
                            return (c[0] === d[0] && c[1] === d[1]);
                        });
                    })) {
                        return;
                    }

                    //if the key is changed, but the change tag doesn't exist
                    if (Object.entries(changed).every(function(c) {
                        return !translatedTags[c[0]] && (c[1] === undefined || c[1] === '');
                    })) {
                        return;
                    }

                    //deleted tags are represented as undefined
                    //remove these before translating
                    var translatedEntity = entity.copy(context.graph(), []);
                    translatedEntity.tags = Object.entries(Object.assign(translatedTags, changed)).reduce(function(tags, tag) {
                        if (tag[1] !== undefined) tags[tag[0]] = tag[1];
                        return tags;
                    }, {});

                    translatedEntity.id = entity.id;
                    debouncedTranslateFrom(entity.tags, translatedEntity, onInput, changeTagsCallback);
                }
            } else {
                changeTagsCallback(_entityIDs, changed, onInput);
            }
        }

        // if leaving field (blur event), rerun validation
        if (!onInput) {
            context.validator().validate();
        }
    }

    function revertTags(keys) {

        var actions = [];
        for (var i in _entityIDs) {
            var entityID = _entityIDs[i];

            var original = context.graph().base().entities[entityID];
            var changed = {};
            for (var j in keys) {
                var key = keys[j];
                changed[key] = original ? original.tags[key] : undefined;
            }

            var entity = context.entity(entityID);
            var tags = Object.assign({}, entity.tags);   // shallow copy

            for (var k in changed) {
                if (!k) continue;
                var v = changed[k];
                if (v !== undefined || tags.hasOwnProperty(k)) {
                    tags[k] = v;
                }
            }


            tags = utilCleanTags(tags);

            if (!deepEqual(entity.tags, tags)) {
                actions.push(actionChangeTags(entityID, tags));
            }

        }

        if (actions.length) {
            var combinedAction = function(graph) {
                actions.forEach(function(action) {
                    graph = action(graph);
                });
                return graph;
            };

            var annotation = t('operations.change_tags.annotation');

            if (_coalesceChanges) {
                context.overwrite(combinedAction, annotation);
            } else {
                context.perform(combinedAction, annotation);
                _coalesceChanges = false;
            }
        }

        context.validator().validate();
    }


    entityEditor.modified = function(val) {
        if (!arguments.length) return _modified;
        _modified = val;
        return entityEditor;
    };


    entityEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return entityEditor;
    };


    entityEditor.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;

        // always reload these even if the entityIDs are unchanged, since we
        // could be reselecting after something like dragging a node
        _base = context.graph();
        _coalesceChanges = false;

        if (val && _entityIDs && utilArrayIdentical(_entityIDs, val)) return entityEditor;  // exit early if no change

        _entityIDs = val;

        loadActivePresets(true);

        return entityEditor
            .modified(false);
    };


    entityEditor.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return entityEditor;
    };


    function loadActivePresets(isForNewSelection) {

        var graph = context.graph();

        var counts = {};

        for (var i in _entityIDs) {
            var entity = graph.hasEntity(_entityIDs[i]);
            if (!entity) return;

            var match = presetManager.match(entity, graph);

            if (!counts[match.id]) counts[match.id] = 0;
            counts[match.id] += 1;
        }

        var matches = Object.keys(counts).sort(function(p1, p2) {
            return counts[p2] - counts[p1];
        }).map(function(pID) {
            return presetManager.item(pID);
        });

        if (!isForNewSelection) {
            // A "weak" preset doesn't set any tags. (e.g. "Address")
            var weakPreset = _activePresets.length === 1 &&
                !_activePresets[0].isFallback() &&
                Object.keys(_activePresets[0].addTags || {}).length === 0;
            // Don't replace a weak preset with a fallback preset (e.g. "Point")
            if (weakPreset && matches.length === 1 && matches[0].isFallback()) return;
        }

        entityEditor.presets(matches);
    }

    entityEditor.presets = function(val) {
        if (!arguments.length) return _activePresets;

        // don't reload the same preset
        if (!utilArrayIdentical(val, _activePresets)) {
            _activePresets = val;
        }
        return entityEditor;
    };

    return utilRebind(entityEditor, dispatch, 'on');
}
