/** ****************************************************************************************************
 * File: api.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import axios from 'axios/dist/axios';
import config from '../config/apiConfig';

class API {
    constructor() {
        this.config  = config;
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

    getLinks() {
        const params = {
            path: '/hoot-services/osm/api/0.6/map/links',
            method: 'GET'
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    getTranslations() {
        const params = {
            path: '/hoot-services/ingest/customscript/getlist',
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
            path: `/hoot-services/info/map/sizes?mapid=${ mapIds }`,
            method: 'GET',
        };

        return this.request( params )
            .then( resp => resp.data );
    }

    //importData();
}

export default new API();