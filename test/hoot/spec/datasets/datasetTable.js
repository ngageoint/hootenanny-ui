/** ****************************************************************************************************
 * File: datasetTable.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/1/18
 *******************************************************************************************************/

const { keypress } = require( '../../helpers' );

describe( 'Datasets', () => {
    let table,
        selected;

    before( () => {
        d3.select( '#navbar .menu-button' ).dispatch( 'click' );

        table = d3.select( '#dataset-table' );
    } );

    it( 'select a dataset', () => {
        let queryString = 'g[data-type="dataset"]',
            dataset     = table.select( queryString ); // use select instead of selectAll to get first element

        dataset.dispatch( 'click' );

        let rect = table.select( queryString )
            .select( 'rect' );

        expect( rect.classed( 'sel' ) ).to.be.true;
    } );

    it( 'deselect a dataset', () => {
        let queryString = 'g[data-type="dataset"]',
            dataset     = table.select( queryString );

        dataset.dispatch( 'click' );

        let rect = table.select( queryString )
            .select( 'rect' );

        expect( rect.classed( 'sel' ) ).to.be.false;
    } );

    it( 'select multiple datasets with META key', () => {
        let datasets = table.selectAll( 'g[data-type="dataset"]' );

        datasets.each( function() {
            let e = new MouseEvent( 'click', {
                metaKey: true
            } );

            d3.select( this ).node().dispatchEvent( e );
        } );

        selected = table.selectAll( 'g[data-type="dataset"] .sel' );

        expect( selected.size() ).to.equal( datasets.size() );
    } );

    it( 'select single dataset after selecting multiple datasets', () => {
        let datasets = table.selectAll( 'g[data-type="dataset"]' );

        // use selected datsets from previous test
        expect( selected.size() ).to.equal( datasets.size() );

        table.select( 'g[data-type="dataset"]' ).dispatch( 'click' );

        selected = table.selectAll( 'g[data-type="dataset"] .sel' );

        expect( selected.size() ).to.equal( 1 );
    } );

    it( 'select groups of datasets with META and SHIFT keys', () => {
        let datasets = table.selectAll( 'g[data-type="dataset"]' );

        // use selected datsets from previous test
        expect( selected.size() ).to.equal( 1 );

        datasets
            .filter( ( d, i ) => i === 3 )
            .each( function() {
                let e = new MouseEvent( 'click', {
                    shiftKey: true
                } );

                d3.select( this ).node().dispatchEvent( e );
            } );

        selected = table.selectAll( 'g[data-type="dataset"] .sel' );

        expect( selected.size() ).to.equal( 4 );

        datasets
            .filter( ( d, i ) => i === 5 )
            .each( function() {
                let e = new MouseEvent( 'click', {
                    metaKey: true
                } );

                d3.select( this ).node().dispatchEvent( e );
            } );

        selected = table.selectAll( 'g[data-type="dataset"] .sel' );

        expect( selected.size() ).to.equal( 5 );
    } );

    it( 'open a folder', () => {
        let queryString = 'g[data-type="folder"]',
            folder      = table.select( queryString );

        folder.dispatch( 'click' );

        let folderIcon = table.select( queryString )
            .select( '._icon' );

        expect( folderIcon.classed( 'open-folder' ) ).to.be.true;
    } );

    it( 'close a folder', () => {
        let queryString = 'g[data-type="folder"]',
            folder      = table.select( queryString );

        folder.dispatch( 'click' );

        let folderIcon = table.select( queryString )
            .select( '._icon' );

        expect( folderIcon.classed( 'open-folder' ) ).to.be.false;
    } );
} );
