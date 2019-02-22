/** ****************************************************************************************************
 * File: helpers.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/2/18
 *******************************************************************************************************/

const _ = require( 'lodash' );

function retrieveFile( filePath ) {
    return new Promise( res => {
        let xhr = new XMLHttpRequest();

        xhr.open( 'GET', filePath, true ); //set path to any file
        xhr.responseType = 'blob';

        xhr.onload  = function() {
            if ( xhr.status === 200 ) {
                let lastSlashIdx = filePath.lastIndexOf( '/' ),
                    fileName     = filePath.substring( lastSlashIdx + 1 );

                // Manually create the guts of the File
                let blob = new Blob( [ this.response ], { type: 'application/octet-stream' } ),
                    bits = [ blob, new ArrayBuffer( blob.size ) ];

                // Put the pieces together to create the File.
                // Typically the raw response Object won't contain the file name
                // so you may have to manually add that as a property.
                let file = new File( bits, fileName, {
                    lastModified: new Date( 0 ),
                    type: 'application/octet-stream'
                } );

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

function generateOsmLayerParams( count ) {
    return Promise.all( _.map( count, async i => {
        let dT   = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
            file = await retrieveFile( 'base/test/data/UndividedHighway.osm' );

        dT.items.add( file );

        let params = {
            NONE_TRANSLATION: 'true',
            TRANSLATION: 'NONE.js',
            INPUT_TYPE: 'OSM',
            INPUT_NAME: `UnitTestLayer${ i }`,
            formData: getFormData( dT.files )
        };

        return params;
    } ) );
}

function generateAdvOptsLayerParams() {
    return Promise.all( [ 'UndividedHighway', 'highwayTest2' ].map( async (layer, index) => {
        let dT = new ClipboardEvent( '' ).clipboardData || new DataTransfer(),
            file = await retrieveFile( `base/test/data/${layer}.osm` );

        dT.items.add( file );

        let params = {
            NONE_TRANSLATION: 'true',
            TRANSLATION: 'NONE.js',
            INPUT_TYPE: 'OSM',
            INPUT_NAME: `advOpts_${layer}`,
            formData: getFormData( dT.files )
        };
        return params;

    } ) );
}

function getFormData( files ) {
    let formData = new FormData();

    _.forEach( files, ( file, i ) => {
        formData.append( `eltuploadfile${ i }`, file );
    } );

    return formData;
}

module.exports = {
    retrieveFile,
    generateOsmLayerParams,
    generateAdvOptsLayerParams
};
