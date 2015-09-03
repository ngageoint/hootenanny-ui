Hoot.model.conflicts = function(context)
{
  var model_conflicts = {};
  var descendents = {};

    model_conflicts.beginReview = function (layer, callback) {
        var mapid = layer.mapId;
       /* context.hoot().model.layers.refresh(function () {
            callback(layer);
        });*/
        callback(layer);
    };
    model_conflicts.acceptAll = function (data, callback) {

        var mapid = data.mapId;
        var hasChanges = context.history().hasChanges();
        if (hasChanges) {
            iD.modes.Save(context).save(context, function () {

                var reviewMarkData = {};
                reviewMarkData.mapId = data.mapId;
                Hoot.model.REST('ReviewMarkAll', reviewMarkData, function () {  
                    if (callback) {
                        callback();
                    }

                });               

            });
        }
        else {
            var reviewMarkData = {};
            reviewMarkData.mapId = data.mapId;
            Hoot.model.REST('ReviewMarkAll', reviewMarkData, function () { 
                if (callback) {
                    callback();
                }
            });
        }
    };

    model_conflicts.RemoveAllReviews = function (data) {
        var items = data.reviewableItems;
        var mapid = data.mapId;
        var flagged = _.uniq(_.flatten(_.map(items, function (d) {
            //return [d.type.charAt(0) + d.id + '_' + mapid, d.itemToReviewAgainst.type.charAt(0) + d.itemToReviewAgainst.id + '_' + mapid];
            //ONLY remove the review against feature
            return [d.itemToReviewAgainst.type.charAt(0) + d.itemToReviewAgainst.id + '_' + mapid];
        })));
        var toDel = _.filter(flagged, function (d) {
            return context.hasEntity(d);
        });
        var delConflicts = iD.operations.Delete(toDel, context);
        delConflicts();
    };
    model_conflicts.RemoveFeature = function (item, mapid) {
        var featureID = item.type.charAt(0) + item.id + '_' + mapid;
        if (!context.hasEntity(featureID)) {
            window.console.log('delete error: ' + featureID);
        } else {
            var toDel = [featureID];
            var delConflicts = iD.operations.Delete([toDel], context);
            delConflicts();
        }

    };
    model_conflicts.autoMergeFeature = function (feature, featureAgainst, mapid) {
        var layerName = feature.layerName;

        if (!feature && !featureAgainst) {
             window.alert('Merge error, one feature is missing');
        } else {
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' +
                JXON.stringify(feature.asJXON()) + JXON.stringify(featureAgainst.asJXON()) + '</osm>';

            context.connection().loadFromHootRest('poiMerge', osmXml, function(error, entities) {

                //Remove two input entities
                iD.operations.Delete([feature.id, featureAgainst.id], context)();

                //Add merged entity
                var mergedNode = entities[0];
                //FIXME: Temp hack to set version to 0
                mergedNode.version = 0;
                //FIXME: Another hack to update hoot:status after merge
                //this should probably be done by the server merge code
                mergedNode.tags['hoot:status'] = 3;
                //Track merged ids in descendents
                descendents[feature.id] = mergedNode.id;
                descendents[featureAgainst.id] = mergedNode.id;

                //console.log(descendents);

                context.perform(
                    iD.actions.AddEntity(mergedNode),
                    t('operations.add.annotation.point'));

                window.setTimeout(function() {
                    context.enter(iD.modes.Select(context, [mergedNode.id]));
                }, 500);

            }, mapid, layerName);
        }
    };

    model_conflicts.findDescendent = function(id) {
        var descId = descendents[id];
        if (typeof descId !== 'undefined') {
            return model_conflicts.findDescendent(descId);
        } else {
            return id;
        }
    };

    model_conflicts.updateDescendent = function(xhr, mapId) {
        var nodes = xhr.getElementsByTagName('node');
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.hasAttribute('new_id')) {
                //TODO: if we support merging ways and relations
                //we'll have to update the id generation pattern
                var oldid = 'n' + n.getAttribute('old_id') + '_' + mapId;
                var newid = 'n' + n.getAttribute('new_id') + '_' + mapId;
                descendents[oldid] = newid;
            }
        }
    };

    model_conflicts.getSourceLayerId = function(feature) {
        var mergeLayer = hoot.loadedLayers()[feature.layerName];
        var sourceLayers = mergeLayer.layers;
        var featureLayerName = sourceLayers[parseInt(feature.tags['hoot:status']) - 1];
        var sourceLayer = hoot.loadedLayers()[featureLayerName];
        return (sourceLayer) ? sourceLayer.mapId : null;
    };

    model_conflicts.getFeatureLayer = function(feature) {
        return hoot.loadedLayers()[feature.layerName];
    };

  return model_conflicts;
};