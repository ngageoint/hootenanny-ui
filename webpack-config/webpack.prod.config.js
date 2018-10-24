/** ****************************************************************************************************
 * File: webpack.prod.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

import webpack from 'webpack';
import Merge from 'webpack-merge';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import CommonConfig from './webpack.base.config';

export default Merge( CommonConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js?$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    // plugins: [
    //     new webpack.LoaderOptionsPlugin( {
    //         minimize: false,
    //         debug: false
    //     } ),
    //     new webpack.optimize.ModuleConcatenationPlugin(),
    //     new UglifyJsPlugin( {
    //         sourceMap: false
    //     } ),
    //     new OptimizeCssAssetsPlugin( {
    //         assetNameRegExp: /\.min\.css$/,
    //         cssProcessorOptions: { discardComments: { removeAll: true } }
    //     } ),
    //     new LodashModuleReplacementPlugin()
    // ]
} );
