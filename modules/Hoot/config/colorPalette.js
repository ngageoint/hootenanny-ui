/*******************************************************************************************************
 * File: colorPalette.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/20/18
 *******************************************************************************************************/

import _ from 'lodash-es';

//export default [
//    {
//        name: 'gold',
//        hex: '#ffcc00'
//    },
//    {
//        name: 'orange',
//        hex: '#ff7f2a'
//    },
//    {
//        name: 'violet',
//        hex: '#ff5599'
//    },
//    {
//        name: 'purple',
//        hex: '#e580ff'
//    },
//    {
//        name: 'blue',
//        hex: '#5fbcd3'
//    },
//    {
//        name: 'teal',
//        hex: '#5fd3bc'
//    },
//    {
//        name: 'green',
//        hex: '#A7C973'
//    },
//    {
//        name: 'osm',
//        hex: ''
//    }
//];

export default function palette( name ) {
    let palette = [
        {
            name: 'gold',
            hex: '#ffcc00'
        },
        {
            name: 'orange',
            hex: '#ff7f2a'
        },
        {
            name: 'violet',
            hex: '#ff5599'
        },
        {
            name: 'purple',
            hex: '#e580ff'
        },
        {
            name: 'blue',
            hex: '#5fbcd3'
        },
        {
            name: 'teal',
            hex: '#5fd3bc'
        },
        {
            name: 'green',
            hex: '#A7C973'
        },
        {
            name: 'osm',
            hex: ''
        }
    ];

    if ( !name ) {
        return palette;
    }

    let obj = _.find( palette, color => color.name === name || color.hex === name );

    return obj.name === name ? obj.hex : obj.name;
}