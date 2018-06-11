/*******************************************************************************************************
 * File: conflictMerge.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/16/18
 *******************************************************************************************************/

import _                    from 'lodash-es';
import API                  from '../../control/api';
import { osmNode }          from '../../../osm';
import { JXON }             from '../../../util/jxon';
import { t }                from '../../../util/locale';
import { operationDelete }  from '../../../operations/delete';
import { actionChangeTags } from '../../../actions';

export default class ConflictMerge {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    async mergeFeatures() {
        let features = _.clone( this.data.currentFeatures ),
            reverse  = d3.event.ctrlKey,
            featureToUpdate,
            featureToDelete,
            mergedFeature,
            reviewRefs;

        // show merge button
        this.toggleMergeButton( true );

        if ( reverse ) {
            // flip features
            features.reverse();
        }

        featureToUpdate = features[ 0 ];
        featureToDelete = features[ 1 ];

        try {
            let mergedNode = await this.getMergedNode( features );

            mergedNode.tags[ 'hoot:status' ] = 3;

            this.context.perform(
                actionChangeTags( featureToUpdate.id, mergedNode.tags ),
                t( 'operations.change_tags.annotation' )
            );

            mergedFeature = featureToUpdate; // feature that is updated is now the new merged node
        } catch ( e ) {
            throw new Error( 'Unable to merge features' );
        }

        try {
            let mergeItems              = this.getMergeItems( features ),
                { reviewRefsResponses } = await API.getReviewRefs( mergeItems );

            reviewRefs = _.uniq( reviewRefsResponses[ 0 ].reviewRefs.concat( reviewRefsResponses[ 1 ].reviewRefs ) );
            reviewRefs = this.removeNonRefs( reviewRefs, [ mergeItems[ 0 ].id, mergeItems[ 1 ].id ] );

            let missingRelationIds = this.getMissingRelationIds( reviewRefs );
        } catch ( e ) {
            throw new Error( 'Unable to retrieve review references for merged items' );
        }

        this.processMerge( reviewRefs, mergedFeature, featureToDelete );
    }

    processMerge( reviewRefs, mergedFeature, featureToDelete ) {
        let reviewRelationId = this.data.currentReviewItem.relationId;

        _.forEach( reviewRefs, ref => {
            let refRelation    = this.context.hasEntity( `r${ ref.reviewRelationId }_${ this.data.mapId }` ),
                mergedRelation = this.context.hasEntity( `r${ reviewRelationId }_${ this.data.mapId }` );

            if ( refRelation.members.length === mergedRelation.members.length ) {
                let foundCount = 0;

                _.forEach( refRelation.members, refMember => {
                    let found = _.find( mergedRelation.members, mergedMember => mergedMember.id === refMember.id );

                    if ( found ) {
                        foundCount++;
                    }
                } );

                if ( foundCount === refRelation.members.length ) {
                    refRelation.tags[ 'hoot:review:needs' ] = 'no';

                    this.context.perform(
                        actionChangeTags( refRelation.id, refRelation.tags ),
                        t( 'operations.change_tags.annotation' )
                    );
                }
            }

            let refRelationMember = refRelation.memberById( featureToDelete.id );

            if ( refRelationMember ) {
                let exists = _.find( this.data.mergedItems, { id: refRelation.id } );

                if ( exists && exists.obj ) {
                    exists = exists.obj.id === mergedFeature.id;
                }

                if ( !exists && !refRelation.memberById( mergedFeature.id ) ) {
                    let newNode = this.createNewRelationNodeMeta( mergedFeature.id, refRelation.id, refRelationMember.index );

                    this.data.mergedItems.push( newNode );
                }
            }
        } );

        let fe = this.context.hasEntity( featureToDelete.id );

        if ( fe ) {
            fe.hootMeta = { 'isReviewDel': true };
        }

        operationDelete( [ featureToDelete.id ], this.context )();
    }

    /**
     * Generate and parse the new merged feature
     *
     * @param features - list of OSM nodes to merge
     * @returns {array} - merged OSM data
     */
    async getMergedNode( features ) {
        let jxonFeatures = [ JXON.stringify( features[ 0 ].asJXON() ), JXON.stringify( features[ 1 ].asJXON() ) ],
            reverse      = d3.event.ctrlKey,
            mapId        = this.data.currentReviewItem.mapId,
            osmXml;

        if ( reverse ) {
            jxonFeatures = jxonFeatures.reverse();
        }

        osmXml = `<osm version="0.6" upload="true" generator="hootenanny">${ jxonFeatures.join( '' ) }</osm>`;

        let mergedXml = await API.poiMerge( osmXml ),
            dom       = new DOMParser().parseFromString( mergedXml, 'text/xml' );

        let featureOsm = await this.context.connection().parseXml( dom, mapId );

        return featureOsm[ 0 ];
    }

    /**
     * Generate parameters for nodes being merged together
     *
     * @param features - OSM nodes
     * @returns {*}
     */
    getMergeItems( features ) {
        return _.reduce( features, ( arr, feature ) => {
            let item = {
                mapId: this.data.mapId,
                id: feature.origid.substring( 1 ),
                type: feature.type
            };

            arr.push( item );

            return arr;
        }, [] );
    }

    /**
     * Remove any irrelevant reviews that don't reference either of the 2 items being merged together
     *
     * @param reviewRefs - list of review references
     * @param mergeIds - ids of items being merged
     * @returns {array} - new list of relevant review items
     */
    removeNonRefs( reviewRefs, mergeIds ) {
        let reviewMergeRelationId = this.data.currentReviewItem.relationId;

        return _.reduce( reviewRefs, ( arr, ref ) => {
            if ( (mergeIds.indexOf( '' + ref.id ) === -1) || ref.reviewRelationId !== reviewMergeRelationId ) {
                arr.push( ref );
            }

            return arr;
        }, [] );
    }

    createNewRelationNodeMeta( mergedNodeId, relationId, mergedIdx ) {
        let node = new osmNode(),
            obj  = {};

        node.id    = mergedNodeId;
        node.type  = 'node';
        node.role  = 'reviewee';
        node.index = mergedIdx;

        obj.id  = relationId;
        obj.obj = node;

        return obj;
    }

    getMissingRelationIds( reviewRefs ) {
        return _.reduce( reviewRefs, ( arr, ref ) => {
            let relId = `r${ ref.reviewRelationId }_${ this.data.mapId }`;

            if ( !this.context.hasEntity( relId ) ) {
                arr.push( relId );
            }

            return arr;
        }, [] );
    }

    toggleMergeButton( hide ) {
        d3.select( '.action-buttons .merge' ).classed( 'hidden', hide );
    }
}