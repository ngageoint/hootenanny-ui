/*******************************************************************************************************
 * File: conflictMerge.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/16/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import { JXON } from '../../../util/jxon';

export default class ConflictMerge {
    constructor( instance ) {
        this.conflicts = instance;
        this.context   = instance.context;
        this.data      = instance.data;
    }

    async mergeFeatures() {
        let features     = [ this.data.feature, this.data.againstFeature ],
            jxonFeatures = [ JXON.stringify( features[ 0 ].asJXON() ), JXON.stringify( features[ 1 ].asJXON() ) ],
            reverse      = d3.event.ctrlKey,
            osmXml;

        if ( reverse ) {
            jxonFeatures = jxonFeatures.reverse();
        }

        osmXml = `<osm version="0.6" upload="true" generator="hootenanny">${ jxonFeatures.join( '' ) }</osm>`;

        let entities = await this.context.connection().loadFromHootAPI( osmXml );

        console.log( features );
        let queryElements = _.reduce( jxonFeatures, ( arr, feature, key ) => {

            let element = {
                mapId: this.conflicts.data.mapId,
                id: feature.id.split( '_' )[ 0 ],
                type: feature.type
            };

            arr.push( element );
            return arr;
        }, [] );

        console.log( queryElements );
    }
}