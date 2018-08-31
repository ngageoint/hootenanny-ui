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
        ] ).then( () => this.hoot.events.emit( 'render-dataset-table' ) );
    }

    /**
     * Retrieve folders from database and transform the data
     * to be usable in a dropdown menu
     */
    async refreshFolders() {
        let { folders } = await this.hoot.api.getFolders();

        this._folders = this.listFolders( folders );

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

    /**
     * Get all available folders
     *
     * @returns {array} - folders
     */
    get folderPaths() {
        return this.listFolders( this._folders );
    }

    exists( folderName ) {
        return !_isEmpty( _find( this._folders, folder => folder.name === folderName ) );
    }

    /**
     * Create an array of all folder names with their full path
     *
     * @param folders - array of folder metadata from database
     * @returns {array} - folder list
     */
    listFolders( folders ) {
        return _map( folders, f => {
            if ( f.parentId === 0 ) {
                f.folderPath = f.name;
            } else {
                //use links to get parent folder as far back as possible
                let strPath      = f.name,
                    parentFolder = _find( folders, { id: f.parentId } ),
                    i            = 0;

                do {
                    i++;
                    strPath      = parentFolder.name + '/' + strPath;
                    parentFolder = _find( folders, { id: parentFolder.parentId } );
                } while ( parentFolder || i === 10 );

                f.folderPath = strPath;
            }

            return {
                path: f.folderPath,
                name: f.name,
                id: f.id,
                parentId: f.parentId
            };
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

        let datasetList = _map( _cloneDeep( this._datasets ), dataset => {
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

    /**
     * Create a folder in the specified path if a new folder name is provided.
     * Update the folder structure and their links with other folders.
     * Move new layers into the correct folder.
     *
     * @param container - form used to create new layer
     * @returns {*}
     */
    updateFolders( container, name ) {
        let pathNameInput      = container.select( '.path-name' ),
            newFolderNameInput = container.select( '.new-folder-name' );

        let fullPath   = pathNameInput.property( 'value' ) || pathNameInput.attr( 'placeholder' ),
            pathName   = fullPath.substring( fullPath.lastIndexOf( '/' ) + 1 ),
            folderName = newFolderNameInput.property( 'value' );

        if ( folderName ) {
            // create new folder and then update folder structure
            return addFolder.call( this );
        } else {
            // update folder structure
            return updateFolderLink.call( this );
        }

        function addFolder() {
            let parentId = _get( _find( this._folders, folder => folder.name === pathName ), 'id' ) || 0;

            let params = {
                folderName,
                parentId
            };

            return this.hoot.api.addFolder( params )
                .then( resp => updateFolderLink.call( this, resp.folderId ) )
                .catch( err => {
                    console.log( err );
                    // TODO: response - unable to create new folder
                } );
        }

        function updateFolderLink( folderId ) {
            let layerName = name || container.select( '.layer-name' ).property( 'value' ),
                mapId     = _get( _find( this.hoot.layers.allLayers, layer => layer.name === layerName ), 'id' ) || 0;

            folderId = folderId || _get( _find( this._folders, folder => folder.name === pathName ), 'id' ) || 0;

            let params = {
                folderId,
                mapId,
                updateType: 'new'
            };

            return this.hoot.api.updateMapFolderLinks( params )
                .then( () => this.refreshAll() )
                .then( () => this.hoot.events.emit( 'render-dataset-table' ) )
                .catch( err => {
                    console.log( err );
                    // TODO: response - unable to update folder links
                } );
        }
    }

    addFolder( pathName, folderName ) {
        let parentId = _get( _find( this._folders, folder => folder.name === pathName ), 'id' ) || 0;

        let params = {
            folderName,
            parentId
        };

        return this.hoot.api.addFolder( params );
    }

    updateFolderLink( layerName, folderId ) {
        let mapId = _get( _find( this.hoot.layers.allLayers, layer => layer.name === layerName ), 'id' ) || 0;

        let params = {
            folderId,
            mapId,
            updateType: 'update'
        };

        return this.hoot.api.updateMapFolderLinks( params );
    }
}