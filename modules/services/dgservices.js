/** ****************************************************************************************************
 * File: dgservices.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/9/18
 *******************************************************************************************************/

import { t } from '../core/localizer';

export default function() {
    var dg                = {},
        evwhs_proxy       = '../hoot-services/evwhs',
        evwhs_host        = 'https://{switch:a,b,c,d,e}-evwhs.digitalglobe.com',
        evwhs_connectId,
        default_connectId = evwhs_connectId = 'REPLACE_ME',
        wmts_template       = '/earthservice/wmtsaccess?CONNECTID={connectId}&request=GetTile&version=1.0.0'
            + '&layer=DigitalGlobe:ImageryTileService&featureProfile={profile}&style=default&format=image/png'
            + '&TileMatrixSet=EPSG:3857&TileMatrix=EPSG:3857:{zoom}&TileRow={y}&TileCol={x}',
        wms_template        = '/mapservice/wmsaccess?connectId={connectId}&SERVICE=WMS&REQUEST=GetMap&SERVICE=WMS&VERSION=1.1.1'
            + '&LAYERS=DigitalGlobe:Imagery&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE'
            + '&featureProfile={profile}&SRS=EPSG:3857&FEATURECOLLECTION={featureId}&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        wfs_template        = '/catalogservice/wfsaccess?connectid={connectId}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature'
            + '&typeName=FinishedFeature&featureProfile={profile}&outputFormat=json'
            + '&BBOX={bbox}&HEIGHT={height}&WIDTH={width}',
        collection_template = '/mapservice/wmsaccess?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
            + '&STYLES=imagery_footprint&env=color:ff6600&FORMAT=image/png8&LAYERS=DigitalGlobe:ImageryFootprint'
            + '&featureProfile={profile}&TRANSPARENT=true&SRS=EPSG:3857&SUPEROVERLAY=true'
            + '&FORMAT_OPTIONS=OPACITY:0.6;GENERALIZE:true&connectId={connectId}&FRESHNESS={freshness}'
            + '&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        defaultProfile      = 'Global_Currency_Profile',
        defaultCollection   = '24h';

    function isUUID( str ) {
        if ( str === null ) {
            return false;
        } else {
            var match = str.search( /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i );
            return match !== -1;
        }
    }

    dg.enabled = isUUID( evwhs_connectId );

    dg.profiles = [
        { value: 'Global_Currency_Profile', text: t( 'background.dgbg_profiles.Global_Currency_Profile' ) },
        { value: 'MyDG_Color_Consumer_Profile', text: t( 'background.dgbg_profiles.MyDG_Color_Consumer_Profile' ) },
        { value: 'MyDG_Consumer_Profile', text: t( 'background.dgbg_profiles.MyDG_Consumer_Profile' ) },
        { value: 'Cloud_Cover_Profile', text: t( 'background.dgbg_profiles.Cloud_Cover_Profile' ) },
        { value: 'Color_Infrared_Profile', text: t( 'background.dgbg_profiles.Color_Infrared_Profile' ) }
    ];

    dg.defaultProfile = defaultProfile;

    dg.getProfile = function( value ) {
        var p = dg.profiles.filter( function( d ) {
            return d.value === (value);
        } );
        return (p.length > 0) ? p[ 0 ].text : null;
    };

    dg.collections = [
        { value: '24h', text: t( 'background.dgcl_collections.24h' ) },
        { value: '1w', text: t( 'background.dgcl_collections.1w' ) },
        { value: '1m', text: t( 'background.dgcl_collections.1m' ) },
        { value: '6m', text: t( 'background.dgcl_collections.6m' ) },
        { value: '1y', text: t( 'background.dgcl_collections.1y' ) },
        { value: 'all', text: t( 'background.dgcl_collections.all' ) }
    ];

    dg.defaultCollection = defaultCollection;

    function getUrl( connectId, profile, template, proxy ) {
        var host,
            connectid;

        connectid = connectId || evwhs_connectId;

        //Always use the proxy if we need to authenticate
        //e.g. A user enters their own EVWHS connect id
        //Basic auth cookie must be good for all requests,
        //so can't use domain switching
        host = (proxy || (connectid !== default_connectId)) ? evwhs_proxy : evwhs_host;

        return (host + template)
            .replace( '{connectId}', connectid )
            .replace( '{profile}', profile || defaultProfile );
    }

    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt( min, max ) {
        min = Math.ceil( min );
        max = Math.floor( max );
        return Math.floor( Math.random() * (max - min) ) + min;
    }

    function getWfsFeature( connectId, profile, extent, size, callback, addlParam ) {
        var url = getUrl( connectId, profile, wfs_template, false );
        if ( addlParam ) {
            url += '&' + Object.entries( addlParam ).map( function( [key, value] ) {
                return key + '=' + value;
            } ).join( '&' );
        }
        url = url.replace( /\{switch:([^}]+)\}/, function( s, r ) {
            var subdomains = r.split( ',' );
            return subdomains[ getRandomInt( 0, subdomains.length ) ];
        } )
            .replace( '{width}', size[ 0 ] )
            .replace( '{height}', size[ 1 ] )
            .replace( '{bbox}', extent.toParam() );

        d3.json( url, callback );
    }

    dg.evwhs = {
        connectId: _ => {
            if ( !arguments.length ) return evwhs_connectId;
            evwhs_connectId = _;
            return dg;
        }
    };

    dg.wmts = {
        getTile: ( connectId, profile ) => {
            return getUrl( connectId, profile, wmts_template );
        }
    };

    dg.wms = {
        getMap: ( connectId, profile, featureId ) => {
            return getUrl( connectId, profile, wms_template )
                .replace( '{featureId}', featureId );
        }
    };

    dg.wfs = {
        getFeature: ( connectId, profile, extent, size, callback ) => {
            getWfsFeature( connectId, profile, extent, size, callback );
        },
        getFeatureInRaster: ( connectId, profile, extent, size, callback ) => {
            getWfsFeature( connectId, profile, extent, size, callback, {
                showTheRasterReturned: 'TRUE'
            } );
        }
    };

    dg.collection = {
        getMap: ( connectId, profile, freshness ) => {
            return getUrl( connectId, profile, collection_template )
                .replace( '{freshness}', freshness || defaultCollection );
        }
    };

    dg.imagemeta = {
        sources: {},
        add: ( source, features ) => {
            dg.imagemeta.sources[ source ] = {
                '${BASEMAP_IMAGE_SOURCE}': source,
                '${BASEMAP_IMAGE_SENSOR}': features.map( function( d ) {
                    return d.properties.source;
                } ).join( ';' ),
                '${BASEMAP_IMAGE_DATETIME}': features.map( function( d ) {
                    return d.properties.acquisitionDate;
                } ).join( ';' ),
                '${BASEMAP_IMAGE_ID}': features.map( function( d ) {
                    return d.properties.featureId;
                } ).join( ';' )
            };
        },
        remove: source => delete dg.imagemeta.sources[ source ]
    };

    dg.terms = () => 'https://evwhs.digitalglobe.com/myDigitalGlobe';

    dg.backgroundSource = function( connectId, profile ) {
        let template = this.wmts.getTile( connectId, profile ),
            terms    = this.terms();

        return {
            'name': function() {
                return 'DigitalGlobe Imagery';
            },
            'type': 'wmts',
            'description': 'Satellite imagery from EV-WHS',
            'template': template,
            'scaleExtent': [
                0,
                20
            ],
            'polygon': [
                [
                    [
                        -180,
                        -90
                    ],
                    [
                        -180,
                        90
                    ],
                    [
                        180,
                        90
                    ],
                    [
                        180,
                        -90
                    ],
                    [
                        -180,
                        -90
                    ]
                ]
            ],
            'terms_url': terms,
            'terms_text': '© DigitalGlobe',
            'id': 'DigitalGlobe EV-WHS - ' + (dg.getProfile( profile ) || dg.getProfile( defaultProfile )),
            'overlay': false
        };
    };

    dg.collectionSource = function( connectId, profile, freshness ) {
        let template = this.collection.getMap( connectId, profile, freshness ),
            terms    = this.terms();

        return {
            'name': function() {
                return 'DigitalGlobe Imagery Collection';
            },
            'type': 'wms',
            'description': 'Satellite imagery collection from EV-WHS',
            'template': template,
            'scaleExtent': [
                0,
                20
            ],
            'polygon': [
                [
                    [
                        -180,
                        -90
                    ],
                    [
                        -180,
                        90
                    ],
                    [
                        180,
                        90
                    ],
                    [
                        180,
                        -90
                    ],
                    [
                        -180,
                        -90
                    ]
                ]
            ],
            'terms_url': terms,
            'terms_text': '© DigitalGlobe',
            'id': 'dgCollection',
            'overlay': true
        };
    };

    return dg;
}
