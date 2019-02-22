/*******************************************************************************************************
 * File: layerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 *******************************************************************************************************/

import _intersection   from 'lodash-es/intersection';
import _intersectionBy from 'lodash-es/intersectionBy';
import _filter         from 'lodash-es/filter';
import _find           from 'lodash-es/find';
import _forEach        from 'lodash-es/forEach';
import _isEmpty        from 'lodash-es/isEmpty';
import _map            from 'lodash-es/map';
import _reduce         from 'lodash-es/reduce';
import _remove         from 'lodash-es/remove';

import { rgb as d3_rgb } from 'd3-color';

import { geoExtent as GeoExtent } from '../../geo/index';
import { utilDetect }             from '../../util/detect';
import colorPalette               from '../config/colorPalette';

import { osmChangeset } from '../../osm';

import {
    actionDiscardTags,
    actionNoop
} from '../../actions';

import {
    utilQsString,
    utilStringQs
} from '../../util';

export default class Layers {
    constructor( hoot ) {
        this.hoot = hoot;

        this.allLayers          = [];
        this.loadedLayers       = {};
        this.hashLayers         = {};
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

            //load hash layers if set
            if (!_isEmpty(this.hashLayers)) {
                Object.keys(this.hashLayers).forEach(k => {
                    this.addHashLayer(k, this.hashLayers[k]);
                });

                this.hashLayers = {};
            }

            return this.allLayers;
        } catch ( err ) {
            Hoot.message.alert( err );
        }
    }

    async addHashLayer(type, mapId) {
        Hoot.ui.sidebar.forms[ type ].submitLayer( {
            id: mapId,
            name: this.findBy( 'id', mapId).name
        } );
    }

    findBy( key, val ) {
        return _find( this.allLayers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _find( this.loadedLayers, layer => layer[ key ] === val );
    }

    noApi() {
        return Object.keys(this.loadedLayers).every( id => id > -1);
    }

    exists( layerName, pathId ) {
        let idsInDestination = _reduce( _filter( this.hoot.folders._links, link => link.folderId === pathId ), ( arr, obj ) => {
            let o = { id: obj.mapId };
            arr.push( o );
            return arr;
        }, [] );

        let layersInDestination = _intersectionBy( this.allLayers, idsInDestination, 'id' );
        let match               = _filter( layersInDestination, layer => layer.name === layerName );

        return match.length > 0;
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

    hashLayer( type, mapId ) {
        this.hashLayers[type] = parseInt(mapId);
    }

    async loadLayer( params ) {
        try {
            let mapId       = params.id,
                tags        = await this.hoot.api.getMapTags( mapId ),
                layerExtent = await this.layerExtent( mapId );

            let layer = {
                name: params.name,
                id: params.id,
                refType: params.refType,
                color: params.color,
                merged: params.merged || false,
                layers: params.layers || [],
                extent: layerExtent,
                polygon: layerExtent.polygon(),
                tags: tags,
                visible: true
            };

            //update url hash
            var q = utilStringQs(window.location.hash.substring(1));
            q[params.refType] = mapId;
            window.location.replace('#' + utilQsString(q, true));

            if ( tags.input1 || tags.input2 ) {
                layer = await this.checkForReview( layer );
            }

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

            this.setLayerColor( mapId, layer.color );

            return layer;
        } catch ( err ) {
            this.hoot.message.alert( err );
        }
    }

    async checkForReview( mergedLayer ) {
        let tags            = mergedLayer.tags,
            reviewStats     = await Hoot.api.getReviewStatistics( mergedLayer.id ),
            unreviewedCount = reviewStats.unreviewedCount;

        if ( !unreviewedCount || unreviewedCount === 0 ) return mergedLayer;

        if ( tags.reviewtype === 'hgisvalidation' ) {
            let message = 'The layer has been prepared for validation. Do you want to go into validation mode?',
                confirm = await Hoot.message.confirm( message );

            if ( !confirm ) return mergedLayer;

            // TODO: begin validation
        } else {
            let message = 'The layer contains unreviewed items. Do you want to go into review mode?',
                confirm = await Hoot.message.confirm( message );

            if ( !confirm ) return mergedLayer;

            if ( Hoot.ui.managePanel.isOpen ) {
                Hoot.ui.navbar.toggleManagePanel();
            }

            mergedLayer.merged = true;
            mergedLayer.color  = 'green';

            d3.selectAll( '.layer-loading' ).remove();
            d3.selectAll( '.layer-add' ).remove();
            Hoot.ui.sidebar.removeLayerAddForms();

            let params = {
                name: mergedLayer.name,
                color: 'green',
                isConflate: true
            };

            Hoot.ui.sidebar.forms.conflate.forceAdd( params );
            Hoot.layers.mergedLayer = mergedLayer;

            let input1     = tags.input1,
                input2     = tags.input2,
                input1Name = tags.input1Name,
                input2Name = tags.input2Name;

            if ( (input1 && input1Name) && (input2 && input2Name) ) {
                let params1 = {
                    name: input1Name,
                    id: input1,
                    color: 'violet'
                };

                let params2 = {
                    name: input2Name,
                    id: input2,
                    color: 'orange'
                };

                Promise.all( [
                    this.loadLayer( params1 ),
                    this.loadLayer( params2 )
                ] ).then( layers => {
                    this.hideLayer( layers[ 0 ].id );
                    this.hideLayer( layers[ 1 ].id );
                } );
            } else {
                let params,
                    message,
                    type = 'warn';

                if ( input1 && input1Name ) {
                    params = {
                        name: input1Name,
                        id: input1,
                        color: 'violet'
                    };

                    message = 'Could not determine input layer 2. It will not be loaded.';

                    Hoot.message.alert( { message, type } );
                } else if ( input2 && input2Name ) {
                    params = {
                        name: input2Name,
                        id: input2,
                        color: 'orange'
                    };

                    message = 'Could not determine input layer 1. It will not be loaded.';

                    Hoot.message.alert( { message, type } );
                } else {
                    message = 'Could not determine input layers 1 or 2. Neither will not be loaded.';

                    Hoot.message.alert( { message, type } );
                }

                this.loadLayer( params )
                    .then( layer => this.hideLayer( layer.id ) );
            }

            return mergedLayer;
        }
    }

    /**
     * Remove a layer from the list of all available layers
     *
     * @param id - layer ID
     */
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

    removeAllLoadedLayers() {
        _forEach( this.loadedLayers, layer => {
            this.hoot.context.background().removeSource( layer.id );
            this.hootOverlay.removeGeojson( layer.id );
        } );

        this.loadedLayers = {};

        this.hoot.context.flush();
        this.hoot.ui.sidebar.reset();
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
                //TODO: get back to this
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
