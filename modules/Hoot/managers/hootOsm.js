/*******************************************************************************************************
 * File: hootOsm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _                          from 'lodash-es';
import LayerManager               from './layerManager';
import API                        from '../control/api';
import { geoExtent as GeoExtent } from '../../geo/index';
import { rgb as d3_rgb }          from 'd3-color';
import colorPalette               from '../config/colorPalette';
import config                     from '../config/apiConfig';

class HootOSM {
    constructor() {
        this.palette       = colorPalette;
        this._loadedLayers = {};
    }

    set ctx( context ) {
        this.context     = context;
        this.hootOverlay = this.context.layers().layer( 'hoot' );
    }

    get loadedLayers() {
        return this._loadedLayers;
    }

    getMapnikSource( d ) {
        return {
            name: d.name,
            id: d.id.toString(),
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

    async loadLayer( params ) {
        let source      = this.getMapnikSource( params ),
            mapId       = source.id,
            tags        = await API.getTags( mapId ),
            layerExtent = await this.layerExtent( mapId );

        let layer = {
            name: params.name,
            id: source.id,
            refType: params.refType,
            color: params.color,
            merged: params.merged || false,
            layers: params.layers || [],
            source: source,
            extent: layerExtent,
            polygon: layerExtent.polygon(),
            tags: tags,
            visible: true
        };

        LayerManager.loadedLayers[ layer.id ] = layer;

        if ( layerExtent.toParam() !== '-180,-90,180,90' ) {
            this.context.extent( layerExtent );
        }

        if ( this.hootOverlay ) {
            this.hootOverlay.geojson( {
                type: 'FeatureCollection',
                features: [ {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: layerExtent.polygon()
                    }
                } ],
                properties: {
                    name: layer.name,
                    mapId: layer.id
                }
            } );
        }

        this.context.background().addSource( source );
        this.setLayerColor( mapId, layer.color );
    }

    hideLayer( id ) {
        LayerManager.loadedLayers[ id ].visible = false;

        d3.select( '#map' ).selectAll( `[class*="_${ id }-"]` ).remove();
        //d3.select( '#map' ).selectAll( `[class*="tag-hoot-${ id }"]` ).remove();
        this.context.connection().removeTile( id );
        this.context.flush();
    }

    async removeLayer( id ) {
        //delete LayerManager.loadedLayers[ id ];
        LayerManager.removeLoadedLayer( id );
        this.context.background().removeSource( id );
        this.hootOverlay.removeGeojson( id );

        this.context.flush();
    }

    decodeHootStatus( status ) {
        if ( status === 'Input1' ) {
            return 1;
        }
        if ( status === 'Input2' ) {
            return 2;
        }
        if ( status === 'Conflated' ) {
            return 3;
        }

        return parseInt( status, 10 );
    }

    setLayerColor( mapId, color ) {
        console.log( mapId, color );
        let sheets = document.styleSheets[ document.styleSheets.length - 1 ],
            lighter;

        //Delete existing rules for mapid
        for ( let i = 0; i < sheets.cssRules.length; i++ ) {
            let rule = sheets.cssRules[ i ];
            if ( rule.cssText.includes( 'tag-hoot-' + mapId ) )
                sheets.deleteRule( i );
        }

        //Insert new color rules for mapid
        color   = this.getPalette( color );
        lighter = d3_rgb( color ).brighter();

        sheets.insertRule( 'path.stroke.tag-hoot-' + mapId + ' { stroke:' + color + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'path.shadow.tag-hoot-' + mapId + ' { stroke:' + lighter + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'path.fill.tag-hoot-' + mapId + ' { fill:' + lighter + '}', sheets.cssRules.length - 1 );
        sheets.insertRule( 'g.point.tag-hoot-' + mapId + ' .stroke { fill:' + color + '}', sheets.cssRules.length - 1 );
    }
}

export default new HootOSM();