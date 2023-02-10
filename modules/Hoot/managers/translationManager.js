/*******************************************************************************************************
 * File: translationManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/5/18
 *******************************************************************************************************/

import _filter  from 'lodash-es/filter';
import _forEach from 'lodash-es/forEach';
import _map     from 'lodash-es/map';
import _reduce  from 'lodash-es/reduce';

import { JXON } from '../../util/jxon';
import { 
    json as d3_json, 
    xml as d3_xml } from 'd3-request';

import {
    presetPreset,
    presetField
} from '../../presets';

export default class TranslationManager {
    constructor( hoot ) {
        this.hoot = hoot;

        this.availableTranslations = [];
        this.defaultTranslation    = 'OSM';
        this.activeTranslation     = this.defaultTranslation;
        this.previousTranslation   = null;
        this.activeSchema          = null;
    }

    setActiveTranslation( translation ) {
        this.previousTranslation = this.activeTranslation;
        this.activeTranslation   = translation;
        this.hoot.events.emit( 'active-translation-change' );
    }

    async getTranslations() {
        try {
            let translations = await this.hoot.api.getTranslationSchemas();

            this.availableTranslations = [ this.defaultTranslation ].concat( translations );
        } catch ( e ) {
            // TODO: alert error
        }
    }

    async translateToOsm( entityTags, translatedEntity ) {
        //Turn translated tag xml into a osm tags
        let xml           = `<osm version="0.6" upload="true" generator="hootenanny">${JXON.stringify( translatedEntity.asJXON() )}</osm>`,
            translatedXml = await this.hoot.api.translateFromXml( xml, this.activeTranslation ),
            document      = new DOMParser().parseFromString( translatedXml, 'text/xml' );

        let osmTags = this.tagXmlToJson( document );
        let changed = _reduce( osmTags, ( diff, val, key ) => {
            if ( entityTags[ key ] ) {
                if ( entityTags[ key ] !== val ) {
                    diff[ key ] = val;
                }
            } else {
                diff[ key ] = val;
            }

            return diff;
        }, {} );

        _forEach( entityTags, ( val, key ) => {
            if ( !osmTags[ key ] ) {
                changed[ key ] = undefined; // tag is removed
            }
        } );

        return changed;
    }

    async translateEntity( entity ) {
        //Turn osm xml into a coded tags
        let xml           = `<osm version="0.6" upload="true" generator="hootenanny">${JXON.stringify( entity.asJXON() )}</osm>`,
            translatedXml = await this.hoot.api.translateToXml( xml, this.activeTranslation ),
            document      = new DOMParser().parseFromString( translatedXml, 'text/xml' );

        let tags = this.tagXmlToJson( document );

        if ( !tags.FCODE && !tags.F_CODE ) {
            let message = 'Feature out of spec. Unable to translate',
                type    = 'warn';

            d3.select( '.tag-schema' )
                .select( 'input' )
                .property( 'value', this.previousTranslation );

            this.setActiveTranslation( this.previousTranslation );

            return Promise.reject( { message, type } );
        }

        let preset = this.hoot.context.presets().item( `${ this.activeTranslation }/${ tags.FCODE || tags.F_CODE }` );

        if ( preset ) {
            return { preset, tags };
        } else {
            let params = {
                idelem: 'fcode',
                idval: tags.FCODE || tags.F_CODE,
                geom: this.hoot.context.geometry( entity.id ).replace( /\w\S*/g, txt => {
                    return txt.charAt( 0 ).toUpperCase() + txt.substr( 1 ).toLowerCase();
                } ),
                translation: this.activeTranslation
            };

            this.activeSchema = await this.hoot.api.translateToJson( params );

            preset = this.schemaToPreset(this.hoot.context.presets(), this.activeSchema);

            this.hoot.context.presets().collection.push( preset );

            return { preset, tags };
        }
    }

