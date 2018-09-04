/*******************************************************************************************************
 * File: layerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _intersection   from 'lodash-es/intersection';
import _intersectionBy from 'lodash-es/intersectionBy';
import _isEmpty        from 'lodash-es/isEmpty';
import _filter         from 'lodash-es/filter';
import _find           from 'lodash-es/find';
import _forEach        from 'lodash-es/forEach';
import _map            from 'lodash-es/map';
import _reduce         from 'lodash-es/reduce';
import _remove         from 'lodash-es/remove';

import { rgb as d3_rgb } from 'd3-color';

import { geoExtent as GeoExtent } from '../../geo/index';
import { utilDetect }             from '../../util/detect';
import colorPalette               from '../config/colorPalette';
import config                     from '../config/apiConfig';

import {
    osmEntity,
    osmChangeset
} from '../../osm';

import {
    actionDiscardTags,
    actionNoop
} from '../../actions';

export default class Layers {
    constructor( hoot ) {
        this.hoot = hoot;

        this.allLayers          = [];
        this.loadedLayers       = {};
        this.recentlyUsedLayers = null;
        this.mergedLayer        = null;
        this.mergedConflicts    = null;
        this.palette            = colorPalette;
    }

    /**
     * Retrieve layers from database
     */
    async refreshLayers() {
        try {
            this.allLayers          = await this.hoot.api.getLayers();
            this.recentlyUsedLayers = JSON.parse( this.hoot.context.storage( 'recentlyUsedLayers' ) ) || [];

            this.syncRecentlyUsedLayers();
            this.hoot.events.emit( 'recent-layers-retrieved' );

            return this.allLayers;
        } catch ( err ) {
            this.hoot.response.alert( err );
        }
    }

    findBy( key, val ) {
        return _find( this.allLayers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _find( this.loadedLayers, layer => layer[ key ] === val );
    }

    exists( layerName, pathId ) {
        let idsInDestination = _reduce( _filter( this.hoot.folders._links, link => link.folderId === pathId ), ( arr, obj ) => {
            let o = { id: obj.mapId };
            arr.push( o );
            return arr;
        }, [] );

        let layersInDestination = _intersectionBy( this.allLayers, idsInDestination, 'id' );
        let match = _filter( layersInDestination, layer => layer.name === layerName );

        return match.length > 0;
    }

    getMapnikSource( d ) {
        return {
            name: d.name,
            id: d.id.toString(),
            type: 'tms',
            description: d.name,
            template: config.host
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

        let obj = _find( this.palette, color => color.name === name || color.hex === name );

        return obj.name === name ? obj.hex : obj.name;
    }

    async layerExtent( ids ) {
        let mbr;

        if ( Array.isArray( ids ) ) {
            _forEach( ids, async id => {
                mbr = await this.hoot.api.getMbr( id );
            } );
        } else {
            mbr = await this.hoot.api.getMbr( ids );
        }

        let min = [ mbr.minlon, mbr.minlat ],
            max = [ mbr.maxlon, mbr.maxlat ];

        return new GeoExtent( min, max );
    }

    async loadLayer( params ) {
        try {
            let source      = this.getMapnikSource( params ),
                mapId       = source.id,
                tags        = await this.hoot.api.getTags( mapId ),
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

            this.loadedLayers[ layer.id ] = layer;

            if ( layerExtent.toParam() !== '-180,-90,180,90' ) {
                this.hoot.context.extent( layerExtent );
            }

            if ( !this.hootOverlay ) {
                this.hootOverlay = this.hoot.context.layers().layer( 'hoot' );
            }

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

            this.hoot.context.background().addSource( source );
            this.setLayerColor( mapId, layer.color );
        } catch ( err ) {
            this.hoot.response.alert( err );
        }
    }

    removeLayer( id ) {
        _remove( this.allLayers, layer => layer.id === id );
    }

    removeLoadedLayer( id ) {
        if ( id && this.loadedLayers[ id ] ) {
            delete this.loadedLayers[ id ];
            this.hoot.context.background().removeSource( id );
            this.hootOverlay.removeGeojson( id );

            this.hoot.context.flush();
        }
    }

    hideLayer( id ) {
        this.hoot.layers.loadedLayers[ id ].visible = false;

        d3.select( '#map' ).selectAll( `[class*="_${ id }-"]` ).remove();

        this.hootOverlay.removeGeojson( id );

        this.hoot.context.connection().removeTile( id );
        this.hoot.context.flush();
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

    setRecentlyUsedLayers( layerName ) {
        if ( layerName ) {
            let index = this.recentlyUsedLayers.indexOf( layerName );

            if ( index > -1 ) {
                this.recentlyUsedLayers.splice( index, 1 );
                this.recentlyUsedLayers.unshift( layerName );

                return;
            }

            if ( this.recentlyUsedLayers.length > 5 ) {
                this.recentlyUsedLayers.splice( 0, 1, layerName );
            } else {
                this.recentlyUsedLayers.unshift( layerName );
            }
        }

        this.syncRecentlyUsedLayers();

        this.hoot.context.storage( 'recentlyUsedLayers', JSON.stringify( this.recentlyUsedLayers ) );
    }

    syncRecentlyUsedLayers() {
        this.recentlyUsedLayers = _intersection( this.recentlyUsedLayers, _map( this.allLayers, 'name' ) );
    }

    changeTags( entityId, tags ) {
        return graph => {
            let entity = graph.entity( entityId );

            return graph.replace( entity.update( { tags } ) );
        };
    }

    makeChangesetTags( imageryUsed ) {
        let detected = utilDetect();

        return {
            created_by: 'iD',
            imagery_used: imageryUsed.join( ';' ).substr( 0, 255 ),
            host: (window.location.origin + window.location.pathName).substr( 0, 255 ),
            locale: detected.locale,
            browser: detected.browser + ' ' + detected.version,
            platform: detected.platform,
            comment: 'HootOld Save'
        };
    }

    save( tryAgain, callback ) {
        let history = this.hoot.context.history(),
            changes = history.changes( actionDiscardTags( history.difference() ) );

        if ( !tryAgain ) {
            history.perform( actionNoop() );
        }

        let tags          = this.makeChangesetTags( history.imageryUsed() ),
            _osmChangeset = new osmChangeset( { tags } );

        this.hoot.context.connection().putChangeset( _osmChangeset, changes, err => {
            if ( err ) {

            } else {
                this.hoot.context.flush();

                if ( callback ) {
                    callback();
                }
            }
        } );
    }

    editable() {
        return Object.keys( this.hoot.layers.loadedLayers ).length;
    }
}