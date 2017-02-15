import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceOsm from './osm';
import serviceTaginfo from './taginfo';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

import serviceHoot from './hoot';

export var services = {
    mapillary: serviceMapillary,
    nominatim: serviceNominatim,
    osm: serviceOsm,
    taginfo: serviceTaginfo,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia,
    hoot: serviceHoot
};
