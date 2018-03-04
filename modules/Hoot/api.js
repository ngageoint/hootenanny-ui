/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

import axios from 'axios/dist/axios';
import config from './config/apiConfig';

class API {
    constructor() {
        this.config = config;
        this.baseUrl = `${ this.config.host }:${ this.config.port }`;
    }

    request( params ) {
        return axios( {
            url: `${ this.baseUrl }${ params.path }`,
            method: params.method || 'GET',
            body: params.body
        } );
    }

    getFolders() {
        const params = {
            path: '/hoot-services/osm/api/0.6/map/folders',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getLayers() {
        const params = {
            path: '/hoot-services/osm/api/0.6/map/layers',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getLinks() {
        const params = {
            path: '/hoot-services/osm/api/0.6/map/links',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }
}

export default new API();