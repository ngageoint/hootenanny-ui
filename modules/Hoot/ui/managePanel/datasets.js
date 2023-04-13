/** ****************************************************************************************************
 * File: navbar.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 * @apiNote Changelog: <br>
 *      Milla Zagorski 8-10-2022: Added code to allow for opening layer(s) in JOSM. <br>
 *
 *******************************************************************************************************/

import _map from 'lodash-es/map';

import FolderTree from '../../tools/folderTree';
import Tab        from './tab';

import ImportDataset      from '../modals/importDataset';
import ImportMultiDataset from '../modals/ImportMultiDatasets';
import AddFolder          from '../modals/addFolder';
import ModifyDataset      from '../modals/modifyDataset';
import ModifyFolder       from '../modals/modifyFolder';
import ExportData         from '../modals/exportData';
import ExportAlphaShape   from '../modals/exportAlphaShape';
import ExportTaskGrid     from '../modals/exportTaskGrid';
import { rateLimit }      from '../../config/apiConfig';
import { prefs } from '../../../core';

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
            },
            {
                title: 'Public Data',
                icon: JSON.parse(prefs( 'publicVisibilityDatasets' )) ? 'visibility' : 'visibility_off',
                iconClass: 'public-visibility',
                onClick: 'toggle-public-visibility'
            }
        ];

        this.datasetTableHeaders = [
            {
                title: 'Datasets',
                width: '9%'
            },
            {
                title: 'Owner',
                width: '9%'
            },
            {
                title: 'Last Accessed',
                width: '6%'
            },
            {
                title: 'Created Date',
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

        let buttonContainer = this.panelWrapper
            .append( 'div' )
            .classed( 'dataset-buttons flex', true )
            .selectAll( 'button.dataset-action-button' )
            .data( this.datasetButtons );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'dataset-action-button primary text-light flex align-center', true )
            .on( 'click', async (d3_event, item) => {
                d3_event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-datasets-single': {
                        let translations = await Hoot.api.getTranslations();

                        this.importSingleModal = new ImportDataset( translations ).render();

                        Hoot.events.once( 'modal-closed', () => delete this.importSingleModal );
                        break;
                    }
                    case 'import-datasets-directory': {
                        let translations = await Hoot.api.getTranslations();

                        this.importMultiModal = new ImportMultiDataset( translations ).render();

                        Hoot.events.once( 'modal-closed', () => delete this.importMultiModal );
                        break;
                    }
                    case 'add-datasets-folder': {
                        this.addFolderModal = new AddFolder().render();

                        Hoot.events.once( 'modal-closed', () => delete this.addFolderModal );
                        break;
                    }
                    case 'refresh-datasets-layers': {
                        Hoot.folders
                            .refreshAll()
                            .then( () => Hoot.events.emit( 'render-dataset-table' ) );
                        break;
                    }
                    case 'toggle-public-visibility': {
                        let publicVisibilityPref = JSON.parse(prefs( 'publicVisibilityDatasets' ));
                        prefs( 'publicVisibilityDatasets', !publicVisibilityPref);
                        //Would be better to make this class render() method re-entrant
                        //but for now just surgically update icon
                        d3.select('.dataset-buttons i.public-visibility').text(!publicVisibilityPref ? 'visibility' : 'visibility_off');
                        Hoot.events.emit( 'render-dataset-table' );
                        break;
                    }
                }
            } );

        buttons.append( 'i' )
            .attr( 'class', d => d.iconClass )
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
     * It will begin at the inner-most folder and work outwards until reaching the target folder. Once all children
     * have been deleted, the target folder will then be deleted.
     *
     * @param toDelete - array of items to delete
     */
    deleteItems( toDelete ) {
        const deleteItem = item => {
            let data = item.data || item,
                node = this.table.selectAll( `g[data-type="${ data.type }"][data-id="${ data.id }"]` );

            node.select( 'rect' )
                .classed( 'sel', false )
                .style( 'fill', 'rgb(255,0,0)' );

            if ( data.type === 'dataset' ) {
                return Hoot.api.deleteLayer( data.id )
                    .then( () => Hoot.layers.removeLayer( data.id ) )
                    .catch( ( err ) => {
                        err.message = err.data;
                        delete err.data;
                        Hoot.message.alert( err );
                    });
            } else {
                let children = item.children || data._children; // children are placed in root of object when folder is open

                if ( children && children.length ) {
                    return this.deleteItems( children )
                        .then( () => Hoot.api.deleteFolder( data.id ) )
                        .then( () => Hoot.folders.removeFolder( data.id ) )
                        .catch( ( err ) => {
                            err.message = err.data;
                            delete err.data;
                            Hoot.message.alert( err );
                        });
                } else {
                    return Hoot.api.deleteFolder( data.id )
                        .then( () => Hoot.folders.removeFolder( data.id ) )
                        .catch( ( err ) => {
                            err.message = err.data;
                            delete err.data;
                            Hoot.message.alert( err );
                        });
                }
            }
        };
        //approach described here https://stackoverflow.com/a/51020535
        async function doWork(iterator) {
            for (let [index, item] of iterator) {
                await deleteItem(item);
            }
        }
        const iterator = Object.entries(toDelete);
        const workers = new Array(rateLimit).fill(iterator).map(doWork);

        return Promise.allSettled( workers );
    }

    async handleContextMenuClick( [ tree, d, item ] ) {

        switch ( item.click ) {
            case 'delete': {
                let warningMsg = d.data.type === 'folder' ? 'folder and all data?' : 'datasets?',
                    message    = `Are you sure you want to delete the selected ${ warningMsg }`,
                    confirm    = await Hoot.message.confirm( message );

                if ( !confirm ) return;

                let items = tree.selectedNodes;

                this.processRequest = this.deleteItems( items )
                    .then( () => Hoot.folders.refreshAll() )
                    .then( () => Hoot.events.emit( 'render-dataset-table' ) );

                break;
            }
            case 'importDataset': {
                let translations = await Hoot.api.getTranslations();
                this.importSingleModal = new ImportDataset( translations, d.data.path ).render();
                Hoot.events.once('modal-closed', () => delete this.importSingleModal );
                break;
            }
            case 'importMultiDatasets': {
                let translations = await Hoot.api.getTranslations();
                this.importMultiModal = new ImportMultiDataset( translations, d.data.path ).render();
                Hoot.events.once('modal-closed', () => delete this.importMultiModal);
                break;
            }
            case 'addDataset': {

                let params = {
                    name: d.data.name,
                    id: d.data.id
                };

                Hoot.ui.sidebar.forms[item.formId].submitLayer( params )
                    .then( () => {
                        let refType = item.formId.charAt( 0 ).toUpperCase() + item.formId.substr( 1 ),
                            message = `${refType} layer added to map: <u>${d.data.name}</u>`,
                            type    = 'info';
                        Hoot.message.alert( {message, type} );
                    });
                break;
            }
            case 'exportDataset': {
                let translations = (await Hoot.api.getTranslations()).filter( t => t.canExport );
                this.exportDatasetModal = new ExportData( translations, d, 'Dataset' ).render();
                Hoot.events.once( 'modal-closed', () => delete this.exportDatasetModal);
                break;
            }
            case 'exportMultiDataset': {
                let translations = (await Hoot.api.getTranslations()).filter( t => t.canExport );
                let datasets = this.folderTree.selectedNodes;
                this.exportDatasetModal = new ExportData ( translations, datasets, 'Datasets' ).render();
                Hoot.events.once( 'modal-closed', () => delete this.exportDatasetModal);
                break;
            }
            case 'openInJosm': {
                Hoot.api.openDataInJosm(d);
                break;
            }
            case 'exportFolder': {
                //probably don't need to get translations but once on init
                let translations = (await Hoot.api.getTranslations()).filter( t => t.canExport);
                this.exportDatasetModal = new ExportData( translations, d, 'Folder' ).render();
                Hoot.events.once( 'modal-closed', () => delete this.exportDatasetModal);
                break;
            }
            case 'addFolder':
                // d.data.id === parentId
                this.addFolderModal = new AddFolder(d.data.id).render();

                Hoot.events.once( 'modal-closed', () => delete this.addFolderModal );
                break;
            case 'modifyDataset': {
                this.modifyLayerModal = new ModifyDataset( tree.selectedNodes ).render();

                Hoot.events.once( 'modal-closed', () => delete this.modifyLayerModal );
                break;
            }
            case 'modifyFolder': {
                this.modifyFolderModal = new ModifyFolder( tree.selectedNodes ).render();

                Hoot.events.once( 'modal-closed', () => delete this.modifyFolderModal );
                break;
            }
            case 'exportTaskGrid': {
                this.exportTaskGridModal = new ExportTaskGrid( d ).render();

                Hoot.events.once( 'modal-closed', () => delete this.exportTaskGridModal );
                break;
            }
            case 'exportAlphaShape': {
                this.exportAlphaShapeModal = new ExportAlphaShape( d ).render();

                Hoot.events.once( 'modal-closed', () => delete this.exportAlphaShapeModal );
                break;
            }
        }
    }

    /**
     * Listen for re-render
     */
    listen() {
        const className = this.constructor.name;
        Hoot.events.listen( className, 'render-dataset-table', () => this.renderFolderTree() );
        Hoot.events.listen( className, 'context-menu', ( ...params ) => this.handleContextMenuClick( params ) );
    }
}
