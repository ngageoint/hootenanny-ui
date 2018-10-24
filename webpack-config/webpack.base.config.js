/** ****************************************************************************************************
 * File: webpack.base.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

import { resolve } from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const
    extractAssets  = new CopyWebpackPlugin( [
        {
            from: './img', // context: root
            to: './img' // context: dist
        }
    ] ),
    includeModules = new webpack.ProvidePlugin( {
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    } );

export default {
    context: resolve( __dirname, '../' ),
    entry: {
        iD: './modules/id.js',
    },
    output: {
        path: resolve( __dirname, '../dist/' ),
        filename: '[name].min.js',
        publicPath: '/',
        globalObject: this
    },
    module: {
        rules: [
            {
                test: /\.(jpe?g|gif|png|svg|ttf|wav|mp3)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        outputPath: 'img/',
                        // publicPath: '/',
                        name: '[name].[ext]'
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    // 'resolve-url-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    resolve: {
        alias: {
            img: resolve( __dirname, '../img' ),
            lib: resolve( __dirname, '../modules/lib' )
        }
    },
    plugins: [
        extractAssets,
        includeModules,
        // new HtmlWebpackPlugin( {
        //     hash: true,
        //     template: './templates/index.html',
        //     chunks: [ 'index' ],
        //     filename: '../dist/index.html'
        // } ),
        new MiniCssExtractPlugin( {
            fileName: 'iD.css'
        } ),
        new webpack.EnvironmentPlugin( [ 'NODE_ENV', 'BUILD_INFO' ] )
    ],
    node: {
        dns: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    }
};
