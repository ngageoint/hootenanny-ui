/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import API from '../../util/api';
import Tab from './tab';
import FolderTree from '../folderTree';
import ImportDatasetForm from '../forms/importDatasetForm';
import Events from '../../util/events';
import {
    datasetButtons,
    datasetTableHeaders
} from '../../config/domElements';

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
     * Render all components inside tab body
     */
    render() {
        super.render();

        let buttonContainer = this.tabBody
            .append( 'div' )
            .classed( 'dataset-buttons flex', true );

        let buttons = buttonContainer
            .selectAll( 'button.dataset-action-button' )
            .data( datasetButtons );

        let buttonEach = buttons.enter()
            .append( 'button' )
            .classed( 'dataset-action-button primary text-white flex align-center', true )
            .on( 'click', async item => {
                d3.event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-dataset-single': {
                        let translations = await API.getTranslations();

                        new ImportDatasetForm( translations ).render();

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

        buttonEach.append( 'i' )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttonEach.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );

        let table = this.tabBody
            .append( 'div' )
            .attr( 'id', 'dataset-table' )
            .classed( 'filled-white strong', true );

        table.insert( 'div' )
            .attr( 'id', 'dataset-table-header' )
            .selectAll( 'th' )
            .data( datasetTableHeaders )
            .enter().append( 'th' )
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );

        //new FolderTree( table ).render();
        this.renderDatasetTable( table );
    }

    renderDatasetTable( table ) {
        if ( !this.datasetTable ) {
            this.datasetTable = new FolderTree( table );
            this.datasetTable.render();
        } else {
            this.datasetTable.render();
        }
    }

    listen() {
        Events.listen( 'render-dataset-table', this.renderDatasetTable, this );
    }

    /**
     * Initialize
     */
    init() {
        this.render();
        this.listen();
    }
}