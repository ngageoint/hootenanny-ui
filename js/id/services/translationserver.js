iD.translationserver = function(context) {
    var translationserver = {},
        event = d3.dispatch('activeTranslationChange'),
        availableTranslations,
        defaultTranslation = 'OSM',
        activeTranslation = defaultTranslation,
        previousTranslation,
        activeSchema;

    function formatNodeJsPortOrPath(p) {
        if (isNaN(p)) {
            return '/' + p;
        } else {
            return ':' + p;
        }
    }

    function tagXmlToJson(xml) {
        var tags = [].map.call(xml.querySelectorAll('tag'), function(tag) {
            return {
                k: tag.getAttribute('k'),
                v: tag.getAttribute('v')
            };
        }).reduce(function(prev, curr) {
            prev[curr.k] = curr.v;
            return prev;
        }, {});

        return tags;
    }

    function schemaToPreset(schema) {
        var id = activeTranslation + '/' + schema.fcode;
        var fields = schema.columns.map(function(d) {
            var placeholder = d.defValue;
            if (d.enumerations) {
                var defs = d.enumerations.filter(function(e) {
                    return e.value === d.defValue;
                });
                if (defs.length === 1) {
                    placeholder = defs[0].name;
                }
            }
            var f = {
                key: d.name,
                id: activeTranslation + '/' + d.name,
                overrideLabel: d.desc,
                placeholder: placeholder,
                show: false
            };

            if (d.type === 'String') {
                f.type = 'text';
            } else if (d.type === 'enumeration') {
                //check if enumeration should use a checkbox
                if (d.enumerations.some(function(e) {
                    return (e.value === '1000' && e.name === 'False');
                })) {
                    f.type = 'check';
                } else {
                    f.type = 'combo';
                }
                f.strings = {options: d.enumerations.reduce(function(prev, curr) {
                    prev[curr.value] = curr.name;
                    return prev;
                }, {})};
            } else {
                f.type = 'number';
            }

            return f;
        });
        var preset = {
                        geometry: schema.geom.toLowerCase(),
                        tags: {},
                        'hoot:featuretype': schema.desc,
                        'hoot:tagschema': activeTranslation,
                        'hoot:fcode': schema.fcode,
                        name: schema.desc + ' (' + schema.fcode + ')',
                        fields: fields.map(function(f) {
                            return f.id;
                        })
                    };
        //Turn the array of fields into a map
        var fieldsMap = fields.reduce(function(prev, curr) {
            prev[curr.id] = iD.presets.Field(curr.id, curr);
            return prev;
        }, {});
        return iD.presets.Preset(id, preset, fieldsMap);
    }

    if (!iD.debug) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) + '/capabilities')
            .get(function(error, json) {
                if (error) {
                    window.console.error(error);
                } else {
                    availableTranslations = [defaultTranslation].concat(Object.keys(json));
                }
            });
    }

    translationserver.availableTranslations = function() {
        return availableTranslations;
    };

    translationserver.defaultTranslation = function() {
        return defaultTranslation;
    };

    translationserver.activeTranslation = function(_) {
        if (!arguments.length) return activeTranslation;
        previousTranslation = activeTranslation;
        activeTranslation = _;
        event.activeTranslationChange();
        return translationserver;
    };

    translationserver.searchTranslatedSchema = function(value, geometry, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
            '/schema?geometry='+ geometry + '&translation=' + activeTranslation + '&searchstr=' +
            value + '&maxlevdst=' + iD.data.hootConfig.presetMaxLevDistance +
            '&limit=' + iD.data.hootConfig.presetMaxDisplayNum, function(error, data) {
                if (error) {
                    window.console.error(error);
                } else {
                    callback(data);
                }
            });
    };

    translationserver.filterSchemaKeys = function(value) {
        return activeSchema.columns.filter(function(d) {
            return d.name.startsWith(value.toUpperCase());
        }).map(function(d) {
            return {
                title: d.desc,
                value: d.name
            };
        });
    };

    translationserver.filterSchemaValues = function(value) {
        var values = [];
        var columns = activeSchema.columns.filter(function(d) {
            return d.name === value.toUpperCase();
        });
        if (columns.length === 1) {
            if (columns[0].enumerations) {
                values = columns[0].enumerations.map(function(d) {
                    return {
                        title: d.name,
                        value: d.value
                    };
                });
            }
        }
        return values;
    };

    translationserver.translateEntity = function(entity, callback) {
        //1. Turn osm xml into a coded tags
        var osmXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(entity.asJXON()) + '</osm>';
        d3.xml(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
            '/translateTo?translation=' + activeTranslation)
        .post(osmXml, function (error, translatedXml) {
            if (error) {
                window.console.error(error);
            } else {
                var tags = tagXmlToJson(translatedXml);
                //If there is an error tag or no fcode, show the alert, change schema back to OSM
                if (tags.error || (!tags.FCODE && !tags.F_CODE)) {
                    translationserver.activeTranslation(previousTranslation);
                    iD.ui.Alert(tags.error || 'Feature out of spec, unable to translate', 'warning', new Error().stack);
                    return;
                }

                //2. Use schema for fcode to generate a preset
                //check for existing preset
                var preset = context.presets().item(activeTranslation + '/' + (tags.FCODE || tags.F_CODE));
                if (preset) {
                    callback(preset, tags);
                } else { //if not found generate from translation server
                    d3.json(window.location.protocol + '//' + window.location.hostname +
                        formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
                        '/translateTo?idelem=fcode&idval=' + (tags.FCODE || tags.F_CODE) +
                        '&geom=' + context.geometry(entity.id).replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) //toProperCase
                         + '&translation=' + activeTranslation,
                        function(error, schema) {
                            activeSchema = schema;
                            var preset = schemaToPreset(schema);
                            //Add the populated translated preset
                            context.presets().collection.push(preset);
                            callback(preset, tags);
                        }
                    );
                }
            }
        });
    };

    translationserver.addTagsForFcode = function(preset, callback) {
        d3.json(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
            '/translateFrom?translation=' + activeTranslation + '&fcode=' + preset['hoot:fcode'],
            function(error, data) {
                if (error) {
                    window.console.error(error);
                } else {
                    preset.tags = data.attrs;
                    callback(iD.presets.Preset(preset.id, preset, {}));
                }
            });
    };

    translationserver.translateToOsm = function(tags, translatedEntity, onInput, callback) {
        //Turn translated tag xml into a osm tags
        var translatedXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(translatedEntity.asJXON()) + '</osm>';
        d3.xml(window.location.protocol + '//' + window.location.hostname +
            formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
            '/translateFrom?translation=' + activeTranslation)
        .post(translatedXml, function (error, osmXml) {
            if (error) {
                window.console.error(error);
            } else {
                var osmTags = tagXmlToJson(osmXml);
                var changed = d3.entries(osmTags).reduce(function(diff, pair) {
                    if (tags[pair.key]) {
                        if (tags[pair.key] !== pair.value) { //tag is changed
                            diff[pair.key] = pair.value;
                        }
                    } else { //tag is added
                        diff[pair.key] = pair.value;
                    }
                    return diff;
                }, {});
                //remove existing tags not in translated response
                d3.entries(tags).forEach(function(t) {
                    if (osmTags[t.key] === undefined) {
                        changed[t.key] = undefined; //tag is removed
                    }
                });
                callback(changed, onInput);
            }
        });
    };

    return d3.rebind(translationserver, event, 'on');
};
