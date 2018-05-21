/*******************************************************************************************************
 * File: conflictMerge.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/16/18
 *******************************************************************************************************/

import _        from 'lodash-es';
import API      from '../../control/api';
import HootOSM  from '../../managers/hootOsm';
import { JXON } from '../../../util/jxon';
import { t }    from '../../../util/locale';

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

        mergedNode.tags[ 'hoot:stats' ] = 3;

        this.context.perform(
            HootOSM.changeTags( featureUpdate.id, mergedNode.tags ),
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
            osmXml;

        if ( reverse ) {
            jxonFeatures = jxonFeatures.reverse();
        }

        osmXml = `<osm version="0.6" upload="true" generator="hootenanny">${ jxonFeatures.join( '' ) }</osm>`;

        let mergedXml = await API.poiMerge( osmXml ),
            document  = new DOMParser().parseFromString( mergedXml, 'text/xml' );

        return await this.context.connection().parseXml( document );
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
        let relationId = this.data.currentReviewItem.relationId;

        return _.reduce( reviewRefs, ( arr, ref ) => {
            if ( mergeIds.indexOf( ref.id === -1 ) || ref.reviewRelationId !== relationId ) {
                arr.push( ref );
            }

            return arr;
        }, [] );
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