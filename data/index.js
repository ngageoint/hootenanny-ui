import _values from 'lodash-es/values';

export var dataWikipedia = [
    [
        "English",
        "English",
        "en"
    ]
];

export { default as dataAddressFormats } from './address-formats.json';
export { default as dataDeprecated } from './deprecated.json';
export { default as dataDiscarded } from './discarded.json';
export { default as dataLocales } from './locales.json';
export { default as dataPhoneFormats } from './phone-formats.json';
export { default as dataShortcuts } from './shortcuts.json';

export { default as dataImperial } from './imperial.json';
export { default as dataDriveLeft } from './drive-left.json';
export { default as dataEn } from '../dist/locales/en.json';

import dataImagery from './imagery.json';
import presets from './presets/presets.json';
import defaults from './presets/defaults.json';
import categories from './presets/categories.json';
import fields from './presets/fields.json';

import whichPolygon from 'which-polygon';


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
