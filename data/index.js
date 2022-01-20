import _values from 'lodash-es/values';

import dataWikipedia from 'wmf-sitematrix';

import dataAddressFormats from './address-formats.json';
import dataDeprecated from './deprecated.json';
import dataDiscarded from './discarded.json';
import dataLocales from './locales.json';
import dataPhoneFormats from './phone-formats.json';
import dataShortcuts from './shortcuts.json';

export { default as dataImperial } from './imperial.json';
export { default as dataDriveLeft } from './drive-left.json';
import dataEn from '../dist/locales/en.json';

import dataImagery from './imagery.json';
import presets from './presets/presets.json';
import defaults from './presets/defaults.json';
import categories from './presets/categories.json';
import fields from './presets/fields.json';
import osmTagInfo from './osm-plus-taginfo.json';
import tdsv61FieldValues from './tdsv61_field_values.json';
import tdsv70FieldValues from './tdsv70_field_values.json';
import mgcpFieldValues from './mgcp_field_values.json';

import whichPolygon from 'which-polygon';


export default {
    dataAddressFormats: dataAddressFormats,
    dataDeprecated: dataDeprecated,
    dataDiscarded: dataDiscarded,
    dataLocales: dataLocales,
    dataPhoneFormats: dataPhoneFormats,
    dataShortcuts: dataShortcuts,
    dataWikipedia: dataWikipedia,
    dataEn: dataEn
}

export var data = {
    community: {
        features: [],
        resources: [],
        query: whichPolygon({
            type: 'FeatureCollection',
            features: []
        })
    },
    imagery: dataImagery,  //legacy
    presets: {
        presets: presets,
        defaults: defaults,
        categories: categories,
        fields: fields
    }
};

// data for Translation Assistant tag lookup
export var tagInfo = {
    OSM: osmTagInfo,
    TDSv61: tdsv61FieldValues,
    TDSv70: tdsv70FieldValues,
    MGCP: mgcpFieldValues
};
