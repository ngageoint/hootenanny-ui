/*******************************************************************************************************
 * File: hootOsm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import LayerManager from './layerManager';
import API from '../util/api';
import { geoExtent as GeoExtent } from '../../geo/index';
import { rgb as d3_rgb } from 'd3-color';
import colorPalette from '../config/colorPalette';
import config from '../config/apiConfig';

class HootOSM {
    constructor() {
        this.loadedLayers = {};
        this.palette      = colorPalette;
    }

    set ctx( context ) {
        this.context = context;
    }

    getMapnikSource( d ) {
        return {
            name: d.name,
            id: d.id,
            type: 'tms',
            description: d.name,
            template: window.location.protocol + '//' + window.location.hostname
            + `:${ config.mapnikServerPort }`
            + '/?z={zoom}&x={x}&y={-y}&color='
            + encodeURIComponent( this.getPalette( d.color ) )
            + '&mapid=' + d.id,
            scaleExtent: [ 0, 16 ],
            polygon: d.polygon,
            overzoom: false,
            overlay: true,
            hootlayer: true
        };
    }

    getPalette( name ) {
        if ( !name ) {
            return this.palette;
        }

        let obj = _.find( this.palette, color => color.name === name || color.hex === name );

        return obj.name === name ? obj.hex : obj.name;
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
            stats       = await API.getReviewStatistics( mapId ),
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

        this.setLayerColor( mapId, params.color );

        this.renderLayer( layerExtent, this.getMapnikSource( this.loadedLayers[ mapId ] ) );
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

    setLayerColor( mapId, color ) {
        let sheets = document.styleSheets[ document.styleSheets.length - 1 ];

        //Delete existing rules for mapid
        for ( let i = 0; i < sheets.cssRules.length; i++ ) {
            let rule = sheets.cssRules[ i ];
            if ( rule.cssText.includes( 'tag-hoot-' + mapId ) )
                sheets.deleteRule( i );
        }

        //Insert new color rules for mapid
        color       = this.getPalette( color );
        let lighter = d3_rgb( color ).brighter();
        sheets.insertRule( 'path.stroke.tag-hoot-' + mapId + ' { stroke:' + color + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'path.shadow.tag-hoot-' + mapId + ' { stroke:' + lighter + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'path.fill.tag-hoot-' + mapId + ' { fill:' + lighter + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'g.point.tag-hoot-' + mapId + ' .stroke { fill:' + color + '}', sheets.cssRules.length - 1 );
    }
}

export default new HootOSM();