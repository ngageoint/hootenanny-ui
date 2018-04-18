/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import API               from '../../control/api';
import Tab               from './tab';
import FolderTree        from '../models/folderTree';
import DatasetImportForm from '../forms/datasetImportForm';
import Event             from '../../managers/eventManager';
import {
    datasetButtons,
    datasetTableHeaders
}                        from '../../config/domElements';

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
        this.id   = 'util-datasets';
    }

    /**
     * Render all view inside tab body
     */
    render() {
        super.render();

        this.createButtonContainer();
        this.createTable();
        this.createButtons();
        this.renderFolderTree();

        this.listen();
    }

    /**
     * Create the container that wraps all dataset action buttons
     */
    createButtonContainer() {
        this.buttonContainer = this.tabBody
            .append( 'div' )
            .classed( 'dataset-buttons flex', true )
            .selectAll( 'button.dataset-action-button' )
            .data( datasetButtons );
    }

    /**
     * Create each dataset action button
     */
    createButtons() {
        let eachButton = this.buttonContainer.enter()
            .append( 'button' )
            .classed( 'dataset-action-button primary text-light flex align-center', true )
            .on( 'click', async item => {
                d3.event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-dataset-single': {
                        let translations = await API.getTranslations();

                        new DatasetImportForm( translations ).render();
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

        eachButton.append( 'i' )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        eachButton.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );
    }

    /**
     * Create dataset table
     */
    createTable() {
        this.table = this.tabBody.append( 'div' )
            .attr( 'id', 'dataset-table' )
            .classed( 'filled-white strong overflow', true );

        this.table.insert( 'div' ).attr( 'id', 'dataset-table-header' )
            .selectAll( 'th' )
            .data( datasetTableHeaders )
            .enter().append( 'th' )
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );
    }

    /**
     * Render dataset folder tree inside table
     */
    renderFolderTree() {
        if ( !this.datasetTable ) {
            this.datasetTable = new FolderTree( this.table );
        }

        this.datasetTable.render();
    }

    deleteDataset( d ) {
        let warningMsg = d.type ==='folder'? 'folder and all data?' : 'dataset?';

        if(!window.confirm('Are you sure you want to remove the selected ' + warningMsg)){return;}
    }

    /**
     * Listen for re-render
     */
    listen() {
        Event.listen( 'render-dataset-table', this.renderFolderTree, this );
    }
}