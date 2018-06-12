/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import _             from 'lodash-es';
import API           from '../control/api';
import FolderTree    from '../models/folderTree';
import DatasetImport from '../forms/datasetImport';
import Event         from '../managers/eventManager';
import LayerManager  from '../managers/layerManager';
import Tab           from './tab';

import {
    datasetButtons,
    datasetTableHeaders
} from '../config/domElements';

/**
 * Creates the datasets tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Datasets extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Datasets';
        this.id   = 'manage-datasets';
    }

    /**
     * Render view inside tab body
     */
    render() {
        super.render();

        let buttonContainer = this.panelContent
            .append( 'div' )
            .classed( 'dataset-buttons flex', true )
            .selectAll( 'button.dataset-action-button' )
            .data( datasetButtons );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'dataset-action-button primary text-light flex align-center', true )
            .on( 'click', async item => {
                d3.event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-dataset-single': {
                        let translations = await API.getTranslations();

                        new DatasetImport( translations ).render();
                        break;
                    }
                    case 'import-dataset-directory': {

                        break;
                    }
                    case 'add-dataset-folder': {

                        break;
                    }
                    case 'refresh-dataset-layers': {

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

        let table = this.panelContent.append( 'div' )
            .attr( 'id', 'dataset-table' )
            .classed( 'filled-white strong overflow', true );

        table.insert( 'div' ).attr( 'id', 'dataset-table-header' )
            .selectAll( 'th' )
            .data( datasetTableHeaders )
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
    deleteDataset( { d, layers } ) {
        let warningMsg = d.type === 'folder' ? 'folder and all data?' : 'dataset?';

        if ( !window.confirm( 'Are you sure you want to remove the selected ' + warningMsg ) ) return;

        // delete in parallel
        Promise.all( _.map( layers, layer => {
            let node = this.table.selectAll( `g[data-id="${ layer.id }"]` );

            node.select( 'rect' )
                .classed( 'sel', false )
                .style( 'fill', 'rgb(255,0,0)' );

            return API.deleteLayer( layer.name )
                .then( () => LayerManager.removeLayer( layer.id ) );

        } ) ).then( () => Event.send( 'render-dataset-table' ) );
    }

    /**
     * Listen for re-render
     */
    listen() {
        Event.listen( 'render-dataset-table', this.renderFolderTree, this );
        Event.listen( 'delete-dataset', this.deleteDataset, this );
    }
}