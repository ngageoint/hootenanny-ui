Hoot.demo = function(context) {
        var hoot = {};
        hoot.center = [-77.02809999999998, 38.88509];
        hoot.zoom = 19;
        hoot.refresh = function(callback) {
            d3.json('/data/layers.json', function(error, resp) {
                context.hoot().setAvailLayers(resp.layers);
                if (callback) {
                    callback(resp.layers);
                }
            });
            return;
        };
        hoot.conflate = function(container, layers, callback) {

            setTimeout(function() {
                var avail = context.hoot().getAvailLayers();
                avail.push({
                    'name': 'DC_MERGED_ROADS',
                    'mapId': 155
                });
                context.hoot().setAvailLayers(avail);
                callback({
                    'name': 'DC_MERGED_ROADS',
                    'color': 'green'
                });
            }, 1000);
            return;
        };
        hoot.beginReview = function(layer, callback) {
            setTimeout(function() {

                var data = {
                    'mapId': 155,
                    'numItemsRequested': 1000,
                    'numItemsReturned': 4,
                    'reviewScoreThresholdMinimum': 0.0,
                    'highestReviewScoreFirst': true,
                    'geospatialBounds': '-180.0,-90.0,180.0,90.0',
                    'coordSys': 'ESPG:4326',
                    'reviewableItems': [{
                        'id': 271,
                        'type': 'way',
                        'reviewScore': 0.475,
                        'displayBounds': '-77.03322890625812,38.88451309460341,-77.02869873536086,38.88645531180967',
                        'itemToReviewAgainst': {
                            'id': 74,
                            'type': 'way'
                        }
                    }, {
                        'id': 339,
                        'type': 'way',
                        'reviewScore': 0.475,
                        'displayBounds': '-77.02981661376951,38.884354029405486,-77.02638338623046,38.885825962970515',
                        'itemToReviewAgainst': {
                            'id': 217,
                            'type': 'way'
                        }
                    }, {
                        'id': 125,
                        'type': 'way',
                        'reviewScore': 0.475,
                        'displayBounds': '-77.03396101116253,38.883652798625945,-77.0263334057758,38.886596664316116',
                        'itemToReviewAgainst': {
                            'id': 341,
                            'type': 'way'
                        }
                    }, {
                        'id': 250,
                        'type': 'way',
                        'reviewScore': 0.475,
                        'displayBounds': '-77.03120859240812,38.884481335100276,-77.0238612107965,38.88731701782915',
                        'itemToReviewAgainst': {
                            'id': 70,
                            'type': 'way'
                        }
                    }]
                };
                callback(data);
            }, 1000);
            return;
        };
        _.extend(context.hoot(), hoot);
    };