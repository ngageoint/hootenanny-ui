/*******************************************************************************************************
 * File: hootOsm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import LayerManager from './layerManager';
import API from '../util/api';
import { geoExtent as GeoExtent } from '../../geo/index';

class HootOSM {
    constructor() {
        this.loadedLayers = {};
    }

    set ctx( context ) {
        this.context = context;
    }

    async layerExtent( ids ) {
        let mbr;

        if ( Array.isArray( ids ) ) {
            _.forEach( ids, async id => {
                mbr = await API.getMbr( id );
            } );
        } else {
            mbr = await API.getMbr( ids );
        }

        let min = [ mbr.minlon, mbr.minlat ],
            max = [ mbr.maxlon, mbr.maxlat ];

        return new GeoExtent( min, max );
    }

    async loadLayer( source, params ) {
        let mapId       = source.id,
            tags        = await API.getTags( mapId ),
            layerExtent = await this.layerExtent( mapId );

        this.loadedLayers[ mapId ] = {
            name: LayerManager.availableLayers[ mapId ],
            id: mapId.toString(),
            polygon: [ layerExtent.polygon() ],
            color: params.color,
            source: source,
            tags: tags,
            visible: true
        };

        this.renderLayer( layerExtent, source );
    }

    renderLayer( extent, mapnikSource ) {
        if ( extent.toParam() !== '-180,-90,180,90' ) {
            this.context.extent( extent );
        }

        this.context.background().addSource( mapnikSource );
        let hootOverlay = this.context.layers().layer( 'hoot' );

        if ( hootOverlay ) {
            hootOverlay.geojson( hootOverlay.geojson().concat( [ {
                type: 'FeatureCollection',
                features: [ {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: extent.polygon()
                    }
                } ],
                properties: {
                    name: mapnikSource.name,
                    mapId: mapnikSource.id
                }
            } ] ) );
        }
    }
}

export default new HootOSM();