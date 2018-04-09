/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import axios         from 'axios/dist/axios';
import { apiConfig } from '../config/apiConfig';

/**
 * API calls to backend services
 *
 * @returns {class} - API
 * @constructor
 */
class API {
    constructor() {
        this.config  = apiConfig;
        this.baseUrl = `${ this.config.host }:${ this.config.port }/${ this.config.basePath }`;
    }

    /**
     * Submit a request
     *
     * @param params - request data
     * @returns {Promise} - request
     */
    request( params ) {
        return axios( {
            url: `${ this.baseUrl }${ params.path }`,
            method: params.method || 'GET',
            headers: params.headers,
            data: params.data,
            params: params.params
        } );
    }

    /**
     * Upload imported files to the database
     *
     * @param data - upload data
     * @returns {Promise} - request
     */
    upload( data ) {
        if ( !data.TRANSLATION || !data.INPUT_TYPE || !data.formData || !data.INPUT_NAME ) {
            return false;
        }

        const params = {
            path: '/ingest/ingest/upload',
            method: 'POST',
            params: {
                TRANSLATION: data.TRANSLATION,
                INPUT_TYPE: data.INPUT_TYPE,
                INPUT_NAME: data.INPUT_NAME,
                USER_EMAIL: 'test@test.com',
                NONE_TRANSLATION: data.NONE_TRANSLATION
            },
            data: data.formData
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Add a new folder to the database
     *
     * @param data - folder data
     * @returns {Promise} - request
     */
    addFolder( data ) {
        if ( !data.folderName || !(data.parentId >= 0) ) {
            return false;
        }

        const params = {
            path: '/osm/api/0.6/map/addfolder',
            method: 'POST',
            params: {
                folderName: data.folderName,
                parentId: data.parentId
            },
            data
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Retrieve all folders from the database
     *
     * @returns {Promise|array} - folders
     */
    getFolders() {
        const params = {
            path: '/osm/api/0.6/map/folders',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get all layers from the database
     *
     * @returns {Promise|array} - layers
     */
    getLayers() {
        const params = {
            path: '/osm/api/0.6/map/layers',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                let layers    = resp.data.layers,
                    layerList = [];

                if ( !layers || !layers.length )
                    return resp.data;

                return this.getMapSizes( _.map( layers, 'id' ) ).then( sizeInfo => {
                    _.map( layers, layer => {
                        _.assign( layer, _.find( sizeInfo.layers, { id: layer.id } ) );
                    } );

                    return layers;
                } );
            } );
    }

    /**
     * Get all links from the database
     *
     * @returns {Promise|array} - links
     */
    getLinks() {
        const params = {
            path: '/osm/api/0.6/map/links',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get all running translations
     *
     * @returns {Promise|array} - translations
     */
    getTranslations() {
        const params = {
            path: '/ingest/customscript/getlist',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Status of job
     *
     * @param id - job id
     * @returns {Promise} - job status
     */
    getJobStatus( id ) {
        const params = {
            path: `/job/status/${ id }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    // TODO: remove this if not needed
    getTileNodesCount( data ) {
        const params = {
            path: '/osm/api/0.6/map/nodescount',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            data
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getTags( mapId ) {
        const params = {
            path: `/osm/api/0.6/map/tags?mapid=${ mapId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getMbr( mapId ) {
        const params = {
            path: `/osm/api/0.6/map/mbr?mapId=${ mapId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                console.log( err );
                return {
                    'minlon': -180,
                    'minlat': -90,
                    'maxlon': 180,
                    'maxlat': 90,
                    'nodescount': 0
                };
            } );
    }

    getReviewStatistics( mapId ) {
        const params = {
            path: `/job/review/statistics?mapId=${ mapId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getMapSizes( mapIds ) {
        if ( !mapIds ) {
            return null;
        }
        const params = {
            path: `/info/map/sizes?mapid=${ mapIds }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    conflate( data ) {
        const params = {
            path: '/job/conflation/execute',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => resp.data );
    }
}

export default new API();