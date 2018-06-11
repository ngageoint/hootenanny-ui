/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import HootOSM       from '../../managers/hootOsm';
import { t }         from '../../../util/locale';
import { osmEntity } from '../../../osm';
import API           from '../api';

export default class ConflictGraphSync {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;

        this.relationTreeIdx = {};
    }

    getCurrentRelation() {
        let reviewItem = this.data.currentReviewItem;

        if ( !reviewItem ) {
            return null;
        }

        let relationId = `r${ reviewItem.relationId }_${ reviewItem.mapId }`;

        return this.context.entity( relationId );
    }

    async getRelationMembers( relationId ) {
        let featureId = `r${ relationId }_${ this.data.mapId }`,
            relation  = this.context.hasEntity( featureId );

        if ( relation ) {
            let memberCount = this.getRelationMembersCount( relation );

            if ( !memberCount ) return;

            if ( memberCount !== relation.members.length ) {
                return this.loadMissingFeatures( featureId )
                    .then( () => this.validateMemberCount( featureId ) );
            } else if ( memberCount === 1 ) {

            } else {
                // TODO: show alert
            }

            return relation.members;
        } else {
            if ( _.find( this.context.history().changes().deleted, { id: featureId } ) ) {
                return;
            }

            return this.loadMissingFeatures( featureId )
                .then( () => this.validateMemberCount( featureId ) );
        }
    }

    getRelationMembersCount( relation ) {
        let count = 0;

        _.forEach( relation.members, member => {
            count += this.context.hasEntity( member.id ) ? 1 : 0;
        } );

        return count;
    }

    updateReviewTagsForResolve( reviewRel ) {
        let tags    = reviewRel.tags,
            newTags = _.clone( tags );

        newTags[ 'hoot:review:needs' ] = 'no';

        this.context.perform(
            HootOSM.changeTags( reviewRel.id, newTags ),
            t( 'operations.change_tags.annotation' )
        );
    }

    async loadMissingFeatures( featureId ) {
        let type       = osmEntity.id.type( featureId ) + 's',
            mapId      = featureId.split( '_' )[ 1 ],
            osmIds     = _.map( [ featureId ], osmEntity.id.toOSM ),

            featureXml = await API.getFeatures( type, mapId, osmIds ),
            document   = new DOMParser().parseFromString( featureXml, 'text/xml' ),
            featureOsm = await this.context.connection().parseXml( document, mapId );

        this.context.history().merge( featureOsm );

        return Promise.all( _.map( featureOsm, feature => this.updateMissingFeature( feature ) ) );
    }

    async updateMissingFeature( feature ) {
        //console.log( 'update missing feature: ', feature );
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

    updateParentRelations( entity ) {
        let parents = this.context.graph().parentRelations( entity );

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
                    let parentRelations = this.context.graph().parentRelations( parent );

                    delete this.relationTreeIdx[ parent.id ];
                    this.cleanParentTree( parentRelations );
                }
            }
        } );
    }

    /**
     * Traverse the parent tree and update index for relation in relation
     *
     * @param parentRelations
     */
    cleanParentTree( parentRelations ) {
        _.forEach( parentRelations, parentRel => {
            let parentIdxCount = this.relationTreeIdx[ parentRel.id ];

            if ( parentIdxCount ) {
                if ( parentIdxCount > 1 ) {
                    this.relationTreeIdx[ parentRel.id ] = parentIdxCount - 1;
                } else {
                    delete this.relationTreeIdx[ parentIdxCount ];
                }

                let pr = this.context.graph().parentRelations( parentRel );

                if ( pr ) {
                    this.cleanParentTree( pr );
                }
            }
        } );
    }

    validateMemberCount( featureId ) {
        let entity      = this.context.hasEntity( featureId ),
            memberCount = 0;

        if ( entity ) {
            _.forEach( entity.members, member => {
                if ( this.context.hasEntity( member.id ) ) {
                    memberCount++;
                }
            } );
        }

        if ( memberCount > 0 ) {
            return entity.members;
        }
    }
}