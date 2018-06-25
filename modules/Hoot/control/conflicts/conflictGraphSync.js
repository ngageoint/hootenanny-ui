/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import HootOSM       from '../../nodeManagers/hootOsm';
import { t }         from '../../../util/locale';
import { osmEntity } from '../../../osm';
import API           from '../api';

/**
 * @class ConflictGraphSync
 */
export default class ConflictGraphSync {
    /**
     * @param instance - conflict class
     */
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;

        this.relationTreeIdx = {};
    }

    /**
     * Get the current relation being reviewed
     *
     * @returns {object} - relation
     */
    getCurrentRelation() {
        let reviewItem = this.data.currentReviewItem;

        if ( !reviewItem ) {
            return null;
        }

        let relationId = `r${ reviewItem.relationId }_${ reviewItem.mapId }`;

        return this.context.entity( relationId );
    }

    /**
     * Search for all members of the current relation being reviewed and if not found
     * then load missing members from backend.
     *
     * @param relationId - ID of current relation being reviewed
     * @returns {Promise<*>|array}
     */
    async getRelationMembers( relationId ) {
        let relId = `r${ relationId }_${ this.data.mapId }`,
            relation  = this.context.hasEntity( relId );

        if ( relation ) {
            let memberCount = this.getRelationMembersCount( relation );

            if ( !memberCount ) return;

            if ( memberCount !== relation.members.length ) {
                return this.loadMissingFeatures( relId )
                    .then( () => this.validateMemberCount( relId ) );
            } else if ( memberCount === 1 ) {

            } else {
                // TODO: show alert
            }

            return relation.members;
        } else {
            if ( _.find( this.context.history().changes().deleted, { id: relId } ) ) {
                return;
            }

            return this.loadMissingFeatures( relId )
                .then( () => this.validateMemberCount( relId ) )
                .catch( err => console.log( err ) );
        }
    }

    /**
     * Get number of members in relation
     *
     * @param relation - current relation being reviewed
     * @returns {number} - number of members
     */
    getRelationMembersCount( relation ) {
        let count = 0;

        _.forEach( relation.members, member => {
            count += this.context.hasEntity( member.id ) ? 1 : 0;
        } );

        return count;
    }

    /**
     * Updates hoot:review:needs tag when resolved
     *
     * @param reviewRel - target relation to update
     */
    updateReviewTagsForResolve( reviewRel ) {
        let tags    = reviewRel.tags,
            newTags = _.clone( tags );

        newTags[ 'hoot:review:needs' ] = 'no';

        this.context.perform(
            HootOSM.changeTags( reviewRel.id, newTags ),
            t( 'operations.change_tags.annotation' )
        );
    }

    /**
     * Get missing feature from backend and recursively load its
     * children features if feature is a relation
     *
     * @param featureId - ID of feature to load
     * @returns {Promise<[]>}
     */
    async loadMissingFeatures( featureId ) {
        try {
            let type       = osmEntity.id.type( featureId ) + 's',
                mapId      = featureId.split( '_' )[ 1 ],
                osmIds     = _.map( [ featureId ], osmEntity.id.toOSM ),

                featureXml = await API.getFeatures( type, mapId, osmIds ),
                document   = new DOMParser().parseFromString( featureXml, 'text/xml' ),
                featureOsm = await this.context.connection().parseXml( document, mapId );

            this.context.history().merge( featureOsm );

            return Promise.all( _.map( featureOsm, feature => this.updateMissingFeature( feature ) ) );
        } catch( e ) {
            throw new Error( 'Unable to retrieve missing features from Hoot DB.' );
        }
    }

    /**
     * Recursively load children features if feature is a relation.
     * Otherwise, recursively update its parent relations
     *
     * @param feature - current feature
     * @returns {Promise<*>}
     */
    async updateMissingFeature( feature ) {
        if ( feature.type === 'relation' ) {
            this.relationTreeIdx[ feature.id ] = feature.members.length;

            return Promise.all( _.map( feature.members, member => {
                let entity = this.context.hasEntity( member.id );

                if ( !entity || member.type === 'relation' ) {
                    return this.loadMissingFeatures( member.id );
                } else {
                    return this.updateParentRelations( member.id, entity );
                }
            } ) );
        } else {
            let entity = this.context.hasEntity( feature.id );

            if ( entity ) {
                return this.updateParentRelations( feature.id );
            } else {
                throw new Error( `Failed to load missing features (${ feature.id }).` );
            }
        }
    }

    /**
     * Recursively traverse the parent tree and update index for relation in relation
     *
     * @param feature - current feature
     */
    updateParentRelations( feature ) {
        let parents = this.context.graph().parentRelations( feature );

        if ( !parents ) return;

        // go through each parents and if it is in
        // relation index then update member counts
        // or remove if the unprocessed member count goes to 0
        _.forEach( parents, parent => {
            if ( this.relationTreeIdx[ parent.id ] ) {
                let childCount = this.relationTreeIdx[ parent.id ];

                if ( childCount > 1 ) {
                    this.relationTreeIdx[ parent.id ] = childCount - 1;
                } else {
                    delete this.relationTreeIdx[ parent.id ];

                    let parentRelations = this.context.graph().parentRelations( parent );
                    this.updateParentRelations( parentRelations );
                }
            }
        } );
    }

    /**
     * Check to make sure relation has members
     *
     * @param relationId - relation ID
     * @returns {array} - list of members
     */
    validateMemberCount( relationId ) {
        let relation    = this.context.hasEntity( relationId ),
            memberCount = 0;

        if ( relation ) {
            _.forEach( relation.members, member => {
                if ( this.context.hasEntity( member.id ) ) {
                    memberCount++;
                }
            } );
        }

        if ( memberCount > 0 ) {
            return relation.members;
        }
    }
}