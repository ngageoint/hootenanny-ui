/** ****************************************************************************************************
 * File: helpers.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/2/18
 *******************************************************************************************************/

module.exports = {
    retrieveFile: () => {
        return new Promise( res => {
            let xhr = new XMLHttpRequest();

            let filePath = 'base/test/data/UndividedHighway.osm';

            xhr.open( 'GET', filePath, true ); //set path to any file
            xhr.responseType = 'blob';

            xhr.onload  = function() {
                if ( xhr.status === 200 ) {
                    let files = []; // This is our files array

                    // Manually create the guts of the File
                    let blob = new Blob( [ this.response ], { type: 'application/octet-stream' } ),
                        bits = [ blob, new ArrayBuffer( blob.size ) ];

                    // Put the pieces together to create the File.
                    // Typically the raw response Object won't contain the file name
                    // so you may have to manually add that as a property.
                    let file = new File( bits, 'UndividedHighway.osm', {
                        lastModified: new Date( 0 ),
                        type: 'application/octet-stream'
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
};
