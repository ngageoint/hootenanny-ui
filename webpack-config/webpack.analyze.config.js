/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const Merge        = require( 'webpack-merge' );
const CommonConfig = require('./webpack.base.config');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = Merge( CommonConfig, {
    plugins: [
        new BundleAnalyzerPlugin({ // if you want to json, just uncomment
            analyzerPort: '8675',
            // analyzerMode: 'disabled',
            // generateStatsFile: true,
            // statsFilename: 'bundle_stats.json'
        })
    ]
} );
