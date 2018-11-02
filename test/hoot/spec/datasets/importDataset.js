import _forEach from 'lodash-es/forEach';

/** ****************************************************************************************************
 * File: importDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/2/18
 *******************************************************************************************************/

function retrieveFile() {
    return new Promise( res => {
        let xhr = new XMLHttpRequest();

        let filePath = 'base/test/data/UndividedHighway.osm';

        xhr.open( 'GET', filePath, true ); //set path to any file
        xhr.responseType = 'blob';

        xhr.onload  = function() {
            if ( xhr.status === 200 ) {
                let files = []; // This is our files array

                // Manually create the guts of the File
                let blob = new Blob( [ this.response ], { type: this.response.type } );
                let bits = [ blob, 'test', new ArrayBuffer( blob.size ) ];

                // Put the pieces together to create the File.
                // Typically the raw response Object won't contain the file name
                // so you may have to manually add that as a property.
                let file = new File( bits, 'UndividedHighway.osm', {
                    lastModified: new Date( 0 ),
                    type: this.response.type
                } );

                files.push( file );

                res( file );
            }
            else {
                console.log( 'Retrieve file failed' );
            }
        };
        xhr.onerror = function( e ) {
            console.log( 'Retrieved file failed: ' + JSON.stringify( e ) );
        };

        xhr.send( null );
    } );
}

describe( 'Import Dataset', () => {
    it( 'open modal', done => {
        expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 0 );

        d3.select( '.dataset-action-button:first-child' ).dispatch( 'click' );

        setTimeout( () => {
            expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 1 );
            done();
        }, 200 );
    } );

    it( 'validates inputs', async () => {
        let form = d3.select( '#datasets-import-form' );

        let importType       = form.select( '#importType' ),
            importFile       = form.select( '#importFile' ),
            importLayerName  = form.select( '#importLayerName' ),
            importFolderName = form.select( '#importNewFolderName' ),
            importSchema     = form.select( '#importSchema' ),
            fileIngest       = form.select( '#ingestFileUploader' ),
            importSubmit     = form.select( '#importSubmitBtn' );

        expect( importType.property( 'value' ) ).to.be.empty;
        expect( importFile.property( 'disabled' ) ).to.be.true;
        expect( importSchema.property( 'disabled' ) ).to.be.true;

        importType
            .property( 'value', 'File (shp, zip, gdb.zip)' )
            .dispatch( 'change' );

        expect( importFile.property( 'disabled' ) ).to.be.false;
        expect( importSchema.property( 'disabled' ) ).to.be.false;
        expect( importSubmit.property( 'disabled' ) ).to.be.true;

        let dT   = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
            file = await retrieveFile();

        dT.items.add( file );

        fileIngest.node().files = dT.files;

        await fileIngest.dispatch( 'change' );

        expect( importFile.property( 'value' ) ).to.equal( 'UndividedHighway.osm' );
        expect( importLayerName.property( 'value' ) ).to.equal( 'UndividedHighway' );
        expect( importSubmit.property( 'disabled' ) ).to.be.false;

        importFolderName
            .property( 'value', '!' )
            .dispatch( 'keyup' );

        expect( importFolderName.classed( 'invalid' ) ).to.be.true;
        expect( importSubmit.property( 'disabled' ) ).to.be.true;

        importLayerName
            .property( 'value', '' )
            .dispatch( 'keyup' );

        importFolderName
            .property( 'value', '' )
            .dispatch( 'keyup' );

        expect( importLayerName.classed( 'invalid' ) ).to.be.true;
        expect( importFolderName.classed( 'invalid' ) ).to.be.false;
        expect( importSubmit.property( 'disabled' ) ).to.be.true;

        importLayerName
            .property( 'value', 'UndividedHighway' )
            .dispatch( 'keyup' );
    } );

    it( 'uploads a file', () => {

    } );

    // it( 'close modal', () => {
    //     expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 1 );
    //
    //     d3.select( '#datasets-import-form ._icon.close' ).dispatch( 'click' );
    //
    //     expect( d3.select( '#datasets-import-form' ).size() ).to.equal( 0 );
    // } );
} );
