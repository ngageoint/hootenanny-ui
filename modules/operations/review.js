
import { t } from '../util/locale';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { point as turfPoint, lineString as turfLineString } from '@turf/helpers';
import {
    // behaviorDrag,
    behaviorOperation
} from '../behavior';

export function operationReview(selectedIDs, context) {
    const entityId = selectedIDs[0];
    let entity = context.hasEntity(entityId);
    while (entity && entity.type === 'relation') {
        let members = entity.members.map(m => context.hasEntity(m.id));
        let nonRelationMember = members.find(e => e.type !== 'relation');
        if (nonRelationMember) {
            entity = nonRelationMember;
        } else {
            entity = members.find(m => true);
        }
    }
    const entityLoc = getLocation(entity)

    function getLocation(entity) {
        if (entity.type === 'node') {
            return turfPoint(entity.loc);
        }

        const line = turfLineString(entity.nodes.map(n => context.entity(n).loc));
        const point = turfPoint(entity.extent(context.graph()).center());

        return nearestPointOnLine(line, point);
    }


    function collectReviewLocations(mem, locations = []) {
        if (mem.type === 'relation') {
            mem.members.forEach(m => collectReviewLocations(m, locations));
        } else {
            const memLoc = getLocation(mem);

            if (memLoc) {
                const mapId = Number(entityId.split('_')[1]);
                locations.push(turfPoint(memLoc.geometry.coordinates, {
                    mapId: mapId,
                    entityId: entityId,
                    reviewLabel: true
                }));
                locations.push(turfLineString([entityLoc.geometry.coordinates, memLoc.geometry.coordinates], {
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
        const mapId = Number(entityId.split('_')[1]);

        if (!entity) {
            return;
        }


        let hootGeoJson = context.layers().layer('hoot').geojson();
        let reviewIndex = hootGeoJson.findIndex(f => f.properties.review);
        let reviewGeoJson = hootGeoJson.find(f => f.properties.review);
        if (reviewIndex > -1) {
            hootGeoJson.splice(reviewIndex, 1);
        }
        if (!reviewGeoJson) {
            reviewGeoJson = {type: 'FeatureCollection', properties: {mapId: mapId, review: true}, features: []};
        }
        const lastEntity = reviewGeoJson.features.find(f => f.properties.entityId);

        // if we are clicking the review button on the same feature, turn it off
        // when we are not, then build the features for the selected
        if (lastEntity && lastEntity.properties.entityId === entityId) {
            reviewGeoJson.features = reviewGeoJson.features.filter(f => !f.properties.reviewLabel);
            context.layers().layer('hoot').geojson(reviewGeoJson);
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
            reviewGeoJson.features = reviewLocations.concat(reviewGeoJson.features.filter(f => {
                return !f.properties || !f.properties.reviewLabel;
            }));

            context.layers().layer('hoot').geojson(reviewGeoJson);
        }
    };

    operation.annotation = function() {
        return t('operations.review.annotation');
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
