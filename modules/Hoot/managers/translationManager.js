/*******************************************************************************************************
 * File: translationManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/5/18
 *******************************************************************************************************/

import _filter  from 'lodash-es/filter';
import _forEach from 'lodash-es/forEach';
import _map     from 'lodash-es/map';
import _reduce  from 'lodash-es/reduce';
import _some    from 'lodash-es/some';

import { JXON } from '../../util/jxon';

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

    async getFieldMappings(schema) {
        try {
            let fieldMappings = await this.hoot.api.getFieldMappings( schema );
            return fieldMappings;
        } catch ( e ) {
            console.error( e );
        }
    }

    async getColumns(tagKey, schema) {
        try {
            let columns = await this.hoot.api.getColumns( tagKey, schema );
            return columns;
        } catch ( e ) {
            console.error( e );
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

            preset = this.schemaToPreset( this.activeSchema );

            this.hoot.context.presets().collection.push( preset );

            return { preset, tags };
        }
    }

    schemaToPreset( schema ) {
        let id     = this.activeTranslation + '/' + schema.fcode;
        let fields = _map( schema.columns, column => {
            let placeholder = column.defValue;

            if ( column.enumerations ) {
                let defs = _filter( column.enumerations, e => e.value === placeholder );

                if ( defs.length === 1 ) {
                    placeholder = defs[ 0 ].name;
                }
            }

            let f = {
                key: column.name,
                id: this.activeTranslation + '/' + column.name,
                overrideLabel: column.desc,
                show: false,
                defaultValue: column.defValue,
                placeholder
            };

            let type = column.type.toLowerCase();

            if ( type === 'string' ) {
                f.type = 'text';
            } else if ( type === 'enumeration' ) {
                //check if enumeration should use a checkbox
                if ( _some( column.enumerations, e => e.value === '1000' && e.name === 'False' ) ) {
                    f.type = 'check';
                } else {
                    f.type = 'combo';
                }

                f.strings = {
                    options: _reduce( column.enumerations, ( obj, e ) => {
                        obj[ e.value ] = e.name;
                        return obj;
                    }, {} )
                };
            } else {
                f.type = 'number';
            }

            return f;
        } );

        let preset = {
            geometry: schema.geom.toLowerCase(),
            tags: {},
            'hoot:featuretype': schema.desc,
            'hoot:tagschema': this.activeTranslation,
            'hoot:fcode': schema.fcode,
            name: `${ schema.desc } (${ schema.fcode })`,
            fields: _map( fields, f => f.id )
        };

        // turn the array of fields into a map
        let fieldsMap = _reduce( fields, ( obj, field ) => {
            obj[ field.id ] = presetField( field.id, field );
            return obj;
        }, {} );

        return presetPreset( id, preset, fieldsMap );
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
