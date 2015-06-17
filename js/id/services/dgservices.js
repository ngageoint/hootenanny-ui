iD.dgservices  = function() {
    var dg = {},
        gbm_proxy = '/hoot-services/gbm',
        egd_proxy = '/hoot-services/egd',
        gbm_host = 'https://services.digitalglobe.com',
        egd_host = 'https://rdog.digitalglobe.com',
        gbm_connectId = 'REPLACE_ME',
        egd_connectId = 'REPLACE_ME',
        wmts_template = '/earthservice/wmtsaccess?CONNECTID={connectId}&request=GetTile&version=1.0.0&layer=DigitalGlobe:ImageryTileService&featureProfile={profile}&style=default&format=image/png&TileMatrixSet=EPSG:3857&TileMatrix=EPSG:3857:{zoom}&TileRow={y}&TileCol={x}',
        wms_template = '/mapservice/wmsaccess?connectId={connectId}&SERVICE=WMS&REQUEST=GetMap&SERVICE=WMS&VERSION=1.1.1&LAYERS=DigitalGlobe:Imagery&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&featureProfile={profile}&SRS=EPSG:3857&FEATURECOLLECTION={featureId}&BBOX={bbox}&WIDTH=256&HEIGHT=256',
        //wfs should use featureProfile param, but results aren't consistent
        wfs_template = '/catalogservice/wfsaccess?connectid={connectId}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&typeName=FinishedFeature&outputFormat=json&BBOX={bbox}',
        collection_template = '/mapservice/wmsaccess?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=imagery_footprint&env=color:ff6600&FORMAT=image/png8&LAYERS=DigitalGlobe:ImageryFootprint&featureProfile={profile}&TRANSPARENT=true&SRS=EPSG:3857&SUPEROVERLAY=true&FORMAT_OPTIONS=OPACITY:0.6;GENERALIZE:true&connectId={connectId}&FRESHNESS={freshness}&BBOX={bbox}&WIDTH=256&HEIGHT=256',
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

    dg.collections = [
        {value: '24h', text: t('background.dgcl_collections.24h')},
        {value: '1w', text: t('background.dgcl_collections.1w')},
        {value: '1m', text: t('background.dgcl_collections.1m')},
        {value: '6m', text: t('background.dgcl_collections.6m')},
        {value: '1y', text: t('background.dgcl_collections.1y')},
        {value: 'all', text: t('background.dgcl_collections.all')}
    ];

    dg.defaultCollection = defaultCollection;


    dg.wmts = {};
    dg.wmts.getTile = function(service, connectId, profile) {
        var url = '';
        if (!service || service === 'GBM') {
            url += gbm_host + wmts_template;
            return url.replace('{connectId}', connectId || gbm_connectId)
                .replace('{profile}', profile || defaultProfile);
        } else if (service === 'EGD') {
            url += egd_host + wmts_template;
            return url.replace('{connectId}', connectId || egd_connectId)
                .replace('{profile}', profile || defaultProfile);
        }
    };

    dg.wms = {};
    dg.wms.getMap = function(service, connectId, profile, featureId) {
        var url = '';
        if (!service || service === 'GBM') {
            url += gbm_host + wms_template;
            return url.replace('{connectId}', connectId || gbm_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{featureId}', featureId);
        } else if (service === 'EGD') {
            url += egd_host + wms_template;
            return url.replace('{connectId}', connectId || egd_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{featureId}', featureId);
        }
    };

    dg.wfs = {};
    dg.wfs.getFeature = function(service, connectId, profile, extent, callback) {
        var url = '';
        if (!service || service === 'GBM') {
            url += gbm_proxy + wfs_template;
            url = url.replace('{connectId}', connectId || gbm_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{bbox}', extent.toParam());
        } else if (service === 'EGD') {
            url += egd_proxy + wfs_template;
            url = url.replace('{connectId}', connectId || egd_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{bbox}', extent.toParam());
        }

        d3.json(url, callback);
    };

    dg.collection = {};
    dg.collection.getMap = function(service, connectId, profile, freshness) {
        var url = '';
        if (!service || service === 'GBM') {
            url += gbm_host + collection_template;
            return url.replace('{connectId}', connectId || gbm_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{freshness}', freshness || defaultCollection);
        } else if (service === 'EGD') {
            url += egd_host + collection_template;
            return url.replace('{connectId}', connectId || egd_connectId)
                .replace('{profile}', profile || defaultProfile)
                .replace('{freshness}', freshness || defaultCollection);
        }
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
                'name': 'DigitalGlobe Imagery',//dg.profile,
                'type': 'wmts',
                'description': 'Satellite imagery from ' + service || 'GBM',
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
                'id': 'dgBackground',
                'overlay': false
            };
        return source;
    };

    dg.collectionSource = function(service, connectId, profile, freshness) {
        var template = this.collection.getMap(service, connectId, profile, freshness);
        var terms = this.terms(service);
        var source = {
                'name': 'DigitalGlobe Imagery Collection',//dg.profile,
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
                'id': 'dgCollection',
                'overlay': true
            };
        return source;
    };

    return dg;
};
