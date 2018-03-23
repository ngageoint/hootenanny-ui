/** ****************************************************************************************************
 * File: Folders.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/6/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import API from '../util/api';
import LayerManager from './layerManager';

/**
 * Retrieves and manages folders and datasets
 */
class FolderManager {
    constructor() {
        this.folders = {
            base: [],
            open: [],
            paths: []
        };

        this.datasets = {
            base: [],
            selected: []
        };

        this.links = [];
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
    refreshFolders() {
        return API.getFolders()
            .then( data => {
                this.folders.base  = data.folders;
                this.folders.paths = this.listFolders( this.folders.base );

                return this.folders.base;
            } );
    }

    /**
     * Retrieve layers from database
     */
    refreshDatasets() {
        return LayerManager.refreshLayers()
            .then( data => this.datasets.base = data.layers || data );
    }

    /**
     * Retrieve links from database
     */
    refreshLinks() {
        return API.getLinks()
            .then( data => this.links = data.links );
    }

    /**
     * Get all currently selected datasets
     *
     * @returns {array} - datasets
     */
    get selectedDatasets() {
        return this.datasets.selected;
    }

    /**
     * Get all available folders
     *
     * @returns {array} - folders
     */
    get folderPaths() {
        return this.folders.paths;
    }

    addFolder() {

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
                    parentFolder = _.find( this.folders.base, { id: f.parentId } ),
                    i            = 0;

                do {
                    i++;
                    strPath      = parentFolder.name + '/' + strPath;
                    parentFolder = _.find( this.folders.base, { id: parentFolder.parentId } );
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
            this.folders.open.push( id );
        } else {
            let index = this.folders.open.indexOf( id );
            if ( index > 1 ) {
                this.folders.open.splice( index, 1 );
            }
        }

        return this.folders.open;
    }

    /**
     * Update list of currently selected datasets
     *
     * @param id - id of selected dataset
     * @param clearAll - boolean to determine whether to clear the entire list or not
     */
    updateSelectedDatasets( id, clearAll ) {
        if ( clearAll ) {
            this.datasets.selected = [];
        }

        if ( this.datasets.selected.indexOf( id ) > -1 ) {
            _.pull( this.datasets.selected, id );
        } else {
            this.datasets.selected.push( id );
        }
    }

    /**
     * Create a list of folders and datasets and then transform
     * it into a hierarchy to be used by D3
     *
     * @returns {array} - hierarchy
     */
    async getAvailFolderData() {
        if ( !this.folders.base.length || !this.datasets.base.length ) {
            if ( this.loading === undefined ) {
                this.loading = this.refreshAll();
            }

            // make sure refresh all is only called once
            await this.loading;
        }

        let datasetList = _.map( this.datasets.base, dataset => {
            let match = _.find( this.links, link => link.mapId === dataset.id );

            if ( !match ) {
                _.assign( dataset, { folderId: 0 } );
            } else {
                _.assign( dataset, { folderId: match.folderId } );
            }

            _.assign( dataset, { type: 'dataset' } );

            return dataset;
        } );

        let folderList = _.map( this.folders.base, folder => {
            if ( this.folders.open.indexOf( folder.id ) > -1 ) {
                folder.children = _.filter( datasetList, dataset => dataset.folderId === folder.id );
                folder.state    = 'open';
            } else {
                folder._children = _.filter( datasetList, dataset => dataset.folderId === folder.id );
                folder._children = !folder._children.length ? null : folder._children;

                folder.state = 'closed';
            }

            _.assign( folder, { type: 'folder' } );

            return folder;
        } );

        folderList = _.union( folderList, _.each( _.filter( datasetList, function( lyr ) {
            return lyr.folderId === 0;
        } ), function( lyr ) {
            _.extend( lyr, { parentId: 0 } );
        } ) );

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

                _.each( children, child => {
                    parent[ cParam ].push( child );
                } );
            }

            _.each( children, child => {
                this.unflattenFolders( array, child );
            } );
        }

        if ( !parent.type )
            parent.type = 'folder';

        return tree;
    }

}

export default new FolderManager();