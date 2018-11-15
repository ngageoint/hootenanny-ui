/** ****************************************************************************************************
 * File: webpack.base.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const { resolve }          = require( 'path' );
const webpack              = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const CopyWebpackPlugin    = require( 'copy-webpack-plugin' );

const
    extractAssets  = new CopyWebpackPlugin( [
        {
            from: './img', // context: root
            to: './img' // context: dist
        }
    ] ),
    includeModules = new webpack.ProvidePlugin( {
        $: 'jquery',
        jQuery: 'jquery'
    } );

module.exports = {
    context: resolve( __dirname, '../' ),
    entry: {
        iD: './modules/id.js',
        hoot: './modules/Hoot/hoot.js',
        login: './modules/Hoot/login.js'
    },
    output: {
        path: resolve( __dirname, '../dist/' ),
        filename: '[name].min.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.(jpe?g|gif|png|svg|ttf|wav|mp3)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'img/',
                            name: '[name].[ext]'
                        }
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            disable: true, // webpack@2.x and newer
                        }
                    }
                ]
            },
            // {
            //     test: /\.css$/,
            //     use: [
            //         'style-loader',
            //         MiniCssExtractPlugin.loader,
            //         'css-loader'
            //     ]
            // },
            {
                test: /\.(scss|css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
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
        new MiniCssExtractPlugin( {
            filename: '[name].css'
        } )
    ],
    node: {
        dns: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty'
    }
};
