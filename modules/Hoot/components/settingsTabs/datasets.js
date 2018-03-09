/** ****************************************************************************************************
 * File: datasets.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';
import FolderTree from '../folderTree';
import {
    datasetButtons,
    datasetTableHeaders
} from '../../config/domElements';

export default class Datasets extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Datasets';
        this.id   = 'util-datasets';
    }

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
            .attr( 'class', d => `${ d.class } dataset-action-button primary text-white flex align-center` )
            .on( 'click', function( d ) {

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

        new FolderTree( table ).init();
    }

    init() {
        this.render();
    }
}