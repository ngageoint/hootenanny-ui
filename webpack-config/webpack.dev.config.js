/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

// import Merge from 'webpack-merge';
// import CommonConfig from './webpack.base.config';

const Merge = require( 'webpack-merge' );
const CommonConfig = require( './webpack.base.config' );

// export default () => {
//     return Merge( CommonConfig, {
//         mode: 'development',
//         devtool: 'cheap-module-source-map',
//         devServer: {
//             compress: true,
//             port: 9000,
//             publicPath: '/',
//             contentBase: './dist',
//             stats: {
//                 timings: true
//             }
//         }
//     } );
// }

module.exports = Merge( CommonConfig, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        compress: true,
        port: 8080,
        publicPath: '/',
        contentBase: './dist',
        stats: {
            timings: true
        },
        proxy: {
            '/hoot-services': {
                target: 'http://35.174.111.201:8080'
            }
        }
    }
} );
