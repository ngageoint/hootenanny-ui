
import { t } from '../util/locale';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { point, lineString } from '@turf/helpers';
import {
    // behaviorDrag,
    behaviorOperation
} from '../behavior';

export function operationReview(selectedIDs, context) {
    const entityId = selectedIDs[0];
    const entityLoc = getLocation(context.hasEntity(entityId));

    function getLocation(entity) {
        if (entity.type === 'node') {
            return entity.loc;
        }

        const line = lineString(entity.nodes.map(n => n.loc));
        const point = point(entity.extent(context.graph()).center());

        return nearestPointOnLine(line, point);
    }

    function collectReviewLocations(mem, locations = []) {
        if (mem.type === 'relation') {
            mem.members.forEach(m => collectReviewLocations(m, locations));
        } else {
            const memLoc = getLocation(mem);

            if (memLoc) {
                const mapId = Number(entityId.split('_')[1]);
                locations.push(point(memLoc, {
                    mapId: mapId,
                    entityId: entityId,
                    reviewLabel: true
                }));
                locations.push(lineString([entityLoc, memLoc], {
                    mapId: mapId,
                    entityId: entityId,
                    reviewLabel: true
                }));
            }
        }

        return locations;
    }

    var operation = function() {
        const entity = context.hasEntity(entityId);

        if (!entity) {
            return;
        }

        const hootGeoJson = context.layers().layer('hoot').geojson().find(f => f.properties.review)
            || {type: 'FeatureCollection', properties: {review: true}, features: []},
              lastEntity = hootGeoJson.features.find(f => f.properties.entityId);

        // if we are clicking the review button on the same feature, turn it off
        // when we are not, then build the features for the selected
        if (lastEntity && lastEntity.properties.entityId === entityId) {
            hootGeoJson.features = hootGeoJson.features.filter(f => !f.properties.reviewLabel);
            context.layers().layer('hoot').geojson(hootGeoJson);
            return;
        }

        // create features for lines that show other features in the relation
        // and the circles that will show what relation the other feature's part of

        var reviewLocations = [];
        context.graph().parentRelations(entity).forEach(parent => {
            if (parent.tags['hoot:review:needs'] === 'no') {
                return;
            }

            parent.members.forEach(mem => {
                const entity = context.hasEntity(mem.id);
                if (!entity || (entity.id === entityId && mem.type !== 'relation')) {
                    return;
                }

                collectReviewLocations(entity, reviewLocations);
            });

        });

        if (reviewLocations.length > 0) {
            hootGeoJson.features = reviewLocations.concat(hootGeoJson.features.filter(f => {
                return !f.properties || !f.properties.reviewLabel;
            }));

            context.layers().layer('hoot').geojson(hootGeoJson);
        }
    };

    operation.available = function() {
        return context.graph().parentRelations(context.hasEntity(entityId)).filter(item => item.tags['hoot:review:needs']).length > 0;
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.review.description');
    };

    operation.id = 'review';
    operation.keys = [t('operations.review.key')];
    operation.title = t('operations.review.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
