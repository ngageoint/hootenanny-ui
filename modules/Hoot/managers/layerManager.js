/*******************************************************************************************************
 * File: layerManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/22/18
 * @apiNote Changelog: <br>
 *      Milla Zagorski 8-10-2022: Added code to allow for opening the initial review layer in JOSM. <br>
 *
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
import { geoBounds as d3_geoBounds } from 'd3-geo';

import { geoExtent as GeoExtent } from '../../geo/index';
import { utilDetect }             from '../../util/detect';
import colorPalette               from '../config/colorPalette';

import AdvancedOpts               from '../ui/sidebar/advancedOpts';
import { osmChangeset } from '../../osm';

import {
    actionDiscardTags,
    actionNoop
} from '../../actions';

import {
    utilQsString,
    utilStringQs
} from '../../util';

import {
    polyStringToCoords, polyStringToCoordsList
} from '../tools/utilities';
import _cloneDeep from 'lodash-es/cloneDeep';

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
        this.topLayer           = null;
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
                    //check that hash layer exists
                    let mapId = this.hashLayers[k];
                    if (this.findBy( 'id', mapId)) {
                        this.addHashLayer(k, mapId);
                    } else {

                        Hoot.message.alert({
                            message: `Could not find layer to load with map ID ${mapId}`,
                            type: 'warn'
                        });
                        delete this.hashLayers[k];
                        //update url hash
                        var q = utilStringQs(window.location.hash.substring(1));
                        delete q[(k === 'reference') ? 'primary' : k];
                        window.location.replace('#' + utilQsString(q, true));
                    }
                });

                this.hashLayers = {};
            }

            return this.allLayers;
        } catch ( err ) {
            Hoot.message.alert( err );
        }
    }

    /**
     * Check name of file being uploaded. If it is a duplicate,
     * append a number to the end of the file's name
     *
     * @param layerName - layerName
     */

    checkLayerName(layerName) {
        let usedNumbers = [];
        let regex = /(.+)\s\((\d+)\)$/; /*group 1 is the name and 2 is the number*/
        let matcher = regex.exec(layerName);
        let namePart = layerName;
        if (matcher) namePart = matcher[1];

        for (let i = 0; i < Hoot.layers.allLayers.length; i++) {
            let checkedLayer = Hoot.layers.allLayers[i].name;
            if ( checkedLayer === namePart ) {
                usedNumbers.push(0);
            } else if (new RegExp(namePart + '\\s\\(\\d+\\)$').test(checkedLayer)) {
                let checkedMatcher = regex.exec(checkedLayer);
                usedNumbers.push(Number(checkedMatcher[2]));
            }
        }

        //get lowest available number to deconflict filenames
        let num = usedNumbers.sort((a, b) => a - b).findIndex( (n, i) => {
            return n > i;
        });

        //if not found, there are no unused so use length
        if (num === -1) num = usedNumbers.length;

        // if zero, then the name without number is available
        return (num === 0) ? namePart : `${namePart} (${num})`;
    }

    async addHashLayer(type, mapId, skipCheckForReview = false) {
        Hoot.ui.sidebar.forms[ type ].submitLayer( { id: mapId, name: this.findBy( 'id', mapId).name }, skipCheckForReview );
    }

    findBy( key, val ) {
        return _find( this.allLayers, layer => layer[ key ] === val );
    }

    findLoadedBy( key, val ) {
        return _find( this.loadedLayers, layer => layer[ key ] === val );
    }

    //returns grail reference layers that have a bounds (i.e. were pulled from an api by bounds)
    //and are not same as the secondary input layer
    //and have a bounds that fully contains the bounds (or mbr extent) of the secondary input layer
    grailReferenceLayers( lyr ) {
        let extBounds;
        // if contains ';' then bounds is polygon, else bbox
        if ( lyr.bounds.includes(';') ) {
            const polyCoords = polyStringToCoords( lyr.bounds );
            extBounds = new GeoExtent(d3_geoBounds({ type: 'LineString', coordinates: polyCoords }));
        } else {
            const bboxCoords = lyr.bounds.split(',').map( data => +data );
            extBounds = new GeoExtent([ bboxCoords[0], bboxCoords[1] ], [ bboxCoords[2], bboxCoords[3] ]);
        }

        return this.allLayers.filter( d => d.grailReference && d.bounds && d.id !== lyr.id )
            .filter( d => {
                //the geo extent of the candidate reference layer
                //i.e. the one to be replaced in derive changeset replacement
                const bounds = d.bounds;
                let extLayer;
                if ( bounds.includes(';') ) {
                    const polyCoords = polyStringToCoords( lyr.bounds );
                    extLayer = new GeoExtent(d3_geoBounds({ type: 'LineString', coordinates: polyCoords }));
                } else {
                    const coords = bounds.split(',').map( data => +data );
                    extLayer = new GeoExtent([ coords[0], coords[1] ], [ coords[2], coords[3] ]);
                }

                return extLayer.contains(extBounds);
            });
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

        if (mbr.nodescount === 0) {
            let alert = {
                message: 'There are no features in the output.',
                type: 'warn'
            };

            Hoot.message.alert( alert );
        }

        let min = [ mbr.minlon, mbr.minlat ],
            max = [ mbr.maxlon, mbr.maxlat ];

        return new GeoExtent( min, max );
    }

    hashLayer( type, mapId ) {
        this.hashLayers[type] = parseInt(mapId, 10);
    }

    async loadLayer( params, skipCheckForReviewsAndZoom ) {
        //Some type checking
        if (typeof params.id !== 'number') {
            throw new Error('params.id must be a number');
        }
        try {
            let mapId       = params.id,
                tags        = await this.hoot.api.getMapTags( mapId ),
                layerExtent, polyCoords;

            let lyr = this.findBy( 'id', mapId);
            if (lyr.bounds) {
                if ( lyr.bounds.includes(';') ) {
                    polyCoords = polyStringToCoords(lyr.bounds);
                    layerExtent = new GeoExtent(d3_geoBounds({ type: 'LineString', coordinates: polyCoords }));
                } else {
                    const coords = lyr.bounds.split(',').map( d => +d );
                    layerExtent = new GeoExtent([ coords[0], coords[1] ], [ coords[2], coords[3] ]);
                    polyCoords = layerExtent.polygon();
                }
            } else {
                layerExtent = await this.layerExtent( mapId );
                polyCoords = layerExtent.polygon();
            }

            let layer = {
                name: params.name,
                id: params.id,
                refType: params.refType,
                color: params.color,
                isMerged: params.isMerged || false,
                layers: params.layers || [],
                extent: layerExtent,
                polygon: polyCoords,
                tags: tags,
                visible: true, // Denotes whether the layer is toggled on/off
                active: params.active || true // Whether the layer is loaded and can be toggled on/off
            };

            //update url hash
            if (params.refType) {
                var q = utilStringQs(window.location.hash.substring(1));
                //special handling for postConflate merged layer
                if (params.refType === 'merged') { //a merged layer in postConflate becomes the primary
                                                   //simply so a refresh restores the layer state of the app
                    q.primary = mapId;
                    delete q.secondary;
                } else {
                    //if a merged layer is loaded, the input layers (primary, secondary) are not added
                    //to the url hash
                    if (!this.findLoadedBy('refType', 'merged')) {
                        q[params.refType] = mapId;
                    }
                }

                window.location.replace('#' + utilQsString(q, true));
            }

            if (!skipCheckForReviewsAndZoom) {
                layer = await this.checkForReview( layer );
            }

            this.loadedLayers[ layer.id ] = layer;

            if (layerExtent.toParam() !== '-180,-90,180,90') {
                if (Object.keys(this.loadedLayers).length === 1 //only zoom to the first layer loaded
                        && !layer.isMerged //or if showing a merged layer because 3 layers will have been loaded
                        && !skipCheckForReviewsAndZoom //but only if not toggling between merged layer and inputs
                    ) {
                    this.hoot.context.extent(layerExtent);
                }
            }

            if ( !this.hootOverlay ) {
                this.hootOverlay = this.hoot.context.layers().layer( 'hoot' );
            }

            // Check if layers bounds is multiple polygon and get array
            let coordsList;
            if ( lyr.bounds && lyr.bounds.includes( ';' ) ) {
                coordsList = polyStringToCoordsList( lyr.bounds );
            } else {
                coordsList = _cloneDeep( [ polyCoords ] );
            }

            let featuresList = coordsList.map( coords => {
                return {
                    type: 'Feature',
                    properties: {
                        name: layer.name,
                        mapId: layer.id
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: coords
                    }
                };
            } );

            this.hootOverlay.geojson( {
                type: 'FeatureCollection',
                features: featuresList,
            } );

            this.setLayerColor( mapId, layer.color );

            return layer;
        } catch ( err ) {
            window.console.error(err);
        }
    }

    async checkForReview( mergedLayer ) {
        let tags            = mergedLayer.tags,
            reviewStats     = await Hoot.api.getReviewStatistics( mergedLayer.id ),
            unreviewedCount = reviewStats.unreviewedCount;

        mergedLayer.hasReviews = unreviewedCount > 0;

        if ( !(mergedLayer.hasReviews) && !(tags.input1 || tags.input2) ) return mergedLayer;

        let message, confirm;
        if (mergedLayer.hasReviews) {
            message = 'The layer contains unreviewed items. Do you want to go into review mode?';
            confirm = await Hoot.message.confirmEditor( message, mergedLayer );

            if (confirm === 'josm') return mergedLayer;

        } else {
            message = 'The layer has been conflated. Do you want to view it as a merged layer?';
            confirm = await Hoot.message.confirm( message );
        }
        if ( !confirm ) return mergedLayer;

        if ( Hoot.ui.managePanel.isOpen ) {
            Hoot.ui.navbar.toggleManagePanel();
        }

        if (unreviewedCount > 0) {

            //Get an initial review item
            //and zoom to it's bounds
            let mapId = mergedLayer.id;
            let sequence = -999;
            let direction = 'forward';
            let reviewItem = (Hoot.ui.conflicts.data.forcedReviewItem) ? Hoot.ui.conflicts.data.forcedReviewItem
                                : await Hoot.api.getNextReview( {mapId, sequence, direction} );
            let reviewBounds = reviewItem.bounds.split(',').map(parseFloat);
            let min = [ reviewBounds[0], reviewBounds[1] ],
                max = [ reviewBounds[2], reviewBounds[3] ];
            let reviewExtent = new GeoExtent( min, max );
            this.hoot.context.extent(reviewExtent);

            mergedLayer.reviewItem = reviewItem;
            mergedLayer.reviewStats = reviewStats;

        }

        mergedLayer.isMerged = true;
        mergedLayer.color  = 'green';
        mergedLayer.refType = 'merged';

        d3.selectAll( '.layer-loading' ).remove();
        d3.selectAll( '.layer-add' ).remove();
        Hoot.ui.sidebar.removeLayerAddForms();

        let params = {
            name: mergedLayer.name,
            color: 'green',
            isMerged: true
        };

        Hoot.ui.sidebar.forms.conflate.forceAdd( params );
        Hoot.layers.mergedLayer = mergedLayer;

        let input1     = Number(tags.input1),
            input2     = Number(tags.input2),
            input1Name = tags.input1Name,
            input2Name = tags.input2Name;

        if ( (input1 && input1Name) && (input2 && input2Name) ) {
            let params1 = {
                name: input1Name,
                id: input1,
                color: 'violet',
                refType: 'primary'
            };

            let params2 = {
                name: input2Name,
                id: input2,
                color: 'orange',
                refType: 'secondary'
            };

            Promise.all( [
                this.loadLayer( params1, true ),
                this.loadLayer( params2, true )
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
                    color: 'violet',
                    retType: 'primary'
                };

                message = 'Could not determine input layer 2. It will not be loaded.';

                Hoot.message.alert( { message, type } );
            } else if ( input2 && input2Name ) {
                params = {
                    name: input2Name,
                    id: input2,
                    color: 'orange',
                    refType: 'secondary'
                };

                message = 'Could not determine input layer 1. It will not be loaded.';

                Hoot.message.alert( { message, type } );
            } else {
                message = 'Could not determine input layers 1 or 2. Neither will not be loaded.';

                Hoot.message.alert( { message, type } );
            }

            if (params) {
                this.loadLayer( params )
                .then( layer => this.hideLayer( layer.id ) );
            } else {
                //Set layer colors manually since loadLayers won't be called
                this.setLayerColor( '1', 'violet' );
                this.setLayerColor( '2', 'orange' );
            }
        }

        return mergedLayer;
    }

    /**
     * Remove a layer from the list of all available layers
     *
     * @param id - layer ID
     */
    removeLayer( id ) {
        _remove( this.allLayers, layer => layer.id === id );
    }

    removeLoadedLayer( id, toggle ) {
        if ( id && this.loadedLayers[ id ] ) {
            // toggle adv opts panel if visible
            let advOptsPanel = AdvancedOpts.getInstance();
            if (advOptsPanel.isOpen) {
                advOptsPanel.toggle();
            }
            if (this.loadedLayers[ id ].isMerged && this.mergedLayer) {
                this.removeLoadedLayer(this.mergedLayer.tags.input1);
                this.removeLoadedLayer(this.mergedLayer.tags.input2);
            }

            delete this.loadedLayers[ id ];
            this.hootOverlay.removeGeojson( id );

            this.hoot.context.flush();
        }
        if (!toggle)
            this.hoot.events.emit( 'loaded-layer-removed' );
    }

    removeActiveLayer(layerId, refId, refType) {
        Hoot.layers.removeLoadedLayer( layerId );
        Hoot.ui.sidebar.layerRemoved( {
            id: refId,
            refType: refType
        } );
    }

    removeAllLoadedLayers() {
        _forEach( this.loadedLayers, layer => {
            this.hootOverlay.removeGeojson( layer.id );
        } );

        this.loadedLayers = {};

        this.hoot.context.flush();
        this.hoot.ui.sidebar.reset();

        this.hoot.events.emit( 'loaded-layer-removed' );
    }

    hideLayer( id ) {
        this.hoot.layers.loadedLayers[ id ].visible = false;
        this.hoot.layers.loadedLayers[ id ].active = false;

        d3.select( '#map' ).selectAll( `[class*="_${ id }-"]` ).remove();

        this.hootOverlay.removeGeojson( id );

        this.hoot.context.connection().removeTile( id );
        this.hoot.context.flush();
    }

    showLayer( id ) {
        this.hoot.layers.loadedLayers[ id ].visible = true;
        this.hoot.layers.loadedLayers[ id ].active = true;
        this.hoot.context.flush();
    }

    toggleLayerVisibility( layer ) {
        const isVisible = layer.visible = !layer.visible,
              id = layer.id;

        let selector;

        if ( layer.refType === 'merged' ) {
            const { input1, input2 } = layer.tags;
            selector = `.tag-hoot-${id},.tag-hoot-${input1},.tag-hoot-${input2}`;
        } else {
            selector = `.tag-hoot-${id}`;
        }

        if (isVisible) {
            d3.selectAll(selector).attr('display','');
        } else {
            d3.selectAll(selector).attr('display','none');
        }
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

        let cssRuleIndex = Math.max(0, sheets.cssRules.length - 1);
        sheets.insertRule( 'path.stroke.tag-hoot-' + mapId + ' { stroke:' + color + '}', cssRuleIndex );
        sheets.insertRule( 'path.shadow.tag-hoot-' + mapId + ' { stroke:' + lighter + '}', cssRuleIndex );
        sheets.insertRule( 'path.fill.tag-hoot-' + mapId + ' { fill:' + lighter + '}', cssRuleIndex );
        sheets.insertRule( 'g.point.tag-hoot-' + mapId + ' .stroke { fill:' + color + '}', cssRuleIndex );
    }

    setTopLayer( mapId ) {
        this.topLayer = mapId;
        this.hoot.context.change();
    }

    getTopLayer() {
        return this.topLayer;
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
