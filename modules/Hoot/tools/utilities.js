/*******************************************************************************************************
 * File: utilities.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/13/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';

import { t } from '../../util/locale';

export const getBrowserInfo = () => {
    let browserInfo = {},
        appVerStr   = navigator.userAgent,
        appVer      = appVerStr.match( /(chrome|chromium|opera|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i ) || [];

    if ( appVer.length > 2 ) {
        browserInfo.name    = appVer[ 1 ];
        browserInfo.version = appVer[ 2 ];
        // check detailed version

        let parts = appVerStr.split( ' ' );

        _forEach( parts, function( part ) {
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
    return (coords.length === 2 ||
        (!isNaN( coords[ 0 ] ) && !isNaN( coords[ 1 ] )) ||
        (coords[ 0 ] < 180.0 && coords[ 0 ] > -180.0) ||
        (coords[ 1 ] < 90.0 && coords[ 1 ] > -90.0)
    );
};

export const specialCharsExist = str => {
    let pattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g );

    return pattern.test( str );
};

export const unallowableWordsExist = str => {
    let unallowable = [ 'root', 'dataset', 'datasets', 'folder' ];

    return unallowable.indexOf( str.toLowerCase() ) >= 0;
};

export const checkForUnallowedChar = str => {
    if ( specialCharsExist( str ) ) {
        return `Please do not use special characters: ${ str }.`;
    }

    if ( unallowableWordsExist( str ) ) {
        return `Please do not use any unallowable terms: ${ str }.`;
    }

    return true;
};

export const tooltipHtml = ( text, key ) => {
    let html = `<span>${ text }</span>`;

    if ( key ) {
        html += `<div class="keyhint-wrap">
                    <span>${ t( 'tooltip_keyhint' ) }</span>
                    <span class="keyhint">${ key }</span>
                </div>`;
    }

    return html;
};

export const isNaN = x => {
    return Number.isNaN( parseFloat( x ) );
};

export const titleCase = text => {
    return text[0].toUppercase() + text.slice(1);
};