iD.dgservices  = function() {
    var dg = {},
        gbm_proxy = '/hoot-services/gbm',
        egd_proxy = '/hoot-services/egd',
        gbm_host = 'https://services.digitalglobe.com',
        egd_host = 'https://evwhs.digitalglobe.com',
        gbm_connectId = 'REPLACE_ME',
        egd_connectId = 'REPLACE_ME',
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
        imagemeta_template = '/myDigitalGlobe/viewportsettings';
        //service = 'EGD',
        defaultProfile = 'Global_Currency_Profile',
        defaultCollection = '24h';

    dg.enabled = false;

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

    function getUrl(service, connectId, profile, template, proxy) {
        var host,
            connectid;
        if (!service || service === 'GBM') {
            host = (proxy) ? gbm_proxy : gbm_host;
            connectid = connectId || gbm_connectId;
        } else if (service === 'EGD') {
            host = (proxy) ? egd_proxy : egd_host;
            connectid = connectId || egd_connectId;
        }
        return (host + template)
            .replace('{connectId}', connectid)
            .replace('{profile}', profile || defaultProfile);
    }

    dg.wmts = {};
    dg.wmts.getTile = function(service, connectId, profile) {
        return getUrl(service, connectId, profile, wmts_template);
    };

    dg.wms = {};
    dg.wms.getMap = function(service, connectId, profile, featureId) {
        return getUrl(service, connectId, profile, wms_template)
            .replace('{featureId}', featureId);
    };

    dg.wfs = {};
    function getWfsFeature(service, connectId, profile, extent, size, callback, addlParam) {
        var url = getUrl(service, connectId, profile, wfs_template, true/*proxy*/);
        if (addlParam) {
            url += '&' + d3.entries(addlParam).map(function(d) {
                return d.key + '=' + d.value;
            }).join('&');
        }
        url = url.replace('{width}', size[0])
            .replace('{height}', size[1])
            .replace('{bbox}', extent.toParam());

        d3.json(url, callback);
    }
    dg.wfs.getFeature = function(service, connectId, profile, extent, size, callback) {
        getWfsFeature(service, connectId, profile, extent, size, callback);
    };
    dg.wfs.getFeatureInRaster = function(service, connectId, profile, extent, size, callback) {
        getWfsFeature(service, connectId, profile, extent, size, callback, {
            showTheRasterReturned: 'TRUE'
        });
    };

    dg.collection = {};
    dg.collection.getMap = function(service, connectId, profile, freshness) {
        return getUrl(service, connectId, profile, collection_template)
            .replace('{freshness}', freshness || defaultCollection);

    };

    dg.imagemeta = {};
    dg.imagemeta.sources = {};
    dg.imagemeta.add = function(source, features) {
        /*
        ${BASEMAP_IMAGE_SOURCE} - Source of imagery. E.g. "digitalglobe", "bing"
        ${BASEMAP_IMAGE_SENSOR} - Name of the source sensor. E.g. "WV02"
        ${BASEMAP_IMAGE_DATETIME} - Date time the source was acquired. E.g. "2012-03-28 11:22:29"
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

    dg.terms = function(service) {
        if (!service || service === 'GBM') {
            return 'https://origin-services.digitalglobe.com/myDigitalGlobe';
        } else if (service === 'EGD') {
            return 'https://evwhs.digitalglobe.com/myDigitalGlobe';
        }
    };

    dg.backgroundSource = function(service, connectId, profile) {
        var template = this.wmts.getTile(service, connectId, profile);
        var terms = this.terms(service);
        var source = {
                'name': function() { return 'DigitalGlobe Imagery'; },
                'type': 'wmts',
                'description': 'Satellite imagery from ' + (service || 'GBM'),
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
                'id': 'DigitalGlobe ' + (service || 'GBM') + ' - ' + (dg.getProfile(profile) || dg.getProfile(defaultProfile)),
                'overlay': false
            };
        return source;
    };

    dg.collectionSource = function(service, connectId, profile, freshness) {
        var template = this.collection.getMap(service, connectId, profile, freshness);
        var terms = this.terms(service);
        var source = {
                'name': function() { return 'DigitalGlobe Imagery Collection'; },
                'type': 'wms',
                'description': 'Satellite imagery collection from ' + service || 'GBM',
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
                // 'id': 'DigitalGlobe Collection Footprint - ' + dg.collections.filter(function(d) {
                //     return d.value === profile || defaultCollection;
                // })[0].text,
                'id': 'dgCollection',
                'overlay': true
            };
        return source;
    };

    return dg;
};
