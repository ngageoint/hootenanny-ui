/** ****************************************************************************************************
 * File: webpack.prod.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const webpack = require( 'webpack' );
const { merge } = require( 'webpack-merge' );
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require( 'css-minimizer-webpack-plugin' );
const CommonConfig = require( './webpack.base.config' );

module.exports = merge( CommonConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'initial',
            name: (module, chunks, cacheGroupKey) => {
                const allChunksNames = chunks.map((chunk) => chunk.name).join('~');
                const prefix = cacheGroupKey === 'defaultVendors' ? 'vendors' : cacheGroupKey;
                return `${prefix}~${allChunksNames}`;
              },
        },
        minimize: true,
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            // `...`,
            new TerserPlugin(),
            new CssMinimizerPlugin(),
        ]
    },

    plugins: [
        new webpack.LoaderOptionsPlugin( {
            minimize: false,
            debug: false
        } ),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new MiniCssExtractPlugin(),
    ]
} );
