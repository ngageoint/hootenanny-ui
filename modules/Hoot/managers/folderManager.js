/** ****************************************************************************************************
 * File: Folders.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/6/18
 *******************************************************************************************************/

import _            from 'lodash-es';
import API          from '../control/api';
import LayerManager from './layerManager';

/**
 * Retrieves and manages folders and datasets
 */
class FolderManager {
    constructor() {
        this._folders     = [];
        this._openFolders = [];
        this._datasets    = [];
        this._links       = [];
    }

    /**
     * Retrieve folders, datasets, and links from database
     *
     * @returns {promise}
     */
    refreshAll() {
        return Promise.all( [
            this.refreshFolders(),
            this.refreshDatasets(),
            this.refreshLinks()
        ] );
    }

    /**
     * Retrieve folders from database and transform the data
     * to be usable in a dropdown menu
     */
    async refreshFolders() {
        let { folders } = await API.getFolders();

        return this._folders = folders;
    }

    /**
     * Retrieve links from database
     */
    async refreshLinks() {
        let { links } = await API.getLinks();

        return this._links = links;
    }

    /**
     * Retrieve layers from database
     */
    async refreshDatasets() {
        return this._datasets = await LayerManager.refreshLayers();
    }

    /**
     * Get all available folders
     *
     * @returns {array} - folders
     */
    get folderPaths() {
        return this.listFolders( this._folders );
    }

    /**
     * Create an array of all folder names with their full path
     *
     * @param array - array of folder objects from database
     * @returns {array} - folder list
     */
    listFolders( array ) {
        return _.map( array, f => {
            if ( f.parentId === 0 ) {
                f.folderPath = f.name;
            } else {
                //use links to get parent folder as far back as possible
                let strPath      = f.name,
                    parentFolder = _.find( this._folders, { id: f.parentId } ),
                    i            = 0;

                do {
                    i++;
                    strPath      = parentFolder.name + '/' + strPath;
                    parentFolder = _.find( this._folders, { id: parentFolder.parentId } );
                } while ( parentFolder || i === 10 );

                f.folderPath = strPath;
            }

            return { path: f.folderPath };
        } );
    }

    /**
     * Update list of currently open folders
     *
     * @param id - id of selected folder
     * @param add - boolean to determine whether to add or remove the folder from the list
     * @returns {array} - open folders
     */
    setOpenFolders( id, add ) {
        if ( add ) {
            this._openFolders.push( id );
        } else {
            let index = this._openFolders.indexOf( id );
            if ( index > 1 ) {
                this._openFolders.splice( index, 1 );
            }
        }

        return this._openFolders;
    }

    /**
     * Create a list of folders and layers and then transform
     * it into a hierarchy to be used by D3
     *
     * @returns {array} - hierarchy
     */
    async getAvailFolderData() {
        if ( !this._folders.length || !this._datasets.length ) {
            if ( this.loading === undefined ) {
                this.loading = this.refreshAll();
            }

            // make sure refresh all is only called once
            await this.loading;
        }

        let layerList = _.map( _.cloneDeep( this._datasets ), layer => {
            let match = _.find( this._links, link => link.mapId === layer.id );

            layer.type     = 'dataset';
            layer.folderId = !match ? 0 : match.folderId;

            return layer;
        } );

        let folderList = _.map( _.cloneDeep( this._folders ), folder => {
            let children = _.filter( layerList, layer => layer.folderId === folder.id );

            if ( this._openFolders.indexOf( folder.id ) > -1 ) {
                folder.children = children;
                folder.state    = 'open';
            } else {
                folder._children = children.length && children || null;

                folder.state = 'closed';
            }

            folder.type = 'folder';

            return folder;
        } );

        let rootLayers = _.filter( layerList, layer => {
            if ( layer.folderId === 0 ) {
                layer.parentId = 0;
                return true;
            }
        } );

        folderList = _.union( folderList, rootLayers );

        return this.unflattenFolders( folderList );
    }

    /**
     * Create a hierarchy of folders and their children datasets by
     * recursively going through each node to see if they have children
     *
     * @param array - folders
     * @param parent - parent node
     * @returns {array} - hierarchy
     */
    unflattenFolders( array, parent = { id: 0 } ) {
        let children = _.filter( array, child => child.parentId === parent.id ),
            tree     = [];

        if ( !_.isEmpty( children ) ) {
            if ( parent.id === 0 ) {
                tree = children;
            } else {
                const cParam = parent.state === 'open' ? 'children' : '_children';

                parent[ cParam ] = !parent[ cParam ] ? [] : parent[ cParam ];

                _.each( children, child => parent[ cParam ].push( child ) );
            }

            _.each( children, child => this.unflattenFolders( array, child ) );
        }

        if ( !parent.type )
            parent.type = 'folder';

        return tree;
    }
}

export default new FolderManager();