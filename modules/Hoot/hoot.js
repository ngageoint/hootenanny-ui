/*******************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import '../../css/hoot/hoot.scss';

import _forEach from 'lodash-es/forEach';

import API                from './managers/api';
import MessageManager     from './managers/messages/messageManager';
import FolderManager      from './managers/folderManager';
import LayerManager       from './managers/layerManager';
import TranslationManager from './managers/translationManager';
import UserManager        from './managers/userManager';
import EventManager       from './managers/eventManager';
import UI                 from './ui/init';
import buildInfo          from './config/buildInfo.json';
import { duration }       from './tools/utilities';
import { utilStringQs }   from '../util';
import { prefs } from '../core';

class Hoot {
    constructor() {
        this.api          = new API( this );
        this.message      = new MessageManager( this );
        this.layers       = new LayerManager( this );
        this.folders      = new FolderManager( this );
        this.translations = new TranslationManager( this );
        this.users        = new UserManager( this );
        this.events       = new EventManager();
        this.duration     = duration;
        // this.user
        this.config = {
            tagInfo: {},
            appInfo: [],
            users: [],
            exportSizeThreshold: null,
            ingestSizeThreshold: null,
            conflateSizeThreshold: null,
            presetMaxDisplayNum: 12,
            privilegeIcons: {
                admin: 'how_to_reg',
                advanced: 'star'
            }
        };
    }

    async getAboutData() {
        try {
            let info = await Promise.all( [
                this.api.getCoreVersionInfo(),
                this.api.getServicesVersionInfo()
            ] );

            _forEach( info, d => this.config.appInfo.push( d ) );
        } catch ( err ) {
            // this.message.alert( err );
            return Promise.reject( err );
        }

        // build info will always be available
        this.config.appInfo.push( buildInfo );
    }

    async getAllUsers() {
        try {
            let resp = await this.api.getAllUsers();

            this.config.users = {};

            _forEach( resp, user => {
                this.config.users[ user.id ] = user;
            } );
        } catch ( err ) {
            // this.message.alert( err );
            return Promise.reject( err );
        }
    }

    getUserIdObjectsList() {
        return Object.values( this.config.users ).map( user => {
            return {
                name: user.display_name,
                id: user.id
            };
        } );
    }

    async getMapSizeThresholds() {
        try {
            let thresholds = await this.api.getMapSizeThresholds();

            this.config.exportSizeThreshold   = thresholds.export_threshold;
            this.config.ingestSizeThreshold   = thresholds.ingest_threshold;
            this.config.conflateSizeThreshold = thresholds.conflate_threshold;
        } catch ( err ) {
            // this.message.alert( err );
            return Promise.reject( err );
        }
    }

    async getGrailMetadata() {
        const privileges = this.user().privileges;

        if ( privileges && privileges.advanced && privileges.advanced === 'true' ) {
            const { data } = await this.api.grailMetadataQuery();
            this.config.referenceLabel = data.railsLabel;
            this.config.secondaryLabel = data.overpassLabel;
        }
    }

    init( context ) {
        let user;

        this.context = context;
        this.user = function () {
            if (!user) {
                user = JSON.parse( prefs( 'user' ) );
            }

            return user;
        };

        if (!prefs('bounds_history')) {
            prefs('bounds_history', JSON.stringify({
                'boundsHistory':[]
            }));
        }

        let queryStringMap = utilStringQs(window.location.href);
        if (queryStringMap.hasOwnProperty('gpx')) {
            const tm2Regex = new RegExp('project\\/([0-9]+)\\/task_gpx_geom\\/([0-9]+)\\.gpx');
            const tm4Regex = new RegExp('projects\\/([0-9]+)\\/tasks\\/queries\\/gpx\\/.+tasks=([0-9]+)');

            if ( tm2Regex.test(queryStringMap.gpx) ) {
                let matchGroup = tm2Regex.exec(queryStringMap.gpx);
                sessionStorage.setItem('tm:project', 'memt_project_' + matchGroup[1]);
                sessionStorage.setItem('tm:task', 'task_' + matchGroup[2]);
            } else if ( tm4Regex.test(queryStringMap.gpx) ) {
                let matchGroup = tm4Regex.exec(queryStringMap.gpx);
                sessionStorage.setItem('tm:project', 'memt_project_' + matchGroup[1]);
                sessionStorage.setItem('tm:task', 'task_' + matchGroup[2]);
            }
        }

        Promise.all( [
            this.getAboutData(),
            this.getAllUsers(),
            this.getMapSizeThresholds(),
            this.getGrailMetadata(),
            this.translations.getTranslations(),
            this.users.init()
        ] );

        this.ui = new UI();
        this.ui.render();

        // prevent this class from being modified in any way.
        // this does not affect children objects
        Object.freeze( this );
    }
}

// Export this class as a "Singleton". When it is imported the very first time,
// it will create a new instance of the object and store it in memory. Every other
// import afterwards will receive this cached object instead of creating a new instance.

// * Note: This is not a true Singleton, but it mimics the Singleton pattern
// because of Node's module caching behavior.
export default new Hoot();
