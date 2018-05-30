/*******************************************************************************************************
 * File: conflictGraphSync.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import HootOSM       from '../../managers/hootOsm';
import LayerManager  from '../../managers/layerManager';
import { t }         from '../../../util/locale';
import { osmEntity } from '../../../osm';
import API           from '../api';

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

    async loadMissingFeatures( featId ) {
        //let layerNames = d3.entries( LayerManager.loadedLayers ).filter( d => d.value.id === this.data.mapId );
        //
        //if ( layerNames.length ) {
        //    let { featXml, mapId } = await HootOSM.loadMissing( [ featId ] );
        //
        //    if ( featXml ) {
        //        let document = new DOMParser().parseFromString( featXml, 'text/xml' ),
        //            featOsm  = this.context.connection().parseXml( document, mapId );
        //
        //        console.log( document );
        //        console.log( mapId );
        //        console.log( featOsm );
        //    }
        //}

        let mapId    = featId.split( '_' )[ 1 ],
            type     = osmEntity.id.type( featId ) + 's',
            osmIds   = _.map( [ featId ], osmEntity.id.toOSM ),
            featXml  = await API.getFeatures( type, mapId, osmIds ),
            document = new DOMParser().parseFromString( featXml, 'text/xml' ),
            featOsm  = await this.context.connection().parseXml( document, mapId );

        //TODO: load missing handler
        console.log( featOsm );

        //_.forEach( _.groupBy( featId, osmEntity.id.type ), ( v, k ) => {
        //    let type   = k + 's',
        //        osmIds = _.map( v, osmEntity.id.toOSM );
        //
        //    _.forEach( _.chunk( osmIds, 150 ), async idArr => {
        //        let featXml = await API.getFeatures( type, mapId, idArr );
        //
        //        console.log( featXml );
        //        console.log( mapId );
        //        return { featXml, mapId };
        //    } );
        //} );
        //
        //let { featXml } = await HootOSM.loadMissing( [ featId ] );
        //
        //if ( featXml ) {
        //    let document = new DOMParser().parseFromString( featXml, 'text/xml' ),
        //        featOsm  = this.context.connection().parseXml( document, mapId );
        //
        //    console.log( document );
        //    console.log( mapId );
        //    console.log( featOsm );
        //}
    }
}