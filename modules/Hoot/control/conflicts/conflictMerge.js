/*******************************************************************************************************
 * File: conflictMerge.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/16/18
 *******************************************************************************************************/

import _                    from 'lodash-es';
import API                  from '../../control/api';
import HootOSM              from '../../managers/hootOsm';
import { osmNode }          from '../../../osm';
import { JXON }             from '../../../util/jxon';
import { t }                from '../../../util/locale';
import { operationDelete }  from '../../../operations/delete';
import { actionChangeTags } from '../../../actions';

export default class ConflictMerge {
    constructor( instance ) {
        this.conflicts = instance;
        this.context   = instance.context;
        this.data      = instance.data;
    }

    async mergeFeatures() {
        let features      = [ this.data.feature, this.data.againstFeature ],
            reverse       = d3.event.ctrlKey,

            mergedOsm     = await this.getMergedOsm( features ),
            mergedNode    = mergedOsm[ 0 ],

            featureUpdate = this.data.feature,
            featureDelete = this.data.againstFeature;

        if ( reverse ) {
            featureUpdate = featureDelete;
            featureDelete = this.data.feature;
        }

        mergedNode.tags[ 'hoot:status' ] = 3;

        this.context.perform(
            actionChangeTags( featureUpdate.id, mergedNode.tags ),
            t( 'operations.change_tags.annotation' )
        );

        let mergeItems              = this.getMergeItems( features ),
            { reviewRefsResponses } = await API.getReviewRefs( mergeItems ),
            reviewRefs;

        if ( reviewRefsResponses.length !== mergeItems.length ) {
            // TODO: throw error?
        }

        reviewRefs = _.uniq( reviewRefsResponses[ 0 ].reviewRefs.concat( reviewRefsResponses[ 1 ].reviewRefs ) );
        reviewRefs = this.removeNonRefs( reviewRefs, [ mergeItems[ 0 ].id, mergeItems[ 1 ].id ] );

        let missingRelationIds = this.getMissingRelationIds( reviewRefs );

        this.processMerge( reviewRefs, mergedNode, featureDelete );
    }

    processMerge( reviewRefs, mergedNode, deleteNode ) {
        let reviewRelationId = this.data.currentReviewItem.relationId;

        _.forEach( reviewRefs, ref => {
            let refRelation    = this.context.hasEntity( `r${ ref.reviewRelationId }_${ this.data.mapId }` ),
                mergedRelation = this.context.hasEntity( `r${ reviewRelationId }_${ this.data.mapId }` );

            console.log( 'refRelation: ', refRelation );

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

            let refRelationMember = refRelation.memberById( deleteNode.id );

            console.log( 'refRelationMember: ', refRelationMember );

            if ( refRelationMember ) {
                let exists = _.find( this.data.mergedItems, { id: refRelation.id } );

                if ( exists && exists.obj ) {
                    exists = exists.obj.id === mergedNode.id;
                }

                if ( !exists && !refRelation.memberById( mergedNode.id ) ) {
                    let newNode = this.createNewRelationNodeMeta( mergedNode.id, refRelation.id, refRelationMember.index );

                    this.data.mergedItems.push( newNode );
                }
            }
        } );

        operationDelete( [ deleteNode.id ], this.context )();
    }

    /**
     * Generate and parse the new merged feature
     *
     * @param features - list of OSM nodes to merge
     * @returns {array} - merged OSM data
     */
    async getMergedOsm( features ) {
        let jxonFeatures = [ JXON.stringify( features[ 0 ].asJXON() ), JXON.stringify( features[ 1 ].asJXON() ) ],
            reverse      = d3.event.ctrlKey,
            mapId        = this.data.currentReviewItem.mapId,
            osmXml;

        if ( reverse ) {
            jxonFeatures = jxonFeatures.reverse();
        }

        osmXml = `<osm version="0.6" upload="true" generator="hootenanny">${ jxonFeatures.join( '' ) }</osm>`;

        let mergedXml = await API.poiMerge( osmXml ),
            document  = new DOMParser().parseFromString( mergedXml, 'text/xml' );

        return await this.context.connection().parseXml( document, mapId );
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
}