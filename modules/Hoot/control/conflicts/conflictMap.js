/*******************************************************************************************************
 * File: conflictMap.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _                 from 'lodash-es';
import { isValidCoords } from '../utilities';

export default class ConflictMap {
    constructor( instance ) {
        this.conflicts = instance;
        this.context   = instance.context;
        this.data      = instance.data;
    }

    highlightLayer( item1, item2 ) {
        let feature        = this.context.hasEntity( item1.id ),
            againstFeature = this.context.hasEntity( item2.id ),
            features       = [ feature, againstFeature ],
            relation       = this.data.currentEntity,
            panToId;

        _.forEach( features, ( feature, key ) => {
            let extent = feature.extent( this.context.graph() ),
                k      = key + 1;

            if ( !panToId && isValidCoords( extent[ 0 ] ) && isValidCoords( extent[ 1 ] ) ) {
                panToId = feature.id;
            }

            this.data.poiTableCols.push( feature );

            d3.selectAll( `.activeReviewFeature${ k }` )
                .classed( `activeReviewFeature${ k }`, false );
            d3.selectAll( '.' + feature.id )
                .classed( `tag-hoot activeReviewFeature${ k }`, true );
        } );

        this.conflicts.info.buildPoiTable();

        if ( relation && relation.members && relation.members.length > 0 ) {

        }
    }
}