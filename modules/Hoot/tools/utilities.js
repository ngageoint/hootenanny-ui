/*******************************************************************************************************
 * File: utilities.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/13/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';
import { t } from '../../core/localizer';

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
    return ( coords.length === 2 ||
        ( !isNaN( coords[ 0 ] ) && !isNaN( coords[ 1 ] ) ) ||
        ( coords[ 0 ] < 180.0 && coords[ 0 ] > -180.0 ) ||
        ( coords[ 1 ] < 90.0 && coords[ 1 ] > -90.0 )
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
    return text[ 0 ].toUpperCase() + text.slice( 1 );
};

export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString( 16 );
    } );
};

//Returns comma delimited bounds in order: minx,miny,maxx,maxy e.g.38,-105,39,-104
export const formatBbox = str => {
    const coords = str.split( ',' );
    if ( coords.length !== 4 ) {
        Hoot.message.alert( new Error( 'Bbox needs to have 4 numbers!' ) );
        return;
    }

    let minx = +coords[ 0 ],
        miny = +coords[ 1 ],
        maxx = +coords[ 2 ],
        maxy = +coords[ 3 ];

    if ( minx > maxx ) {
        [ minx, maxx ] = [ maxx, minx ];
    }
    if ( miny > maxy ) {
        [ miny, maxy ] = [ maxy, miny ];
    }

    return `${minx},${miny},${maxx},${maxy}`;
};

export const polyStringFromGeom = geom => {
    return Hoot.context.layers().layer('data').getCoordsString( geom );
};

export const polyStringToCoords = str => {
    return str.split(';').map( coordString => {
        const coords = coordString.split(',');
        return [ +coords[0], +coords[1] ];
    } );
};

// converts string of coordinates list into list of list of coords
// ie. str: -77.212,39.056;-77.207,39.057;-77.212,39.056;-77.240,39.091;-77.245,39.093;-77.240,39.091
// into:
// [
//     [
//         [-77.212,39.056],
//         [-77.207,39.057],
//         [-77.212,39.056]
//     ],
//     [
//         [-77.240,39.091],
//         [-77.245,39.093],
//         [-77.240,39.091]
//     ]
// ]
export const polyStringToCoordsList = str => {
    let coordsList = [];
    let coordArray = str.split(';');
    let index = 0;

    while (index < coordArray.length) {
        let lastIndex = coordArray.indexOf( coordArray[index], index + 1 );
        // just to prevent infinite loop. grab everything up to end of array
        lastIndex = lastIndex > -1 ? lastIndex : coordArray.length - 1;

        let singlePolyCoords = coordArray.slice(index, lastIndex+1).join( ';' );
        coordsList.push( polyStringToCoords( singlePolyCoords ) );
        index = lastIndex + 1;
    }

    return coordsList;
};

export const duration = (start, end, ago) => {
    let duration,
        diff = (end - start) / 1000;

    function calcDiff(diff, unit) {
        let calc;
        if (diff < 1) {
            calc = `less than a ${unit}`;
        } else if (diff === 1) {
            let article = unit === 'hour' ? 'an' : 'a';
            calc = `${article} ${unit}`;
        } else if (diff < 5 && !ago) {
            calc = `a few ${unit}s`;
        } else {
            calc = `${diff} ${unit}s`;
        }
        return calc;
    }

    let units = [
        {unit: 'second', value: 1}, //seconds per second
        {unit: 'minute', value: 60}, //seconds per minute
        {unit: 'hour', value: 60}, //minutes per hour
        {unit: 'day', value: 24}, //hours per day
        {unit: 'month', value: 30}, //days per month
        {unit: 'year', value: 12},  //months per year
        {unit: 'millennium', value: 1000} // years per millennium
    ];
    let lastUnit = units[0].unit;

    for (let i=0; i<units.length; i++) {
        let unit = units[i].unit;
        let value = units[i].value;
        if (diff < value) {
            duration = calcDiff(Math.floor(diff), lastUnit);
            break;
        }
        diff /= value;
        lastUnit = unit;
    }

    if (ago) {
        duration += ' ago';
    }

    return duration;
};

export const formatSize = fileSize => {
    let size  = fileSize,
        units = [ 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ],
        u     = -1;

    if ( Math.abs( size ) < 1000 ) {
        return size + ' B';
    }

    do {
        size /= 1000;
        ++u;
    } while ( Math.abs( size ) >= 1000 && u < units.length - 1 );

    return size.toFixed( 1 ) + ' ' + units[ u ];
};