    buildFields(schemaColumns) {
        let that = this;
        return schemaColumns.map(function(d) {
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
                id: that.activeTranslation + '/' + d.name,
                overrideLabel: d.desc,
                placeholder: placeholder,
                show: false
            };

            if (d.type === 'String') {
                f.type = 'text';
            } else if (d.type === 'enumeration') {
                f.type = 'combo';
                f.strings = {
                    options: d.enumerations.reduce(function (prev, curr) {
                        if (curr.value !== d.defValue) {
                            prev[curr.value] = curr.name;
                        }
                        return prev;
                    }, {})
                };
            } else {
                f.type = 'number';
            }
            return f;
        });
    }

    generateFields(presets, schema, preset) {
        let that = this;
        //create a new preset with fields from the schema
        var presetWithFields = that.schemaToPreset(presets, schema, preset);
        //copy tags from incoming preset
        presetWithFields.tags = preset.tags;
        //show hoot fields in the new preset
        preset['hoot:fields'].forEach(function(f) {
            presetWithFields.getFields(preset['hoot:tagschema'] + '/' + f).show = true;
        });

        return presetWithFields;
    }

    properCase(input) {
        return (!input) ? '' : input.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }); //toProperCase
    }


    translateFcodeRequest (fcode, geom) {
        let that = this;
        return function(callback) {
            d3_json(Hoot.api.translationUrl + '/translateFrom?translation=' + that.activeTranslation
                + '&fcode=' + fcode
                + '&geom=' + that.properCase(geom)
                , function(error, json) {
                        if (error) {
                            window.console.error(error);
                        } else {
                            callback(json);
                        }
                    });
        }
    };

    tagsToFCodeUrl(option) {
        return function(callback) {
            callback(d3_json(option));
        };
    }

    translateFromRequest (translatedEntity) {
        let that = this;
        var translatedXml = '<osm version="0.6" upload="true" generator="hootenanny">' + JXON.stringify(translatedEntity.asJXON()) + '</osm>';
        return function(callback) {
            d3_xml(Hoot.api.translationUrl + '/translateFrom?translation=' + that.activeTranslation)
            .post(translatedXml, function(error, osmXml) {
                if (error) {
                    window.console.error(error);
                } else {
                    callback(osmXml);
                }
            });
        }
    };

    addTagsForFcode (geom, preset, context, id, callback) {
        // when no default tags present, do fcode translation.
        // when present, do a full xml translation w/fcode + hoot:defaultTags
        var hootCall;
        let that = this;
        if (preset['hoot:defaultTags']) {
            var translatedEntity = context.entity(id).copy(context.graph(), []);
            translatedEntity.tags = preset['hoot:defaultTags'];
            translatedEntity.tags[that.fcode()] = preset['hoot:fcode'];
            hootCall = this.translateFromRequest(translatedEntity);
        } else {
            hootCall = this.translateFcodeRequest(preset['hoot:fcode']);
        }

        hootCall(function(response) {
            preset.tags = preset['hoot:defaultTags'] ? that.tagXmlToJson(response) : response.attrs || response;
            d3_json(Hoot.api.translationUrl +
                '/translateTo?idelem=fcode&idval=' + preset['hoot:fcode'] +
                '&geom=' + that.properCase(geom) + '&translation=' + that.activeTranslation,
                function(error, schema) {
                    if (error) {
                        alert('Unable to get schema. ' + JSON.parse(error.target.response).error);
                    } else {
                        that.activeSchema = schema;
                        // after we are dealing with a hoot preset, we need to build up
                        // the iD field from the response
                        if (preset['hoot:fields']) {
                            callback(that.generateFields(context.presets(), schema, preset));
                        // otherwise, just build the preset w/the response.
                        } else {
                            callback(that.schemaToPreset(context.presets(), schema, preset));
                        }
                    }
                }
            );
        });
    };

    schemaToPreset(presets, schema, preset) {
        var id, fields = [], fieldsMap = {};
        let that = this;

        this.buildFields(schema.columns).forEach(function (field) {
            var f = presetField(field.id, field);
            fieldsMap[field.id] = f;
            fields.push(f.id);
        });

        if (preset) {
            id = preset.id;
        } else {
            id = that.activeTranslation + '/' + schema.fcode;
        }

        var newPreset = {
            geometry: preset ? preset.geometry : [schema.geom.toLowerCase()],
            tags: preset ? preset.tags : {},
            'hoot:featuretype': schema.desc,
            'hoot:tagschema': that.activeTranslation,
            'hoot:fcode': schema.fcode,
            schema: schema,
            name: preset ? preset.name() : schema.desc + ((schema.fcode) ? ' (' + schema.fcode + ')' : ''),
            fields: fields
        };

        if (preset && preset.hasOwnProperty('hoot:defaultTags')) {
            newPreset['hoot:defaultTags'] = preset['hoot:defaultTags'];
        }

        return presetPreset(id, newPreset, fieldsMap);
    }

    tagXmlToJson( xml ) {
        let tags = _reduce( xml.querySelectorAll( 'tag' ), ( obj, tag ) => {
            obj[ tag.getAttribute( 'k' ) ] = tag.getAttribute( 'v' );

            return obj;
        }, {} );

        return tags;
    }

    decodeSchemaKey( key ) {
        let decodeKey = key;
        if (this.activeSchema) {
            const keys = this.activeSchema.columns.filter(function(d) {
                return d.name === key.toUpperCase();
            }).map(function(d) {
                return d.desc;
            });
            if (keys.length) {
                decodeKey = keys[0];
            }
        }
        return decodeKey;
    }

    decodeSchemaValue( tag ) {
        let decodeValue;
        if (this.activeSchema) {
            let values = [];
            let columns = this.activeSchema.columns.filter(function(d) {
                return d.name === tag.key.toUpperCase();
            });
            if (columns.length === 1) {
                if (columns[0].enumerations) {
                    values = columns[0].enumerations.filter(function(d) {
                        return d.value === tag.value;
                    }).map(function(d) {
                        return d.name;
                    });
                }
            }
            if (values.length) {
                decodeValue = values[0];
            }
        }
        return decodeValue;
    }

    filterSchemaKeys( value ) {
        return _map( _filter( this.activeSchema.columns, d => {
            return d.name.startsWith( value.toUpperCase() );
        } ), f => {
            return {
                title: f.desc,
                value: f.name
            };
        } );
    }

    filterSchemaValues( value ) {
        let values  = [],
            columns = _filter( this.activeSchema.columns, d => d.name === value.toUpperCase() );

        if ( columns.length === 1 ) {
            if ( columns[ 0 ].enumerations ) {
                values = columns[ 0 ].enumerations.map( function( d ) {
                    return {
                        title: d.name,
                        value: d.value
                    };
                } );
            }
        }
        return values;
    }

    fcode() {
        return this.activeTranslation === 'MGCP' ? 'FCODE' : 'F_CODE';
    }

}
