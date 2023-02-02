/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 * @apiNote Changelog: <br>
 *      Milla Zagorski 8-10-2022: Added code to allow for opening layer(s) in JOSM from initial conflation or Manage Panel. <br>
 *
 *******************************************************************************************************/
import axios         from 'axios/dist/axios';
import { apiConfig } from '../config/apiConfig';
import { saveAs }    from 'file-saver';
import { utilDetect } from '../../util/detect';

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
        this.detect = utilDetect();
        this.mergeUrl       = Object.assign( new URL( this.host ), mergePortOrPath( this.config.mergeServerPort ) );
        this.translationUrl = Object.assign( new URL( this.host ), mergePortOrPath( this.config.translationServerPort ) );
        this.tagInfoUrl     = this.config.tagInfoUrl;

        this.queryInterval = this.config.queryInterval;
        this.runTasksInterval = this.config.runTasksInterval;
        this.conflateTypes = null;
        this.importOpts = null;
        this.changesetOpts = null;
        this.defaultOverpassQuery = '';
    }

    /**
     * Submit a request
     *
     * If params.path is set then the request is sent to hoot services. Otherwise params.url is used as path
     *
     * @param params - request data
     * @returns {Promise} - request
     */
    request( params ) {
        const request = {
            url: params.url || `${ this.baseUrl }${ params.path }`,
            method: params.method || 'GET',
            headers: params.headers,
            data: params.data,
            params: params.params,
            responseType: params.responseType,
            cancelToken: params.cancelToken
        };

        return axios( request ).catch( err => {
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

            // only redirect to login page for unauthorized hoot services requests
            // the axios request may be to non hoot services endpoints (tasking manager for example) and if those
            // return a 401 there is no reason to logout of hootenanny
            if ( status === 401 && statusText === 'Unauthorized' && request.url.includes('/hoot-services') ) {
                window.location.replace( 'login.html' );
            }

            return Promise.reject( { data, message, status, type } );
        } );
    }

    internalError( { response } ) {
        if ( response && response.status > 500 ) {
            return 'Hoot API is not responding.';
        } else {
            return false;
        }
    }

    /**
     * Recursively poll the backend to check the status of a running job
     *
     * @param jobId
     * @returns {Promise<any>}
     */
    statusInterval( jobId ) {
        const poll = (res, rej) => {
            setTimeout( async () => {
                try {
                    let data   = await this.getJobStatus( jobId ),
                        status = data.status;

                    if ( status === 'running' ) {
                        poll(res, rej);
                        return;
                    }

                    if ( status === 'complete' ) {
                        res( { data, type: 'success', status: 200, jobId } );
                    } else if ( status === 'cancelled' ) {
                        res( { data, type: 'warn', status: 200 } );
                    } else if ( status === 'failed' ) {//add a 404 handler to ignore
                        Hoot.api.getJobError(jobId)
                                    .then( resp => {
                                        let message = resp.errors.join('\n');
                                        data.message = message;
                                        rej( { data, type: 'error', status: 500 } );
                                    } );
                    }
                } catch (err) {
                    let data = {};
                    rej( { data, type: 'error', status: 500 } );
                }
            }, this.queryInterval );
        };
        return new Promise( poll );
    }

    getConflateTypes(forceRefresh) {

        if ( this.conflateTypes && !forceRefresh) {
            return Promise.resolve( this.conflateTypes );
        } else {
            const params = {
                path: '/info/advancedopts/conflationtypes',
                method: 'GET'
            };
            let that = this;
            return this.request( params )
                .then( resp => {
                    that.conflateTypes = resp.data;
                    return that.conflateTypes;
                });
        }

    }

    getDefaultOverpassQuery() {
        if ( this.defaultOverpassQuery) {
            return Promise.resolve( this.defaultOverpassQuery );
        } else {
            const params = {
                path: '/grail/getDefaultOverpassQuery',
                method: 'GET'
            };
            let that = this;
            return this.request( params )
                .then( resp => {
                    that.defaultOverpassQuery = resp.data;
                    return that.defaultOverpassQuery;
                });
        }
    }

    getSaveUser( userEmail ) {
        const params = {
            path: '/osm/api/0.6/user',
            method: 'POST',
            params: {
                userEmail
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getAllUsers( data ) {
        const params = {
            path: '/osm/api/0.6/user/all',
            method: 'GET',
            params: data
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getPrivileges() {
        const params = {
            path: '/osm/api/0.6/user/getPrivileges',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    savePrivileges( data ) {
        const params = {
            path: '/osm/api/0.6/user/savePrivileges',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'User privileges saved',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                const message = err.data,
                      type = err.type;

                return Promise.reject( { message, type } );
            } );
    }

    getFavoriteAdvOpts() {
        const params = {
            path: '/osm/api/0.6/user/getFavoriteOpts',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    saveFavoriteOpts( opts ) {
        const params = {
            path: '/osm/api/0.6/user/saveFavoriteOpts',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(opts)

        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'User favorites saved',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error saving favorite opts!',
                    type: 'error'
                };
            } );
    }

    deleteFavoriteOpts( opts ) {
        const params = {
            path: '/osm/api/0.6/user/deleteFavoriteOpts',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(opts)
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'User favorites deleted',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    data: err.data,
                    message: 'Error deleting favorite opts!',
                    type: 'error'
                };
            } );
    }

    logout() {
        const params = {
            path: '/auth/oauth2/logout',
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

    getJobsHistory( data ) {
        const params = {
            path: '/jobs/history',
            method: 'GET',
            params: data
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

    authorize() {
        const params = {
            path: '/info/about/servicesVersionInfo',
            method: 'HEAD'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => {
                const message = this.internalError( err ) || 'Unauthenticated request to Hootenanny services';

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
                return resp.data.layers || [];
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
                    if ( !a.default ) a.default = false;
                    if ( !b.default ) b.default = false;
                    // We check default property, putting true first
                    if ( a.default !== b.default ) {
                        return ( a.default ) ? -1 : 1;
                    } else {
                        // We only get here if the default prop is equal
                        return d3.ascending( a.name.toLowerCase(), b.name.toLowerCase() );
                    }
                } ) );
    }

    getFieldMappings(schema) {
        const params = {
            url: `${ this.translationUrl }fieldMappings?translation=${ schema }`,
            method: 'GET'
        };
        return this.request( params )
            .then( resp => {
                return resp.data;
            });
    }

    getColumns(tagKey, schema) {
        const params = {
            url: `${ this.translationUrl }columns?translation=${ schema }&column=${ tagKey }`,
            method: 'GET'
        };
        return this.request( params )
            .then( resp => {
                return resp.data;
            });
    }
    getPopularOsmTags() {
        let osmTagUrl = `${ this.tagInfoUrl }/api/4/keys/all?sortname=count_all&sortorder=desc&page=1&rp=18&qtype=key`;
        const params = {
            url: osmTagUrl,
            method: 'GET'
        };
        return this.request( params )
            .then( resp => {
                return resp.data.data.map(d => d.key);
        });
    }

    getOsmTagValues( key ) {
        let osmTagUrl = `${this.tagInfoUrl}/api/4/key/values?key=${key}&filter=all&lang=en&sortname=count&sortorder=desc&page=1&rp=16&qtype=value`;
        const params = {
            url: osmTagUrl,
            method: 'GET'
        };
        return this.request( params )
            .then( resp => {
                return resp.data.data.map(d => d.value);
            });
    }

    getTranslation( name ) {
        const params = {
            path: `/ingest/customscript/getscript?scriptName=${ name }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getDefaultTranslation( path ) {
        const params = {
            path: `/ingest/customscript/getdefaultscript?scriptPath=${ path }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    postTranslation( data, paramData ) {
        let payload = data;

        const params = {
            path: '/ingest/customscript/save',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            params: paramData,
            data: payload
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    deleteTranslation( identifier ) {
        const params = {
            path: `/ingest/customscript/deletescript?scriptInfo=${ identifier }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( ( err ) => {
                err.message = err.data;
                Hoot.message.alert( err );
            });
    }

    deleteTranslationFolder( folderId ) {
        const params = {
            path: '/ingest/customscript/deleteFolder',
            method: 'DELETE',
            params: {
                folderId
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    createTranslationFolder( paramData ) {
        if ( !paramData.isPublic ) {
            paramData.isPublic = false;
        }

        const params = {
            path: '/ingest/customscript/createfolder',
            method: 'POST',
            params: paramData
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getTranslationFolders() {
        const params = {
            path: '/ingest/customscript/getFolders',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    modifyTranslation( data, paramData ) {
        const params = {
            path: '/ingest/customscript/modifyTranslation',
            method: 'PUT',
            params: paramData,
            data
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( ( err ) => {
                err.message = err.data;
                Hoot.message.alert( err );
            });
    }

    moveTranslationFolder( paramData ) {
        const params = {
            path: '/ingest/customscript/moveFolder',
            method: 'PUT',
            params: paramData
        };

        return this.request( params )
            .then( resp => {
                if ( resp.data.success === false ) {
                    const message = 'error moving translation folder',
                          type = 'error';

                    return Promise.reject( { message, type } );
                }

                return resp.data;
            } );
    }

    changeTranslationVisibility( paramData ) {
        const params = {
            path: '/ingest/customscript/changeVisibility',
            method: 'PUT',
            params: paramData
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

    getReviewBookmarks( paramData ) {
        const params = {
            path: '/job/review/bookmarks/getall',
            method: 'GET',
            params: paramData
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getBookmarkById( queryParams ) {
        const params = {
            path: '/job/review/bookmarks/get',
            method: 'GET',
            params: queryParams
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
                    message: 'Error deleting bookmark.',
                    status: err.status || 500,
                    type: 'error'
                };
            } );
    }

    getTileNodesCount( data, cancelToken ) {
        const params = {
            path: '/osm/api/0.6/map/nodescount',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data,
            cancelToken: cancelToken
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

    resolveAllReviews(mapId) {
        const params = {
            path: '/job/review/resolveall',
            method: 'PUT',
            data: {mapId: mapId}
        };

        return this.request( params )
            .then( resp => {
                if (resp.status !== 200) {
                    let alert = {
                        message: 'Failed to resolve all conflicts in review.',
                        type: 'warn'
                    };
                    Hoot.message.alert( alert );
                }
            });
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

    import( data, cancelToken ) {
        if (data.URL) {
            return this.remoteDataset( data, cancelToken );
        } else {
            return this.uploadDataset( data, cancelToken );
        }
    }

    /**
     * Upload imported files to the database
     *
     * @param data - upload data
     * @returns {Promise} - request
     */
    uploadDataset( data, cancelToken ) {
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
            data: data.formData,
            cancelToken: cancelToken
        };

        if ( data.ADV_UPLOAD_OPTS && data.ADV_UPLOAD_OPTS.length ) {
            params.params.ADV_UPLOAD_OPTS = data.ADV_UPLOAD_OPTS.join(',');
        }

        return this.request( params );
    }

    /**
     * Import remote file to the database
     *
     * @returns {Promise} - request
     */
    remoteDataset( data, cancelToken ) {
        if ( !data.TRANSLATION || !data.INPUT_NAME || !data.URL ) {
            return false;
        }

        const params = {
            path: '/ingest/ingest/remote',
            method: 'GET',
            params: {
                TRANSLATION: data.TRANSLATION,
                URL: data.URL,
                USERNAME: data.USERNAME,
                PASSWORD: data.PASSWORD,
                INPUT_NAME: data.INPUT_NAME,
                NONE_TRANSLATION: data.NONE_TRANSLATION,
                FOLDER_ID: data.folderId
            },
            cancelToken: cancelToken
        };

        if ( data.ADV_UPLOAD_OPTS && data.ADV_UPLOAD_OPTS.length ) {
            params.params.ADV_UPLOAD_OPTS = data.ADV_UPLOAD_OPTS.join(',');
        }

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
                    message: `Successfully renamed ${ inputType }`,
                    type: 'success'
                };
            } )
            .catch( err => {
                return Promise.reject({
                    message: err.data,
                    type: 'error'
                });
            } );
    }

    saveDataset( id, name ) {
        const params = {
            path: `/job/export/${id}?outputname=${name}`,
            responseType: 'arraybuffer',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                let fileBlob = new Blob( [ resp.data ], { type: 'application/zip' } );
                saveAs( fileBlob, name + '.zip' );
            });
    }

    openExportInJosm( id, name, ext ) {
        const params = {
            path: '/osm/api/0.6/user/session',
            method: 'GET'
        };

        //Open in JOSM needs url to end in .zip
        let absUrl = this.detect.absolute(this.detect.host, `${this.baseUrl}/job/export/${id}?outputname=${name}.${ext}.zip`);
        return this.request( params )
            .then( resp => {
                let openInJosmUrl = new URL('http://127.0.0.1:8111/import?'
                + `headers=Cookie,SESSION=${resp.data}`
                + '&new_layer=true'
                + `&layer_name=${name}`
                + `&url=${absUrl}`);

                this.callJosmRemoteControl(openInJosmUrl);
        });
     }

    saveChangeset( id, name, ext ) {
        const params = {
            path: `/job/export/${id}?outputname=${name || 'diff'}&ext=${ext || 'osc'}`,
            responseType: 'arraybuffer',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                let fileBlob = new Blob( [ resp.data ], { type: 'application/zip' } );
                saveAs( fileBlob, `changeset_${id}.osc.zip` );
            })
            .catch( err => {
                console.error(err);
                return Promise.reject({
                    message: 'Changeset file not found.',
                    type: 'error'
                });
            } );
    }

    exportDataset( data ) {

        const requiredKeys = [
            'input',
            'inputtype',
            'outputname',
            'outputtype'
        ];

        if (!requiredKeys.every( k => data.hasOwnProperty(k) )) {
            return Promise.reject( new Error( ' invalid request payload' ) );
        }

        const params = {
            path: '/job/export/execute',
            method: 'POST',
            data: data
        };

        return this.request( params );
    }

    /****************** OPEN DATA IN JOSM FROM INITIAL CONFLATE OR MANAGE PANEL/DATASETS*******************/
    /**
     * Call JOSM remote control.
     * @param uri {String} The URI used to ping JOSM via remote control.
     */
    callJosmRemoteControl(uri) {
        // Safari won't send AJAX commands to the default (insecure) JOSM port when
        // on a secure site, and the secure JOSM port uses a self-signed certificate
        // that requires the user to jump through a bunch of hoops to trust before
        // communication can proceed. So for Safari only, fall back to sending JOSM
        // requests via the opening of a separate window instead of AJAX.
        // Source: https://github.com/osmlab/maproulette3
        let safariWindowReference = null;
        if (window.safari) {
            return new Promise((resolve) => {
                if (safariWindowReference && !safariWindowReference.closed) {
                    safariWindowReference.close();
                }

                safariWindowReference = window.open(uri);

                // Close the window after 1 second and resolve the promise
                setTimeout(() => {
                    if (safariWindowReference && !safariWindowReference.closed) {
                        safariWindowReference.close();
                    }
                    resolve(true);
                }, 1000);
            });
        }
        return fetch(uri)
            .then(response => {
                return response.status === 200;
            })
            .catch(() => {
                Hoot.message.alert({
                    message: 'Make sure that JOSM is already open.',
                    type: 'error'
                });
                return false;
            });
    }

    openDataInJosm(d) {
        // Check that JOSM is available for loading the data
        let checkJosmUrl = new URL('http://127.0.0.1:8111/version?jsonp=test');
        this.callJosmRemoteControl(checkJosmUrl).then(value => {
            // Proceed if JOSM is already open
            if (value) {
                let getJosmJob = async () => {
                    //if it's a merged grail dataset, do derive changeset to JOSM .osm
                    if (d.grailMerged) {
                        const tagsInfo = await this.getMapTags(d.id);
                        const data  = {
                            input1: parseInt(tagsInfo.input1, 10),
                            input2: d.id,
                            output: d.name
                        };
                        if (d.bounds) { data.bounds = d.bounds; }

                        const params = {
                            deriveType : 'JOSM .osm'
                        };

                        return this.createChangeset( data, params );

                    } else { //else do an export before opening in JOSM

                        const data = {
                            input: d.id,
                            inputtype: 'db',
                            includehoottags: true,
                            outputname: d.name,
                            outputtype: 'osm'
                        };

                        return this.exportDataset(data);
                    }
                };

                getJosmJob()
                    .then(resp => {
                        return this.statusInterval(resp.data.jobid);
                    })
                    .then(async resp => {
                        if (resp.data && !this.isCancelled) {
                            await this.openExportInJosm(resp.data.jobId, d.name, 'osm');
                        }
                        return resp;
                    })
                    .then(resp => {
                        Hoot.events.emit('modal-closed');
                        return resp;
                    })
                    .then(resp => {
                        let message;
                        if (resp.data && this.isCancelled) {
                            message = 'Open data in JOSM cancelled.';
                            Hoot.message.alert({
                                message: message,
                                type: 'warn'
                            });
                        }
                        return resp;
                    })
                    .catch((err) => {
                        console.error(err);
                        let message = 'Error opening data in JOSM.',
                            type = err.type,
                            keepOpen = true;

                        if (err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                            message = err.data.commandDetail[0].stderr;
                        }

                        Hoot.message.alert({ message, type, keepOpen });
                    })
                    .finally(() => {
                        Hoot.events.emit('modal-closed');
                    });
            }
        });
    }
    /******************************************************************************************************/

    updateFolder( { folderId, parentId } ) {
        const params = {
            path: `/osm/api/0.6/map/folders/${ folderId }/move/${ parentId }`,
            method: 'PUT'
        };

        return this.request( params )
            .then( () => {
                return {
                    message: 'Successfully updated folder location',
                    type: 'success'
                };
            } )
            .catch( err => {
                return Promise.reject({
                    message: err.data,
                    type: 'error'
                });
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
                    message: `Successfully updated visibility of folder to ${ visibility }`,
                    type: 'success'
                };
            } )
            .catch( err => {
                return Promise.reject({
                    message: err.data,
                    type: 'error'
                });
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
            .then( resp => resp.data )
            .catch( ( err ) => {
                err.message = err.data;
                Hoot.message.alert( err );
            });
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

    getAdvancedImportOptions() {
        if ( this.importOpts ) {
            return Promise.resolve( this.importOpts );
        } else {
            const params = {
                path: '/info/ingest/getoptions',
                method: 'GET'
            };
            let that = this;
            return this.request( params )
                .then( resp => {
                    that.importOpts = resp.data.hoot2[0].members; //might need to refactor this response
                    return that.importOpts;
                });
        }
    }

    getAdvancedChangesetOptions() {
        if ( this.changesetOpts ) {
            return Promise.resolve( this.changesetOpts );
        } else {
            const params = {
                path: '/info/getChangesetOptions',
                method: 'GET'
            };
            let that = this;
            return this.request( params )
                .then( resp => {
                    that.changesetOpts = resp.data.members;
                    return that.changesetOpts;
                });
        }
    }

    /**
     * Delete a layer from the database
     *
     * @param layerId - map id of layer to delete
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
     * Delete maps older than X months
     *
     * @param months - maps last accessed over X months ago will be deleted
     * @returns {Promise<any>}
     */
    deleteStaleLayers( months ) {
        const params = {
            path: `/osm/api/0.6/map/stale/${ months }`,
            method: 'DELETE'
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) );
    }

    /**
     * Delete maps older than X months
     *
     * @param months - maps last accessed over X months ago will be deleted
     * @returns {Promise<any>}
     */
    getStaleLayers( months ) {
        const params = {
            path: `/osm/api/0.6/map/stale/${ months }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                return resp.data || [];
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

    grailPullOverpassToDb( data, folderId, overpassLabel ) {
        const params = {
            path: '/grail/pulloverpasstodb',
            method: 'POST',
            params: {
                folderId: folderId
            },
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: `Pull from ${overpassLabel} has succeeded.`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    message: err.data || 'Error doing pull!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    grailMetadataQuery() {
        const params = {
            path: '/grail/grailMetadataQuery',
            method: 'GET'
        };

        return this.request( params )
            .catch( err => {
                return {
                    data: err.data,
                    message: err.data || 'Error retrieving grail metadata!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    overpassStats( data ) {
        const params = {
            path: '/grail/overpassStats',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    grailPullRailsPortToDb( data, folderId, railsLabel ) {
        const params = {
            path: '/grail/pullrailsporttodb',
            method: 'POST',
            params: {
                folderId: folderId
            },
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: `Pull from ${railsLabel} has succeeded.`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    message: err.data || 'Error doing pull!',
                    status: err.status,
                    type: 'error'
                };
            } );
    }

    createChangeset( data, paramData ) {
        const params = {
            path: '/grail/createchangeset',
            method: 'POST',
            params: paramData,
            data
        };

        return this.request( params );
    }

    deriveChangeset( data, paramData ) {
        return this.createChangeset(data, paramData)
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                const responseData = resp.data;
                if ( responseData && responseData.status === 'cancelled' ) {
                    return {
                        data: responseData,
                        message: `${ paramData.deriveType } job cancelled.`,
                        status: 400,
                        type: 'warn'
                    };
                } else {
                    return {
                        data: responseData,
                        message: `${ paramData.deriveType } for selected region created.`,
                        status: 200,
                        type: 'success'
                    };
                }
            } )
            .catch( err => {
                return {
                    message : err.data.message || `${ paramData.deriveType } changeset failed`,
                    status  : err.status,
                    type    : err.type
                };
            } );
    }

    changesetStats( jobId ) {
        const params = {
            path: `/grail/changesetstats?jobId=${ jobId }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Changeset stats retrieved.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                console.error(err);
                const message = err.data,
                      status  = err.status,
                      type    = err.type;

                return Promise.reject( { message, status, type } );
            } );
    }

    changesetPush( data ) {
        const params = {
            path: '/grail/changesetpush',
            method: 'POST',
            data
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Changeset upload complete.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                const message = err.data || 'Changeset upload failed. Diff-error file is available for download in job panel.',
                      status  = err.status,
                      type    = err.type,
                      keepOpen = true;

                return Promise.reject( { message, status, type, keepOpen } );
            } );
    }

    getTimeoutTasks( projectId ) {
        const params = {
            path: `/grail/gettimeouttasks?projectId=${ projectId }`,
            method: 'GET'
        };

        return this.request( params );
    }

    /****************** TRANSLATIONS *******************/

    getTranslationSchemas() {
        const params = {
            url: `${ this.translationUrl }translations`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    searchTranslatedSchema( data ) {
        const params = {
            url: `${ this.translationUrl }schema`,
            method: 'GET',
            params: data
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => window.console.error( err ) );
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
            .catch( err => window.console.error( err ) );
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
            .catch( err => window.console.error( err ) );
    }

    translateToJson( p ) {
        const params = {
            url: `${ this.translationUrl }translateTo`,
            method: 'GET',
            params: p
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( err => window.console.error( err ) );
    }

    getOverpassStats(url) {
        // We do this because only the portion after data= should be encoded
        const splitData = url.split(/(data=)/),
            encodedUrl = splitData[0] + splitData[1] + encodeURIComponent(splitData[2]);

        const params = {
            url: encodedUrl,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    overpassSyncCheck( projectTaskInfo ) {
        const params = {
            path: `/grail/overpasssynccheck?projectTaskInfo=${ projectTaskInfo }`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => this.statusInterval( resp.data.jobid ) )
            .then( resp => {
                return {
                    data: resp.data,
                    message: 'Overpass sync complete.',
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                return {
                    message: err.data,
                    status: err.status,
                    type: err.type
                };
            } );
    }

    /**
     * Used to load geojson output (alpha shape, task grids) to the map
     *
     * @param id - the job id that produced the output
     * @param outputname - the output file name
     * @param ext - the output file extension
     * @returns {Promise} - request
     */
    fetchGeojson( id, outputname, ext ) {
        const params = {
            path: `/job/export/geojson/${id}?outputname=${outputname}&ext=${ext}`,
            responseType: 'json',
            method: 'GET'
        };

        return this.request( params );
    }

    /**
     * TM2 API CALLS
     */

    /**
     * Retrieves all the projects from tasking manager
     */
    getTMProjects( pageNumber ) {
        const page = pageNumber || 1;

        const params = {
            url: `/tasks/hootprojects.json?hootProjects=true&page=${page}`,
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( () => {
                let alert = {
                    message: 'Failed to retrieve projects list from tasking manager.',
                    type: 'error',
                    status: 400
                };

                return alert;
            } );
    }

    /**
     * Retrieves all the tasks from tasking manager for the specified project
     */
    getTMTasks( projectId ) {
        const params = {
            url: `/tasks/project/${ projectId }/tasks.json`,
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( () => {
                let alert = {
                    message: 'Failed to retrieve tasks.',
                    type: 'error'
                };

                Hoot.message.alert( alert );
            } );
    }

    /**
     * Sets the lock state for the specified task under the specified project
     */
    setTaskLock( projectId, taskId, lock ) {
        let lockParam = lock ? 'lock' : 'unlock';

        const params = {
            url: `/tasks/project/${ projectId }/task/${ taskId }/${ lockParam }`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/javascript, */*',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: `Task ${ taskId } ${ lockParam }ed`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                let alert = {
                    message: `Failed to ${ lockParam } task ${ taskId } for project ${ projectId }.\n` +
                        'Make sure you are logged into tasking manager in a different tab and that you ' +
                        'have not locked any other tasks for this project',
                    type: 'error',
                    status: err.status
                };

                if ( err.data && err.data.error_msg ) {
                    alert.message = err.data.error_msg;
                    alert.status = err.status;
                }

                return alert;
            } );
    }

    /**
     * Marks the specified task under the specified project as done
     */
    markTaskDone( projectId, taskId ) {
        const params = {
            url: `/tasks/project/${ projectId }/task/${ taskId }/done`,
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    /**
     * Marks the specified task under the specified project as validated
     */
    validateTask( projectId, taskId, formData ) {
        const params = {
            url: `/tasks/project/${ projectId }/task/${ taskId }/validate`,
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: formData
        };

        return this.request( params )
            .then( resp => resp.data );
    }


    /**
     * TM4 API CALLS
     */

    /**
     * Retrieves all the projects from tasking manager 4
     */
    getTM4Projects( pageNumber ) {
        const page = pageNumber || 1;
        const params = {
            url: `${this.config.tm4ApiUrl}/v2/projects/`,
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            params: {
                hootenanny: true,
                page: page
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( () => {
                let alert = {
                    message: 'Failed to retrieve projects list from tasking manager.',
                    type: 'error',
                    status: 400
                };

                return alert;
            } );
    }

    /**
     * Retrieves all the tasks from tasking manager for the specified project
     */
    getTM4Tasks( projectId ) {
        let authToken = this.getTM4AuthToken();
        const params = {
            url: `${this.config.tm4ApiUrl}/v2/projects/${ projectId }/`,
            method: 'GET',
            headers: {
              'Authorization': authToken
            }
        };

        return this.request( params )
            .then( resp => resp.data )
            .catch( () => {
                let alert = {
                    message: 'Failed to retrieve tasks.',
                    type: 'error'
                };

                Hoot.message.alert( alert );
            } );
    }

    /**
     * Sets the lock state for the specified task under the specified project
     */
    setTM4TaskLock( projectId, taskId, lock ) {
        let lockParam = lock ? 'lock-for-conflation' : 'stop-mapping';
        let authToken = this.getTM4AuthToken();

        const params = {
            url: `${this.config.tm4ApiUrl}/v2/projects/${ projectId }/tasks/actions/${ lockParam }/${ taskId }/`,
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': authToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        let lockStatus = lock ? 'lock' : 'unlock';
        return this.request( params )
            .then( resp => {
                return {
                    data: resp.data,
                    message: `Task ${ taskId } ${ lockStatus }ed`,
                    status: 200,
                    type: 'success'
                };
            } )
            .catch( err => {
                let alert = {
                    message: `Failed to ${ lockStatus } task ${ taskId } for project ${ projectId }.\n` +
                        'Make sure you are logged into tasking manager in a different tab and that you ' +
                        'have not locked any other tasks for this project',
                    type: 'error',
                    status: err.status
                };

                if ( err.data && err.data.error_msg ) {
                    alert.message = err.data.error_msg;
                    alert.status = err.status;
                }

                return alert;
            } );
    }

    /**
     * Marks the specified task under the specified project as done
     */
    markTM4TaskDone( projectId, taskId, status ) {
        let authToken = this.getTM4AuthToken();

        const params = {
            url: `${this.config.tm4ApiUrl}/v2/projects/${ projectId }/tasks/actions/unlock-after-mapping/${ taskId }/`,
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Authorization': authToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: {
                status: status
            }
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getTM4AuthToken() {
        const match = document.cookie.match(new RegExp('(^| )authToken=([^;]+)'));
        let authToken;
        if (match) {
            authToken = decodeURI(match[2]);
        }

        return authToken;
    }

}
