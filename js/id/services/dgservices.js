iD.dgservices  = function() {
    var dg = {},
        evwhs_proxy = '/hoot-services/evwhs',
        evwhs_host = 'https://{switch:a,b,c,d,e}-evwhs.digitalglobe.com',evwhs_connectId = 'REPLACE_ME',
        evwhs_connectId = 'REPLACE_ME',
        wmts_template = '/earthservice/wmtsaccess?CONNECTID={connectId}&request=GetTile&version=1.0.0'
            + '&layer=DigitalGlobe:ImageryTileService&featureProfile={profile}&style=default&format=image/png'
            + '&TileMatrixSet=EPSG:3857&TileMatrix=EPSG:3857:{zoom}&TileRow={y}&TileCol={x}',
        wms_template = '/mapservice/wmsaccess?connectId={connectId}&SERVICE=WMS&REQUEST=GetMap&SERVICE=WMS&VERSION=1.1.1'
            + '&LAYERS=DigitalGlobe:Imagery&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE'
            + '&featureProfile={profile}&SRS=EPSG:3857&FEATURECOLLECTION={featureId}&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        wfs_template = '/catalogservice/wfsaccess?connectid={connectId}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature'
            + '&typeName=FinishedFeature&featureProfile={profile}&outputFormat=json'
            + '&BBOX={bbox}&HEIGHT={height}&WIDTH={width}',
        collection_template = '/mapservice/wmsaccess?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
            + '&STYLES=imagery_footprint&env=color:ff6600&FORMAT=image/png8&LAYERS=DigitalGlobe:ImageryFootprint'
            + '&featureProfile={profile}&TRANSPARENT=true&SRS=EPSG:3857&SUPEROVERLAY=true'
            + '&FORMAT_OPTIONS=OPACITY:0.6;GENERALIZE:true&connectId={connectId}&FRESHNESS={freshness}'
            + '&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        defaultProfile = 'Global_Currency_Profile',
        defaultCollection = '24h';

    function isUUID(str) {
        if (str === null){
            return false;
        } else{
            var match = str.search(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            return match !== -1;
        }
    }

    dg.enabled = isUUID(evwhs_connectId);

    dg.evwhs = {};
    dg.evwhs.connectId = function(_) {
        if (!arguments.length) return evwhs_connectId;
        evwhs_connectId = _;
        return dg;
    };

    dg.profiles = [
       {value: 'Global_Currency_Profile', text: t('background.dgbg_profiles.Global_Currency_Profile')},
       {value: 'MyDG_Color_Consumer_Profile', text: t('background.dgbg_profiles.MyDG_Color_Consumer_Profile')},
       {value: 'MyDG_Consumer_Profile', text: t('background.dgbg_profiles.MyDG_Consumer_Profile')},
       {value: 'Cloud_Cover_Profile', text: t('background.dgbg_profiles.Cloud_Cover_Profile')},
       {value: 'Color_Infrared_Profile', text: t('background.dgbg_profiles.Color_Infrared_Profile')}
    ];

    dg.defaultProfile = defaultProfile;

    dg.getProfile = function(value) {
        var p = dg.profiles.filter(function(d) {
            return d.value === (value);
        });
        return (p.length > 0) ? p[0].text : null;
    };

    dg.collections = [
        {value: '24h', text: t('background.dgcl_collections.24h')},
        {value: '1w', text: t('background.dgcl_collections.1w')},
        {value: '1m', text: t('background.dgcl_collections.1m')},
        {value: '6m', text: t('background.dgcl_collections.6m')},
        {value: '1y', text: t('background.dgcl_collections.1y')},
        {value: 'all', text: t('background.dgcl_collections.all')}
    ];

    dg.defaultCollection = defaultCollection;

    function getUrl(connectId, profile, template, proxy) {
        var host,
            connectid;
            //Always use the proxy until EVWHS implements CORS
            //Basic auth cookie must be good for all requests,
            //so can't use domain switching
            host = evwhs_proxy;//(proxy) ? evwhs_proxy : evwhs_host;
            connectid = connectId || evwhs_connectId;
        return (host + template)
            .replace('{connectId}', connectid)
            .replace('{profile}', profile || defaultProfile);
    }

    dg.wmts = {};
    dg.wmts.getTile = function(connectId, profile) {
        return getUrl(connectId, profile, wmts_template);
    };

    dg.wms = {};
    dg.wms.getMap = function(connectId, profile, featureId) {
        return getUrl(connectId, profile, wms_template)
            .replace('{featureId}', featureId);
    };

    dg.wfs = {};
    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    function getWfsFeature(connectId, profile, extent, size, callback, addlParam) {
        var url = getUrl(connectId, profile, wfs_template, true/*proxy*/);
        if (addlParam) {
            url += '&' + d3.entries(addlParam).map(function(d) {
                return d.key + '=' + d.value;
            }).join('&');
        }
        url = url.replace(/\{switch:([^}]+)\}/, function(s, r) {
                var subdomains = r.split(',');
                return subdomains[getRandomInt(0, subdomains.length)];
            })
            .replace('{width}', size[0])
            .replace('{height}', size[1])
            .replace('{bbox}', extent.toParam());

        d3.json(url, callback);
    }
    dg.wfs.getFeature = function(connectId, profile, extent, size, callback) {
        getWfsFeature(connectId, profile, extent, size, callback);
    };
    dg.wfs.getFeatureInRaster = function(connectId, profile, extent, size, callback) {
        getWfsFeature(connectId, profile, extent, size, callback, {
            showTheRasterReturned: 'TRUE'
        });
    };

    dg.collection = {};
    dg.collection.getMap = function(connectId, profile, freshness) {
        return getUrl(connectId, profile, collection_template)
            .replace('{freshness}', freshness || defaultCollection);

    };

    dg.imagemeta = {};
    dg.imagemeta.sources = {};
    dg.imagemeta.add = function(source, features) {
        /*
        ${BASEMAP_IMAGE_SOURCE} - Source of imagery. E.g. 'digitalglobe', 'bing'
        ${BASEMAP_IMAGE_SENSOR} - Name of the source sensor. E.g. 'WV02'
        ${BASEMAP_IMAGE_DATETIME} - Date time the source was acquired. E.g. '2012-03-28 11:22:29'
        ${BASEMAP_IMAGE_ID} - Unique identifier for the image. E.g. 32905903099a73faec6d7de72b9a2bdb
        */
        dg.imagemeta.sources[source] = {
            '${BASEMAP_IMAGE_SOURCE}': source,
            '${BASEMAP_IMAGE_SENSOR}': features.map(function(d) { return d.properties.source; }).join(';'),
            '${BASEMAP_IMAGE_DATETIME}': features.map(function(d) { return d.properties.acquisitionDate; }).join(';'),
            '${BASEMAP_IMAGE_ID}': features.map(function(d) { return d.properties.featureId; }).join(';')
        };
    };
    dg.imagemeta.remove = function(source) {
        delete dg.imagemeta.sources[source];
    };

    dg.terms = function() {
        return 'https://evwhs.digitalglobe.com/myDigitalGlobe';
    };

    dg.backgroundSource = function(connectId, profile) {
        var template = this.wmts.getTile(connectId, profile);
        var terms = this.terms();
        var source = {
                'name': function() { return 'DigitalGlobe Imagery'; },
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
                'id': 'DigitalGlobe EV-WHS - ' + (dg.getProfile(profile) || dg.getProfile(defaultProfile)),
                'overlay': false
            };
        return source;
    };

    dg.collectionSource = function(connectId, profile, freshness) {
        var template = this.collection.getMap(connectId, profile, freshness);
        var terms = this.terms();
        var source = {
                'name': function() { return 'DigitalGlobe Imagery Collection'; },
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
        return source;
    };

    return dg;
};
