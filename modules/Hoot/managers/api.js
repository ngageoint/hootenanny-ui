/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

import _assign from 'lodash-es/assign';
import _find   from 'lodash-es/find';
import _map    from 'lodash-es/map';

import axios         from 'axios/dist/axios';
import { apiConfig } from '../config/apiConfig';

/**
 * API calls to backend services
 *
 * @returns {class} - API
 * @constructor
 */
export default class API {
    constructor() {
        this.config = apiConfig;

        this.host = this.config.host;

        // this.baseUrl = Object.assign( new URL( this.host ), {
        //     port: this.config.port,
        //     pathname: this.config.path
        // } );
        //
        // this.mergeUrl = Object.assign( new URL( this.host ), {
        //     port: this.config.mergeServerPort
        // } );
        //
        // this.translationUrl = Object.assign( new URL( this.host ), {
        //     port: this.config.translationServerPort,
        //     pathname: this.config.translationServerPath
        // } );

        // console.log( `${ this.translationUrl.href }`)

        this.baseUrl        = `${ this.host }:${ this.config.port }${ this.config.path }`;
        this.translationUrl = `${ this.host }:${ this.config.translationServerPort }${ this.config.translationServerPath }`;
        this.mergeUrl       = `${ this.host }:${ this.config.mapnikServerPort }`;

        this.queryInterval = this.config.queryInterval;
        this.intervals     = {};
    }

    /**
     * Submit a request
     *
     * @param params - request data
     * @returns {Promise} - request
     */
    request( params ) {
        return axios( {
            url: params.url || `${ this.baseUrl }${ params.path }`,
            method: params.method || 'GET',
            headers: params.headers,
            data: params.data,
            params: params.params
        } ).catch( err => {
            let { response } = err;
            let data, message, status, statusText, type;

            if ( response ) {
                data       = response.data;
                message    = response.message;
                status     = response.status;
                statusText = response.statusText;
                type       = 'error';
            } else {
                message = err.message;
                status  = 500;
                type    = 'error';
            }

            if ( status === 401 && statusText === 'Unauthorized' ) {
                window.location.replace( 'login.html' );
            }

            return Promise.reject( { data, message, status, type } );
        } );
    }

    internalError( { response } ) {
        if ( response.status > 500 ) {
            return 'API is not responding. Please try again later.';
        } else {
            return false;
        }
    }

    /**
     * Recursively poll the backend to check the status of a job
     *
     * @param jobId
     * @returns {Promise<any>}
     */
    statusInterval( jobId ) {
        return new Promise( ( res, rej ) => {
            this.intervals[ jobId ] = setInterval( async () => {
                let data   = await this.getJobStatus( jobId ),
                    status = data.status;

                if ( status === 'running' ) return;

                if ( status === 'complete' ) {
                    clearInterval( this.intervals[ jobId ] );
                    res( { data, type: 'success', status: 200, jobId } );
                } else if ( status === 'failed' ) {
                    clearInterval( this.intervals[ jobId ] );
                    rej( { data, type: 'error', status: 500 } );
                } else {
                    // TODO: handle warning
                }
            }, this.queryInterval );
        } );
    }

