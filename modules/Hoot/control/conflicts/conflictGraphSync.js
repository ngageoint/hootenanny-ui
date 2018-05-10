/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class ConflictGraphSync {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    async getRelationMembers( relationId ) {
        let entityId = `r${ relationId }_${ this.data.mapId }`,
            entity   = this.context.hasEntity( entityId );

        if ( entity ) {
            this.data.currentEntity = entity;
            let memberCount = this.getRelationMembersCount( entity );

            if ( !memberCount ) return;

            if ( memberCount !== entity.members.length ) {

            } else if ( memberCount === 1 ) {
                // TODO: load missing features
            } else {
                // TODO: show alert
            }

            return entity.members;
        }
    }

    getRelationMembersCount( entity ) {
        let count = 0;

        _.forEach( entity.members, member => {
            count += this.context.hasEntity( member.id ) ? 1 : 0;
        } );

        return count;
    }
}