/** ****************************************************************************************************
 * File: Folders.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/6/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _filter    from 'lodash-es/filter';
import _find      from 'lodash-es/find';
import _forEach   from 'lodash-es/forEach';
import _get       from 'lodash-es/get';
import _isEmpty   from 'lodash-es/isEmpty';
import _map       from 'lodash-es/map';
import _remove    from 'lodash-es/remove';
import _union     from 'lodash-es/union';

/**
 * Retrieves and manages folders and datasets
 */
export default class FolderManager {
    constructor( hoot ) {
        this.hoot = hoot;

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
        let { folders } = await this.hoot.api.getFolders();
        this._folders   = this.listFolders( folders );

        return this._folders;
    }

    /**
     * Retrieve links from database
     */
    async refreshLinks() {
        let { links } = await this.hoot.api.getLinks();

        return this._links = links;
    }

    /**
     * Retrieve layers from database
     */
    async refreshDatasets() {
        this._datasets = await this.hoot.layers.refreshLayers();
    }

    async dataExists() {
        if ( !this._folders.length || !this._datasets.length ) {
            if ( this.loading === undefined ) {
                this.loading = this.refreshAll();
            }

            // make sure refresh all is only called once
            await this.loading;
        } else return true;
    }

    filterVisible(f) {
        return JSON.parse(Hoot.context.storage( 'publicVisibility' )) && f.id !== 0 || f.userId === Hoot.user().id && f.id !== 0;
    }

    /**
     * Get all available folders
     * filtered by public visibility setting
     *
     * @returns {array} - folders
     */
    get folderPaths() {
        return this._folders.filter(this.filterVisible);
    }

    get datasetList() {
        return _map( _cloneDeep( this._datasets ), dataset => {
            let match = _find( this._links, link => link.mapId === dataset.id );

            dataset.type     = 'dataset';
            dataset.folderId = !match ? 0 : match.folderId;

            return dataset;
        } );
    }

    findBy( key, val ) {
        return _find( this._folders, folder => folder[ key ] === val );
    }

    exists( folderName, folderId ) {
        let folderList = _forEach( _map( this._folders, _cloneDeep ), folder => {
            folder.name = folder.name.toLowerCase();
        } );

        return !_isEmpty( _find( folderList, { name : folderName.toLowerCase(), parentId : folderId } ) );
    }

    /**
     * Updates each folder object to have a full path name, beginning with the first folder after root
     *
     * Note: this method mutates objects in the array
     *
     * @param folders - base folder array
     * @returns {Array} - updated folder array
     */
    listFolders( folders ) {
        return [
            {
                path : '/',
                id : 0,
                name: 'root',
                userId: Hoot.user().id //hack to make root always visible to user
            }
        ].concat(_map( folders, folder => {
            if ( folder.parentId === 0 ) {
                folder.folderPath = '/ ' + folder.name;
            } else {
                //use links to get parent folder as far back as possible
                let strPath      = folder.name,
                    parentFolder = _find( folders, { id : folder.parentId } );

                do {
                    strPath      = parentFolder.name + ' / ' + strPath;
                    parentFolder = _find( folders, { id : parentFolder.parentId } );
                } while ( parentFolder );

                folder.folderPath = '/ ' + strPath;
            }

            return {
                path : folder.folderPath,
                name : folder.name,
                id : folder.id,
                parentId : folder.parentId,
                public : folder.public,
                userId: folder.userId
            };
        } ) );
    }

    ///**
    // * Updates each dataset object to have a reference to their parent folder ID
    // *
    // * Note: this method mutates objects in the array
    // *
    // * @param datasets - base dataset array
    // * @returns {Array} - updated dataset array
    // */
    //listDatasets( datasets ) {
    //    return _map( datasets, dataset => {
    //        let match = _find( this._links, link => link.mapId === dataset.id );
    //
    //        dataset.type     = 'dataset';
    //        dataset.folderId = !match ? 0 : match.folderId;
    //
    //        return dataset;
    //    } );
    //}

    /**
     * Update list of currently open folders
     *
     * @param id - id of selected folder
     * @param add - boolean to determine whether to add or remove the folder from the list
     * @returns {Array} - open folders
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

    getFolderChildren( folderId ) {
        let datasetList = this.datasetList;
        let allChildren = {};

        allChildren.folders  = _filter( this._folders, folder => folder.parentId === folderId );
        allChildren.datasets = _filter( datasetList, dataset => dataset.folderId === folderId );

        return allChildren;
    }

    /**
     * Create a list of folders and layers and then transform
     * it into a hierarchy to be used by D3
     *
     * @returns {array} - hierarchy
     */
    async getAvailFolderData() {
        await this.dataExists();

        let datasetList = _map( this._datasets, dataset => {
            let match = _find( this._links, link => link.mapId === dataset.id );

            dataset.type     = 'dataset';
            dataset.folderId = !match ? 0 : match.folderId;

            return dataset;
        } );

        let folderList = _map( _cloneDeep( this._folders ), folder => {
            let children = _filter( datasetList, dataset => dataset.folderId === folder.id );

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

        let rootLayers = _filter( datasetList, dataset => {
            if ( dataset.folderId === 0 ) {
                dataset.parentId = 0;
                return true;
            }
        } );

        folderList = _union( folderList, rootLayers );

        return this.unflattenFolders( folderList ).filter(this.filterVisible);
    }

    /**
     * Create a hierarchy of folders and their children datasets by
     * recursively going through each node to see if they have children
     *
     * @param array - folders
     * @param parent - parent node
     * @returns {array} - hierarchy
     */
    unflattenFolders( array, parent = { id : 0 } ) {
        let children = _filter( array, child => child.parentId === parent.id ),
            tree     = [];

        if ( !_isEmpty( children ) ) {
            if ( parent.id === 0 ) {
                tree = children;
            } else {
                const cParam = parent.state === 'open' ? 'children' : '_children';

                parent[ cParam ] = !parent[ cParam ] ? [] : parent[ cParam ];

                _forEach( children, child => parent[ cParam ].push( child ) );
            }

            _forEach( children, child => this.unflattenFolders( array, child ) );
        }

        if ( !parent.type )
            parent.type = 'folder';

        return tree;
    }

    addFolder( pathName, folderName ) {
        let parentId = _get( _find( this._folders, folder => folder.name === pathName ), 'id' ) || 0;

        let params = {
            folderName,
            parentId
        };

        return this.hoot.api.addFolder( params );
    }

    updateFolderLink( mapId, folderId ) {
        let params = {
            folderId,
            mapId,
            updateType : 'update'
        };

        return this.hoot.api.updateMapFolderLinks( params );
    }

    /**
     * Remove a folder from the list of all available folders
     *
     * @param id - folder ID
     */
    removeFolder( id ) {
        _remove( this._folders, folder => folder.id === id );
    }
}
