/*******************************************************************************************************
 * File: layerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _                 from 'lodash-es';
import EventEmitter      from 'events';
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

export default class Layers extends EventEmitter {
    constructor( hoot ) {
        super();

        this.hoot = hoot;

        this.config = {
            appInfo: [],
            mapThresholds: {}
        };

        this._layers       = [];
        this._loadedLayers = {};
        this.mergedLayer   = null;
        this.palette       = colorPalette;
    }

    get loadedLayers() {
        return this._loadedLayers;
    }

    /**
     * Retrieve layers from database
     */
    async refreshLayers() {
        this._layers = await this.hoot.api.getLayers();

        return this._layers;
    }

    findBy( key, val ) {
        return _.find( this._layers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _.find( this._loadedLayers, layer => layer[ key ] === val );
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

        let obj = _.find( this.palette, color => color.name === name || color.hex === name );

        return obj.name === name ? obj.hex : obj.name;
    }

    async layerExtent( ids ) {
        let mbr;

        if ( Array.isArray( ids ) ) {
            _.forEach( ids, async id => {
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

        this.emit( 'layer-loaded', layer.name );

        //if ( layer.merged ) {
        //    this.emit( 'layer-merged' );
        //}

        this.hoot.context.background().addSource( source );
        this.setLayerColor( mapId, layer.color );
    }

    removeLayer( id ) {
        if ( id && this._layers[ id ] ) {
            _.remove( this._layers, layer => layer.id === id );
        }
    }

    removeLoadedLayer( id ) {
        if ( id && this._loadedLayers[ id ] ) {
            delete this._loadedLayers[ id ];
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

    //removeLoadedLayer( id ) {
    //    delete this.loadedLayers[ id ];
    //    this.hoot.context.background().removeSource( id );
    //    this.hootOverlay.removeGeojson( id );
    //
    //    this.hoot.context.flush();
    //}

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

    save( mergedItems, tryAgain, callback ) {
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