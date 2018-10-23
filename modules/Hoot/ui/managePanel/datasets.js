/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _map     from 'lodash-es/map';

import Hoot       from '../../hoot';
import FolderTree from '../../tools/folderTree';
import Tab        from './tab';

import ImportDataset from '../modals/importDataset';
import AddFolder     from '../modals/addFolder';
import ModifyDataset from '../modals/modifyDataset';
import ModifyFolder  from '../modals/modifyFolder';

/**
 * Creates the datasets tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Datasets extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Datasets';
        this.id   = 'manage-datasets';

        this.datasetButtons = [
            {
                title: 'Import Single',
                icon: 'play_for_work',
                onClick: 'import-datasets-single',
                contextmenu: 'bulkimport'
            },
            {
                title: 'Import Multiple',
                icon: 'move_to_inbox',
                onClick: 'import-datasets-directory'
            },
            {
                title: 'Add Folder',
                icon: 'create_new_folder',
                onClick: 'add-datasets-folder'
            },
            {
                title: 'Refresh Datasets',
                icon: 'refresh',
                onClick: 'refresh-datasets-layers'
            }
        ];

        this.datasetTableHeaders = [
            {
                title: 'Datasets',
                width: '9%'
            },
            {
                title: 'Last Accessed',
                width: '6%'
            },
            {
                title: 'Import Date',
                width: '6%'
            },
            {
                title: 'Size',
                width: '1%'
            }
        ];
    }

    /**
     * Render view inside tab body
     */
    render() {
        super.render();

        // automatically show this panel on first load
        this.toggle();

        let buttonContainer = this.panelWrapper
            .append( 'div' )
            .classed( 'dataset-buttons flex', true )
            .selectAll( 'button.dataset-action-button' )
            .data( this.datasetButtons );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'dataset-action-button primary text-light flex align-center', true )
            .on( 'click', async item => {
                d3.event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-datasets-single': {
                        let translations = await Hoot.api.getTranslations();

                        new ImportDataset( 'single', translations ).render();
                        break;
                    }
                    case 'import-datasets-directory': {
                        let translations = await Hoot.api.getTranslations();

                        new ImportDataset( 'multi', translations ).render();
                        break;
                    }
                    case 'add-datasets-folder': {
                        new AddFolder().render();
                        break;
                    }
                    case 'refresh-datasets-layers': {
                        Hoot.folders.refreshAll()
                            .then( () => Hoot.events.emit( 'render-dataset-table' ) );
                        break;
                    }
                    default: {
                        break;
                    }
                }
            } );

        buttons.append( 'i' )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );

        let table = this.panelWrapper.append( 'div' )
            .attr( 'id', 'dataset-table' )
            .classed( 'layer-table filled-white strong overflow', true );

        table
            .insert( 'div' )
            .attr( 'id', 'dataset-table-header' )
            .selectAll( 'th' )
            .data( this.datasetTableHeaders )
            .enter().append( 'th' )
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );

        this.table = table;

        this.renderFolderTree();

        this.listen();

        return this;
    }

    /**
     * Render folder tree inside table
     */
    renderFolderTree() {
        if ( !this.folderTree ) {
            this.folderTree = new FolderTree( this.table );
        }

        this.folderTree.render();
    }

    /**
     * Delete one or multiple items from the database. This method will also update the local data store
     * after each item has successfully been deleted.
     *
     * Note: If deleting a folder, this method will recursively delete all children (both, layers and folders) of the folder.
     * It will begin at the outer-most folder and work inwards until reaching the target folder. Once all children
     * have been deleted, the target folder will then be deleted.
     *
     * @param toDelete - array of items to delete
     */
    deleteItems( toDelete ) {
        return Promise.all( _map( toDelete, child => {
            let node = this.table.selectAll( `g[data-id="${ child.id }"]` );

            node.select( 'rect' )
                .classed( 'sel', false )
                .style( 'fill', 'rgb(255,0,0)' );

            if ( child.type === 'dataset' ) {
                return Hoot.api.deleteLayer( child.name )
                    .then( () => Hoot.layers.removeLayer( child.id ) );
            } else {
                if ( child.children && child.children.length ) {
                    return this.deleteItems( child.children )
                        .then( () => Hoot.api.deleteFolder( child.id ) )
                        .then( () => Hoot.folders.removeFolder( child.id ) );
                } else {
                    return Hoot.api.deleteFolder( child.id )
                        .then( () => Hoot.folders.removeFolder( child.id ) );
                }
            }
        } ) );
    }

    async handleContextMenuClick( [ tree, d, item ] ) {
        switch ( item.click ) {
            case 'delete': {
                let warningMsg = d.type === 'folder' ? 'folder and all data?' : 'datasets?',
                    message    = `Are you sure you want to remove the selected ${ warningMsg }`,
                    confirm    = await Hoot.message.confirm( message );

                if ( !confirm ) return;

                let items = d.type === 'folder' ? new Array( d ) : tree.selectedNodes;

                this.deleteItems( items )
                    .then( () => Hoot.events.emit( 'render-dataset-table' ) );

                break;
            }
            case 'addDataset': {
                let params = {
                    name: d.data.name,
                    id: d.data.id
                };

                Hoot.ui.sidebar.forms[ item.formId ].submitLayer( params )
                    .then( () => {
                        let refType = item.formId.charAt( 0 ).toUpperCase() + item.formId.substr( 1 ),
                            message = `${refType} layer added to map: <u>${d.data.name}</u>`,
                            type    = 'info';

                        Hoot.message.alert( { message, type } );
                    } );

                break;
            }
            case 'modifyDataset': {
                new ModifyDataset( tree.selectedNodes ).render();
                break;
            }
            case 'modifyFolder': {
                new ModifyFolder( d ).render();
                break;
            }
        }
    }

    /**
     * Listen for re-render
     */
    listen() {
        Hoot.events.on( 'render-dataset-table', () => this.renderFolderTree() );
        Hoot.events.on( 'context-menu', ( ...params ) => this.handleContextMenuClick( params ) );
    }
}
