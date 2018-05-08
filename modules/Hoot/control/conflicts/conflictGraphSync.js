/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class ConflictGraphSync {
    constructor( parent ) {
        this.conflicts = parent;
        this.context = this.conflicts.context;

        this.mapId            = this.conflicts.layer.id;
        this.currentFeatureId = null;
    }

    getRelationFeature( relationId ) {
        this.currentFeatureId = `r${ relationId }_${ this.mapId }`;

        let feature = this.context.hasEntity( this.currentFeatureId );

        if ( feature ) {
            let memberCount = this.getRelationMembersCount( feature );

            console.log( memberCount );
        }
    }

    getRelationMembersCount( feature ) {
        let count = 0;

        _.forEach( feature.members, member => {
            console.log( member );
            count += this.context.hasEntity( member.id ) ? 1 : 0;
        } );

        return count;
    }
}