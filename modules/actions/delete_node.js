import _                        from 'lodash-es';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay }      from './delete_way';
import { actionChangeTags }     from './change_tags';

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
export function actionDeleteNode(nodeId) {
    function isHootReview(entity) {
        if (entity.tags['hoot:review:needs']) {
            return true;
        }
        return false;
    }

    function updateHootReviewTags(entity, graph) {
        console.log( 'update hoot review tags' );

        let tags = entity.tags,
            newTags = _.clone(tags);

        newTags['hoot:review:needs'] = 'no';

        return actionChangeTags(entity.id, newTags)(graph);
    }

    var action = function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node)
            .forEach(function(parent) {
                parent = parent.removeNode(nodeId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = actionDeleteWay(parent.id)(graph);
                }
            });

        console.log( 'node: ', node );
        graph.parentRelations(node)
            .forEach(function(parent) {
                console.log( 'parent: ', parent );
                parent = parent.removeMembersWithID(nodeId);
                graph = graph.replace(parent);


                if (parent.isDegenerate()) {
                    if (!isHootReview( parent)) {
                        graph = actionDeleteRelation(parent.id)(graph);
                    } else {
                        graph = updateHootReviewTags(parent, graph);
                    }
                } else {
                    if ( !node.hootMeta || ( node.hootMeta && !node.hootMeta.isReviewDel ) ) {
                        graph = updateHootReviewTags( parent, graph );
                    }
                }
            });

        return graph.remove(node);
    };


    return action;
}
