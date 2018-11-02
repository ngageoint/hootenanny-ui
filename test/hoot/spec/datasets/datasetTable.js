/** ****************************************************************************************************
 * File: datasetTable.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/1/18
 *******************************************************************************************************/

describe( 'Datasets', () => {
    let table,
        selected,
        folderId;

    before( () => {
        d3.select( '#navbar .menu-button' ).dispatch( 'click' );

        table = d3.select( '#dataset-table' );
    } );

    it( 'select a dataset', () => {
        let dataset = table.select( 'g[data-type="dataset"]' ); // use select instead of selectAll to get first element

        dataset.dispatch( 'click' );

        let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );

        expect( rect.classed( 'sel' ) ).to.be.true;
    } );

    it( 'deselect a dataset', () => {
        let dataset = table.select( 'g[data-type="dataset"]' );

        dataset.dispatch( 'click' );

        let rect = table.select( 'g[data-type="dataset"]' ).select( 'rect' );

        expect( rect.classed( 'sel' ) ).to.be.false;
    } );

    it( 'select multiple datasets with META key', () => {
        let datasets = table.selectAll( 'g[data-type="dataset"]' );

        datasets.each( function() {
            let e = new MouseEvent( 'click', { metaKey: true } );

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
                let e = new MouseEvent( 'click', { shiftKey: true } );

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

    it( 'open a folder with children', () => {
        let isChild = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 );

        folderId = isChild[ 0 ].folderId;

        let childrenCount = _.filter( isChild, child => child.folderId === folderId ).length,
            nodesCount    = table.selectAll( 'g.node' ).size();

        let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );

        folder.dispatch( 'click' );

        let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
            newNodesCount = table.selectAll( 'g.node' ).size();

        expect( folderIcon.classed( 'open-folder' ) ).to.be.true;
        expect( newNodesCount ).to.equal( nodesCount + childrenCount );
    } );

    it( 'close a folder with children', () => {
        let isChild       = _.filter( Hoot.layers.allLayers, layer => layer.folderId && layer.folderId > 0 ),
            childrenCount = _.filter( isChild, child => child.folderId === folderId ).length, // use folder ID from previous test
            nodesCount    = table.selectAll( 'g.node' ).size();

        let folder = table.select( `g[data-type="folder"][data-id="${folderId}"]` );

        folder.dispatch( 'click' );

        let folderIcon    = table.select( `g[data-type="folder"][data-id="${folderId}"]` ).select( '._icon' ),
            newNodesCount = table.selectAll( 'g.node' ).size();

        expect( folderIcon.classed( 'open-folder' ) ).to.be.false;
        expect( newNodesCount ).to.equal( nodesCount - childrenCount );
    } );

    it( 'open context menu for single dataset', () => {
        let dataset = table.select( 'g[data-type="dataset"]' );

        dataset.dispatch( 'click' ); // make sure only one dataset is selected

        let e = new MouseEvent( 'contextmenu' );

        dataset.node().dispatchEvent( e );

        let contextMenu = d3.select( '.context-menu' ),
            items       = contextMenu.selectAll( 'li' );

        expect( contextMenu.style( 'display' ) ).to.equal( 'block' );
        expect( items.size() ).to.equal( 7 );
    } );
} );
