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
            relation = this.context.hasEntity( entityId );

        if ( relation ) {
            this.data.currentRelation = relation;
            let memberCount         = this.getRelationMembersCount( relation );

            if ( !memberCount ) return;

            if ( memberCount !== relation.members.length ) {

            } else if ( memberCount === 1 ) {
                // TODO: load missing features
            } else {
                // TODO: show alert
            }

            return relation.members;
        }
    }

    getRelationMembersCount( relation ) {
        let count = 0;

        _.forEach( relation.members, member => {
            count += this.context.hasEntity( member.id ) ? 1 : 0;
        } );

        return count;
    }
}