/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

import axios         from 'axios/dist/axios';
import { apiConfig } from '../config/apiConfig';
import { saveAs }    from 'file-saver';

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

        let mergePortOrPath = function( p ) {
            return isNaN( p ) ? { pathname: p + '/' } : { port: p };
        };

        this.baseUrl = this.config.path;

        this.mergeUrl       = Object.assign( new URL( this.host ), mergePortOrPath( this.config.mergeServerPort ) );
        this.translationUrl = Object.assign( new URL( this.host ), mergePortOrPath( this.config.translationServerPort ) );

        this.queryInterval = this.config.queryInterval;
        this.intervals     = {};
        this.conflateTypes = null;
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
            params: params.params,
            responseType: params.responseType
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
                } else if ( status === 'cancelled' ) {
                    clearInterval( this.intervals[ jobId ] );
                    res( { data, type: 'warn', status: 200 } );
                } else if ( status === 'failed' ) {
                    clearInterval( this.intervals[ jobId ] );
                    rej( { data, type: 'error', status: 500 } );
                } else {
                    // TODO: handle warning
                }
            }, this.queryInterval );
        } );
    }

    getConflateTypes() {

        if ( this.conflateTypes ) {
            return Promise.resolve( this.conflateTypes );
        } else {
            const params = {
                path: '/info/advancedopts/conflationtypes',
                method: 'GET'
            };
            let that = this;
            return this.request( params ).then( resp => {
                that.conflateTypes = resp.data;
                return that.conflateTypes;
            });
        }

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
            path: `/auth/oauth1/verify?oauth_token=${ oauth_token }&oauth_verifier=${ oauth_verifier }`,
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
            path: `/job/status/${ id }?includeCommandDetail=true`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                if (!err.message) err.message = 'Unable to retrieve job status';

                return Promise.reject( err );
            } );
    }

    getJobError( id ) {
        const params = {
            path: `/job/error/${ id }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    deleteJobStatus( id ) {
        const params = {
            path: `/job/${ id }`,
            method: 'DELETE'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    cancelJob( id ) {
        const params = {
            path: `/job/cancel/${ id }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getJobsHistory() {
        const params = {
            path: '/jobs/history',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getJobsRunning() {
        const params = {
            path: '/jobs/running',
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

                if ( !layers || !layers.length ){
                    return resp.data;
                } else {
                    return layers;
                }
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
            .then( resp =>
                resp.data.sort( ( a, b ) => {
                    // Set undefined to false
                    if ( !a.DEFAULT ) a.DEFAULT = false;
                    if ( !b.DEFAULT ) b.DEFAULT = false;
                    // We check DEFAULT property, putting true first
                    if ( a.DEFAULT !== b.DEFAULT ) {
                        return ( a.DEFAULT ) ? -1 : 1;
                    } else {
                        // We only get here if the DEFAULT prop is equal
                        return d3.ascending( a.NAME.toLowerCase(), b.NAME.toLowerCase() );
                    }
                } ) );
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
            .catch( () => {
                return {
                    'minlon': -180,
                    'minlat': -90,
                    'maxlon': 180,
                    'maxlat': 90,
                    'nodescount': 0
                };
            } );
    }

    getMapSizes() {
        const params = {
            path: '/info/map/sizes',
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
                NONE_TRANSLATION: data.NONE_TRANSLATION,
                FOLDER_ID: data.folderId
            },
            data: data.formData
        };

        return this.request( params );
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
                window.console.log( err );

                return {
                    message: `Failed to modify item: ${ modName }`,
                    status: 500,
                    type: 'error'
                };
            } );
    }

    saveDataset( id, name ) {
        const params = {
            path: `/job/export/${id}?outputname=${name}&removecache=true`,
            responseType: 'arraybuffer',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                let fileBlob = new Blob( [ resp.data ], { type: 'application/zip' } );
                saveAs( fileBlob, name );
            });
    }

    exportDataset( data ) {
        data.tagoverrides =  JSON.stringify(
            Object.assign(data.tagoverrides || {}, {
                // 'error:circular':'',
                // 'hoot:building:match':'',
                // 'hoot:status':'',
                // 'hoot:review:members':'',
                // 'hoot:review:score':'',
                // 'hoot:review:note':'',
                // 'hoot:review:sort_order':'',
                // 'hoot:review:type':'',
                // 'hoot:review:needs':'',
                // 'hoot:score:match':'',
                // 'hoot:score:miss':'',
                // 'hoot:score:review':'',
                // 'hoot:score:uuid':''
            })
        );

        const requiredKeys = [
            'append',
            'includehoottags',
            'input',
            'inputtype',
            'outputname',
            'outputtype',
            'tagoverrides',
            'textstatus' ,
            'translation'
        ];

        if (!requiredKeys.every( k => data.hasOwnProperty(k) )) {
            return Promise.reject( new Error( ' invalid request payload' ) );
        }

        const params = {
            path: '/job/export/execute',
            method: 'POST',
            data: data
        };

        if ( data.inputtype === 'folder' ) {
            params.path = `${params.path}?ext=zip`;
        }

        return this.request( params );
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
                    type: 'success'
                };
            } )
            .catch( err => {
                window.console.log( err );

                return {
                    message: `Failed to update folder: ${ folderId }`,
                    type: 'error'
                };
            } );
    }

    updateVisibility( { folderId, visibility } ) {
        const params = {
            path: `/osm/api/0.6/map/folders/${ folderId }/visibility/${ visibility }`,
            method: 'PUT'
        };

        return this.request( params )
            .then( () => {
                return {
                    message: `Successfully updated visibility of folder: ${ folderId } to ${ visibility }`,
                    type: 'success'
                };
            } )
            .catch( err => {
                window.console.log( err );

                return {
                    message: `Failed to change visibility of folder: ${ folderId } to ${ visibility }`,
                    type: 'error'
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

        return this.request( params );
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

        if ( !isPublic ) {
            params.path += '?isPublic=false';
        }

        return this.request( params )
            .then( resp => resp.data );
    }

    updateMapFolderLinks( { mapId, folderId } ) {
        if ( !mapId || folderId < 0 ) return Promise.resolve( 'Map or folder id invalid' );

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

    getAdvancedOptions(type) {
        const params = {
            path: `/info/advancedopts/getoptions?conftype=${type}`,
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
    deleteLayer( layerId ) {
        const params = {
            path: `/osm/api/0.6/map/${ layerId }`,
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

        return this.request( params );
    }

    clipDataset( data ) {
        const params = {
            path: '/job/clipdataset/execute',
            method: 'POST',
            data
        };

        return this.request( params );
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
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error saving review!',
                    type: 'error'
                };
            } );
    }

    grailPullOverpassToDb( data ) {
        const params = {
            path: `/grail/pulloverpasstodb?bbox=${ data.BBOX }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Pull from Overpass API has succeeded.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error doing pull!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }


    grailPullRailsPortToDb( data ) {
        const params = {
            path: `/grail/pullrailsporttodb?bbox=${ data.BBOX }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Pull from Rails Port API has succeeded.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error doing pull!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    createDifferential( data ) {
        const params = {
            path: '/grail/createdifferential',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Differential for selected region created.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                const message = err.data,
                      status  = err.status,
                      type    = err.type;

                return Promise.reject( { message, status, type } );
            } );
    }

    differentialStats( jobId, includeTags ) {
        const params = {
            path: `/grail/differentialstats?jobId=${ jobId }&includeTags=${ includeTags }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Differential stats retrieved.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                const message = err.data,
                      status  = err.status,
                      type    = err.type;

                return Promise.reject( { message, status, type } );
            } );
    }

    differentialPush( data ) {
        const params = {
            path: '/grail/differentialpush',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Differential push complete.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                const message = err.data,
                      status  = err.status,
                      type    = err.type;

                return Promise.reject( { message, status, type } );
            } );
    }

    conflateDifferential( data ) {
        const params = {
            path: '/grail/conflatedifferential',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Conflate differential has succeeded.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error doing Conflate differential!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    conflationUpload( data ) {
        const params = {
            path: '/grail/conflatepush',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Conflation Upload has succeeded.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error doing Conflation Upload!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    /****************** TRANSLATIONS *******************/

    getCapabilities() {
        const params = {
            url: `${ this.translationUrl }capabilities`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    searchTranslatedSchema( data ) {
        const params = {
            url: `${ this.translationUrl }schema`,
            method: 'GET',
            params: {
                ...data
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => window.console.log( err ) );
    }

    translateFromXml( xml, translation ) {
        const params = {
            url: `${ this.translationUrl }translateFrom`,
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
            .catch( err => window.console.log( err ) );
    }

    translateToXml( xml, translation ) {
        const params = {
            url: `${ this.translationUrl }translateTo`,
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
            .catch( err => window.console.log( err ) );
    }

    translateToJson( p ) {
        const params = {
            url: `${ this.translationUrl }translateTo`,
            method: 'GET',
            params: {
                ...p
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => window.console.log( err ) );
    }

}