    getSaveUser( userEmail ) {
        const params = {
            path: '/osm/user',
            method: 'POST',
            params: {
                userEmail
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getAllUsers() {
        const params = {
            path: '/osm/user/all',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getOAuthRedirectUrl() {
        const params = {
            path: '/auth/oauth1/request',
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain'
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    verifyOAuth( oauth_token, oauth_verifier ) {
        const params = {
            path: `/auth/oauth1/verify?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    logout() {
        const params = {
            path: '/auth/oauth1/logout',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get the status of an ongoing backend job
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

    getCoreVersionInfo() {
        const params = {
            path: '/info/about/coreVersionInfo',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                const message = this.internalError( err ) || 'Unable to get Hootenanny core info';

                return Promise.reject( message );
            } );
    }

    getServicesVersionInfo() {
        const params = {
            path: '/info/about/servicesVersionInfo',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                const message = this.internalError( err ) || 'Unable to get Hootenanny services info';

                return Promise.reject( message );
            } );
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
                let layers = resp.data.layers;

                if ( !layers || !layers.length )
                    return resp.data;

                return this.getMapSizes( _map( layers, 'id' ) )
                    .then( sizeInfo => {
                        _map( layers, layer => {
                            _assign( layer, _find( sizeInfo.layers, { id: layer.id } ) );
                        } );

                        return layers;
                    } )
                    .catch( () => {
                        //TODO: handle this properly
                        return layers;
                    } );
            } )
            .catch( err => {
                if ( err ) throw new Error( err );

                let message, type;

                message = 'Unable to retrieve layers';
                type    = 'error';

                return Promise.reject( { message, type } );
            } );
    }

    /**
     * Get all layer links from the database
     *
     * @returns {Promise|array} - links
     */
    getLinks() {
        const params = {
            path: '/osm/api/0.6/map/folders/linked',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                const message = this.internalError( err ) || 'Unable to retrieve layer links';

                return Promise.reject( message );
            } );
    }

    /**
     * Get all translations
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

    getTranslation( name ) {
        const params = {
            path: `/ingest/customscript/getscript?SCRIPT_NAME=${ name }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getDefaultTranslation( path ) {
        const params = {
            path: `/ingest/customscript/getdefaultscript?SCRIPT_PATH=${ path }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getBasemaps() {
        const params = {
            path: '/ingest/basemap/getlist',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getReviewBookmarks( bookmarkId ) {
        const path = bookmarkId ? `get?bookmarkId=${ bookmarkId }` : 'getall';

        const params = {
            path: `/job/review/bookmarks/${ path }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    deleteReviewBookmark( bookmarkId ) {
        const params = {
            path: '/job/review/bookmarks/delete',
            method: 'DELETE',
            params: {
                bookmarkId
            }
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Bookmark successfully deleted.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error deleting bookmark. Please try again later.',
                    status: err.status || 500,
                    type: 'error'
                };
            } );
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

    /**
     * Get map tags using map ID
     *
     * @param mapId
     * @returns {Promise<any>}
     */
    getMapTags( mapId ) {
        const params = {
            path: `/osm/api/0.6/map/${ mapId }/tags`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                let { response } = err,
                    message, status, type;

                if ( response.status === 404 ) {
                    message = `Layer ID = ${ mapId } does no exist! It may have possibly been removed.`;
                    status  = response.status;
                    type    = 'error';
                }

                return Promise.reject( { message, status, type } );
            } );
    }

    getMbr( mapId ) {
        const params = {
            path: `/osm/api/0.6/map/${ mapId }/mbr`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                return {
                    'minlon': -180,
                    'minlat': -90,
                    'maxlon': 180,
                    'maxlat': 90,
                    'nodescount': 0
                };
            } );
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

    getMapSizeThresholds() {
        const params = {
            path: '/info/map/thresholds',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get statistics on conflicts review process to see how many reviews are left
     * and how many have already been resolved
     *
     * @param mapId
     * @returns {Promise<any>}
     */
    getReviewStatistics( mapId ) {
        const params = {
            path: `/job/review/statistics?mapId=${ mapId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getReviewRefs( queryElements ) {
        const params = {
            path: '/job/review/refs',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                queryElements
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getReviewItem( data ) {
        const params = {
            path: '/job/review/reviewable',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                mapid: data.mapId,
                offsetseqid: data.sequence
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get next review item in current conflicts review process
     *
     * @param mapId
     * @param sequence
     * @param direction
     * @returns {Promise<any>}
     */
    getNextReview( { mapId, sequence, direction } ) {
        const params = {
            path: `/job/review/next?mapid=${ mapId }&offsetseqid=${ sequence }&direction=${ direction }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getSchemaAttrValues( jobId ) {
        const params = {
            path: `/ogr/info/${ jobId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Upload imported files to the database
     *
     * @param data - upload data
     * @returns {Promise} - request
     */
    uploadDataset( data ) {
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
                // USER_EMAIL: 'test@test.com',
                NONE_TRANSLATION: data.NONE_TRANSLATION
            },
            data: data.formData
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data[ 0 ].jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Dataset successfully imported',
                    status: 200,
                    type: resp.type,
                    jobId: resp.jobId
                };
            } )
            .catch( err => {
                console.log( err );
                return Promise.reject( {
                    data: err.data,
                    message: 'Failed to import dataset!',
                    status: err.status,
                    type: err.type
                } );
            } );
    }

    modify( { mapId, modName, inputType } ) {
        let basePath = '/osm/api/0.6/map';

        if ( inputType === 'folder' ) {
            basePath += '/folders';
        }

        const params = {
            path: basePath + `/${ mapId }/rename/${ modName }`,
            method: 'PUT'
        };

        return this.request( params )
            .then( () => {
                return {
                    message: `Successfully modified item: ${ modName }`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                console.log( err );

                return {
                    message: `Failed to modify item: ${ modName }`,
                    status: 500,
                    type: 'success'
                };
            } );
    }

    updateFolder( { folderId, parentId } ) {
        const params = {
            path: `/osm/api/0.6/map/folders/${ folderId }/move/${ parentId }`,
            method: 'PUT'
        };

        return this.request( params )
            .then( () => {
                return {
                    message: `Successfully updated folder: ${ folderId }`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                console.log( err );

                return {
                    message: `Failed to update folder: ${ folderId }`,
                    status: 500,
                    type: 'success'
                };
            } );
    }

    /**
     * Upload imported schema files to the database for processing
     *
     * @param type - FILE | DIR
     * @param data - form data
     */
    uploadSchemaData( type, data ) {
        const params = {
            path: `/ogr/info/upload?INPUT_TYPE=${ type }`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobId ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Schema data uploaded',
                    status: 200,
                    type: resp.type,
                    jobId: resp.jobId
                };
            } )
            .catch( err => {
                console.log( err );
                let message, status, type;

                status = err.status;
                type   = err.type;

                if ( status >= 500 ) {
                    message = 'Error during conflation! Please try again later.';
                } else {
                    message = 'Error while uploading schema data!';
                }

                return Promise.reject( { message, status, type } );
            } );
    }

    uploadBasemap( data ) {
        const params = {
            path: `/ingest/basemap/upload?INPUT_NAME=${ data.INPUT_NAME }`,
            method: 'POST',
            data: data.formData
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data[ 0 ].jobid ) );
    }

    enableBasemap( data ) {
        const params = {
            path: `/ingest/basemap/enable?NAME=${ data.name }&ENABLE=true`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    disableBasemap( data ) {
        const params = {
            path: `/ingest/basemap/enable?NAME=${ data.name }&ENABLE=false`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    postTranslation( data ) {
        let payload = data.data;

        const params = {
            path: `/ingest/customscript/save?SCRIPT_NAME=${ data.NAME }&SCRIPT_DESCRIPTION=${ data.DESCRIPTION }`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            data: payload
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
    addFolder( { folderName, parentId, isPublic } ) {
        if ( !folderName || parentId < 0 ) {
            return false;
        }

        const params = {
            path: `/osm/api/0.6/map/folders/add/${ parentId }/${ folderName }`,
            method: 'POST'
        };

        if ( isPublic ) {
            params.path += '?isPublic=false';
        }

        return this.request( params )
            .then( resp => resp.data );
    }

    updateMapFolderLinks( { mapId, folderId } ) {
        if ( !mapId || folderId < 0 ) return;

        const params = {
            path: `/osm/api/0.6/map/${ mapId }/move/${ folderId }`,
            method: 'PUT'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Get all folders from the database
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
     * Get missing features
     *
     * @param type - feature type (node | way | relation)
     * @param mapId - map ID
     * @param featIds - list of feature IDs to retrieve
     * @returns {Promise<any>}
     */
    getFeatures( type, mapId, featIds ) {
        const params = {
            path: `/osm/api/0.6/${ type }?mapId=${ mapId }&elementIds=${ featIds.join() }`,
            method: 'GET',
            headers: {
                'Content-Type': 'text/xml'
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getAdvancedOptions( confType = 'custom' ) {
        const params = {
            path: `/info/advancedopts/getoptions?conftype=${ confType }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Delete a layer from the database
     *
     * @param layerName - name of layer to delete
     * @returns {Promise<any>}
     */
    deleteLayer( layerName ) {
        const params = {
            path: `/osm/api/0.6/map/${ layerName }`,
            method: 'DELETE'
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) );
    }

    /**
     * Delete a folder from the database
     *
     * @param folderId - ID of folder to delete
     * @returns {Promise<any>}
     */
    deleteFolder( folderId ) {
        const params = {
            path: `/osm/api/0.6/map/folders/${ folderId }`,
            method: 'DELETE',
            params: {
                folderId
            }
        };

        return this.request( params );
    }

    deleteTranslation( name ) {
        const params = {
            path: `/ingest/customscript/deletescript?SCRIPT_NAME=${ name }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    deleteBasemap( name ) {
        const params = {
            path: `/ingest/basemap/delete?NAME=${ name }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Conflate layers together
     *
     * @param data
     * @returns {Promise<object>}
     */
    conflate( data ) {
        const params = {
            path: '/job/conflation/execute',
            method: 'POST',
            data
        };

        this.getAdvancedOptions();

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Conflation job complete',
                    status: 200,
                    type: resp.type
                };
            } )
            .catch( err => {
                let message, status, type;

                status = err.status;

                if ( status >= 500 ) {
                    message = 'Error during conflation! Please try again later.';
                    type    = err.type;
                }

                return Promise.reject( { message, status, type } );
            } );
    }

    clipDataset( data ) {
        const params = {
            path: '/job/clipdataset/execute',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) );
    }

    /**
     * Merge POI nodes together
     *
     * @param data
     * @returns {Promise<any>}
     */
    poiMerge( data ) {
        const params = {
            url: `${ this.mergeUrl }elementmerge`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml'
            },
            data
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    saveReviewBookmark( data ) {
        const params = {
            path: '/job/review/bookmarks/save',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify( data )
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Review has successfully been saved. It can be viewed in Manage Panel -> Review Bookmarks',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error saving review!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    /****************** TRANSLATIONS *******************/

    getCapabilities() {
        const params = {
            url: `${ this.translationUrl }/capabilities`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    searchTranslatedSchema( data ) {
        const params = {
            url: `${ this.translationUrl }/schema`,
            method: 'GET',
            params: {
                ...data
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => console.log( err ) );
    }

    translateFromXml( xml, translation ) {
        const params = {
            url: `${ this.translationUrl }/translateFrom`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml'
            },
            params: {
                translation
            },
            data: xml
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => console.log( err ) );
    }

    translateToXml( xml, translation ) {
        const params = {
            url: `${ this.translationUrl }/translateTo`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml'
            },
            params: {
                translation
            },
            data: xml
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => console.log( err ) );
    }

    translateToJson( p ) {
        const params = {
            url: `${ this.translationUrl }/translateTo`,
            method: 'GET',
            params: {
                ...p
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => console.log( err ) );
    }
}
