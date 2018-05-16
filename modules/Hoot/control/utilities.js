/*******************************************************************************************************
 * File: utilities.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/13/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export const getBrowserInfo = () => {
    let browserInfo = {},
        appVerStr   = navigator.userAgent,
        appVer      = appVerStr.match( /(chrome|chromium|opera|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i ) || [];

    if ( appVer.length > 2 ) {
        browserInfo.name    = appVer[ 1 ];
        browserInfo.version = appVer[ 2 ];
        // check detailed version

        let parts = appVerStr.split( ' ' );

        _.each( parts, function( part ) {
            if ( part.indexOf( browserInfo.name ) === 0 ) {
                let subParts = part.split( '/' );

                if ( subParts.length > 1 ) {
                    browserInfo.version = subParts[ 1 ];
                }
            }
        } );
    }

    return browserInfo;
};

export const getOS = () => {
    let os;

    if ( navigator.userAgent.indexOf( 'Win' ) > -1 ) {
        os = 'win';
    } else if ( navigator.userAgent.indexOf( 'Mac' ) > -1 ) {
        os = 'mac';
    } else if ( navigator.userAgent.indexOf( 'X11' ) > -1 || navigator.userAgent.indexOf( 'Linux' ) > -1 ) {
        os = 'linux';
    } else {
        os = 'win';
    }

    return os;
};

export const isValidCoords = coords => {
    return ( coords.length === 2 ||
        ( !isNaN( coords[ 0 ] ) && !isNaN( coords[ 1 ] ) ) ||
        ( coords[ 0 ] < 180.0 && coords[ 0 ] > -180.0 ) ||
        ( coords[ 1 ] < 90.0 && coords[ 1 ] > -90.0 )
    );
};