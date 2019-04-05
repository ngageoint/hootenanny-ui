/** ****************************************************************************************************
 * File: webpack.prod.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const webpack = require( 'webpack' );
const Merge = require( 'webpack-merge' );
const OptimizeCssAssetsPlugin = require( 'optimize-css-assets-webpack-plugin' );
const TerserPlugin = require('terser-webpack-plugin')
const CommonConfig = require( './webpack.base.config' );

module.exports = Merge( CommonConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'initial'
        }
    },
    plugins: [
        new webpack.LoaderOptionsPlugin( {
            minimize: false,
            debug: false
        } ),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                ecma: 6,
            },
        }),
        new OptimizeCssAssetsPlugin( {
            assetNameRegExp: /\.css$/,
            cssProcessorOptions: { discardComments: { removeAll: true } }
        } ),
    ]
} );
