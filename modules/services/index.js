import serviceMapillary from './mapillary';
import serviceNominatim from './nominatim';
import serviceOsc from './visualizeChangeset';
import serviceOpenstreetcam from './openstreetcam';
import serviceOsm from './osm';
import serviceStreetside from './streetside';
import serviceTaginfo from './taginfo';
import serviceVectorTile from './vector_tile';
import serviceWikidata from './wikidata';
import serviceWikipedia from './wikipedia';

export var services = {
    geocoder: serviceNominatim,
    mapillary: serviceMapillary,
    oscChangeset: serviceOsc,
    openstreetcam: serviceOpenstreetcam,
    osm: serviceOsm,
    streetside: serviceStreetside,
    taginfo: serviceTaginfo,
    vectorTile: serviceVectorTile,
    wikidata: serviceWikidata,
    wikipedia: serviceWikipedia
};

export {
    serviceMapillary,
    serviceNominatim,
    serviceOsc,
    serviceOpenstreetcam,
    serviceOsm,
    serviceStreetside,
    serviceTaginfo,
    serviceVectorTile,
    serviceWikidata,
    serviceWikipedia
};
