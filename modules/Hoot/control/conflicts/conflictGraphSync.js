/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _            from 'lodash-es';
import HootOSM      from '../../managers/hootOsm';
import LayerManager from '../../managers/layerManager';
import { t }        from '../../../util/locale';

export default class ConflictGraphSync {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    async getRelationMembers( relationId ) {
        let featId   = `r${ relationId }_${ this.data.mapId }`,
            relation = this.context.hasEntity( featId );

        if ( relation ) {
            this.data.currentRelation = relation;
            let memberCount           = this.getRelationMembersCount( relation );

            if ( !memberCount ) return;

            if ( memberCount !== relation.members.length ) {

            } else if ( memberCount === 1 ) {
                // TODO: load missing features
            } else {
                // TODO: show alert
            }

            return relation.members;
        } else {
            if ( _.find( this.context.history().changes().deleted, { id: featId } ) ) {
                return;
            }

            this.loadMissingFeatures( featId );
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
            newTags = _.cloneDeep( tags );

        newTags[ 'hoot:review:needs' ] = 'no';

        this.context.perform(
            HootOSM.changeTags( reviewRel.id, newTags ),
            t( 'operations.change_tags.annotation' )
        );
    }

    loadMissingFeatures( featId ) {
        let layerNames = d3.entries( LayerManager.loadedLayers ).filter( d => d.value.id === this.data.mapId );

        if ( layerNames.length ) {
            let layerName = layerNames[ 0 ].key;

            this.context.loadMissing( [ featId ], layerName, ( err, entity ) => {

            } );
        }
    }
}