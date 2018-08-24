/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _            from 'lodash-es';
import Hoot         from '../../../hoot';
import FolderTree   from '../../../tools/folderTree';

import Tab               from '../tab';
import ImportDatasetForm from './importDatasetForm';
import AddFolderForm     from './addFolderForm';

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

                        new ImportDatasetForm( 'single', translations ).render();
                        break;
                    }
                    case 'import-datasets-directory': {
                        let translations = await Hoot.api.getTranslations();

                        new ImportDatasetForm( 'multi', translations ).render();
                        break;
                    }
                    case 'add-datasets-folder': {
                        new AddFolderForm().render();
                        break;
                    }
                    case 'refresh-datasets-layers': {

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
     * Remove one or multiple datasets from the table
     *
     * @param d
     * @param layers
     */
    async deleteDataset( { d, layers } ) {
        let warningMsg = d.type === 'folder' ? 'folder and all data?' : 'datasets?';

        let message = `Are you sure you want to remove the selected ${ warningMsg }`,
            confirm = await Hoot.message.confirm( message );

        if ( confirm ) {
            // delete in parallel
            Promise.all( _.map( layers, layer => {
                let node = this.table.selectAll( `g[data-id="${ layer.id }"]` );

                node.select( 'rect' )
                    .classed( 'sel', false )
                    .style( 'fill', 'rgb(255,0,0)' );

                return Hoot.api.deleteLayer( layer.name )
                    .then( () => Hoot.layers.removeLayer( layer.id ) );

            } ) ).then( () => Hoot.events.emit( 'render-dataset-table' ) );
        }
    }

    /**
     * Listen for re-render
     */
    listen() {
        Hoot.events.on( 'render-dataset-table', () => this.renderFolderTree() );
        Hoot.events.on( 'delete-dataset', params => this.deleteDataset( params ) );
    }
}