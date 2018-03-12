/** ****************************************************************************************************
 * File: Folders.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/6/18
 *******************************************************************************************************/

import API from '../util/api';
import _ from 'lodash-es';

class FolderManager {
    constructor() {
        this.api = API;

        this.folders    = [];
        this.links      = [];
        this.datasets   = [];
        this.childArray = [];

        this.selectedDsets = [];
        this.openFolders   = [];
    }

    refreshAll() {
        return Promise.all( [
            this.refreshFolders(),
            this.refreshDatasets(),
            this.refreshLinks()
        ] );
    }

    refreshFolders() {
        return this.api.getFolders()
            .then( data => this.folders = data.folders );
    }

    refreshDatasets() {
        return this.api.getLayers()
            .then( data => this.datasets = data.layers || data );
    }

    refreshLinks() {
        return this.api.getLinks()
            .then( data => this.links = data.links );
    }

    get selectedDatasets() {
        return this.selectedDsets;
    }

    get availFolders() {
        return this.folders;
    }

    setOpenFolders( folderId, add ) {
        if ( add ) {
            this.openFolders.push( folderId );
        } else {
            let index = this.openFolders.indexOf( folderId );
            if ( index > 1 ) {
                this.openFolders.splice( index, 1 );
            }
        }

        return this.openFolders;
    }

    updateSelectedDatasets( id, clearAll ) {
        if ( clearAll ) {
            this.selectedDsets = [];
        }

        if ( this.selectedDsets.indexOf( id ) > -1 ) {
            _.pull( this.selectedDsets, id );
        } else {
            this.selectedDsets.push( id );
        }
    }

    /**
     * Create a hierarchy of folders and their children datasets
     *
     * @returns {Array} - Hierarchy
     */
    getAvailFolderData() {
        let datasetList = _.map( this.datasets, dataset => {
            let match = _.find( this.links, link => link.mapId === dataset.id );

            if ( !match ) {
                _.assign( dataset, { folderId: 0 } );
            } else {
                _.assign( dataset, { folderId: match.folderId } );
            }

            _.assign( dataset, { type: 'dataset', selected: false } );

            return dataset;
        } );

        let folderList = _.map( this.folders, folder => {
            if ( this.openFolders.indexOf( folder.id ) > -1 ) {
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

    unflattenFolders( array, parent = { id: 0 }, tree = [] ) {
        const children = _.filter( array, child => child.parentId === parent.id );

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