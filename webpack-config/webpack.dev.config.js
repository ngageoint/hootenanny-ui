/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const path         = require( 'path' );
const Merge        = require( 'webpack-merge' );
const CommonConfig = require('./webpack.base.config');

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
            '/hoot-services': 'http://localhost:8888',
            '/capabilities': 'http://localhost:8094',
            '/switcher': {
                target: 'http://localhost:8094',
                pathRewrite: { '^/switcher': '' }
            },
            '/p2p': {
                target: 'http://localhost:8096',
                pathRewrite: { '^/p2p': '' }
            }
        }
    },
    module: {
        rules: [
            {
                test: path.resolve( './modules/Hoot/config/apiConfig.js' ),
                loader: 'string-replace-loader',
                options: {
                    multiple: [
                        {
                            search: '8094',
                            replace: '/switcher'
                        },
                        {
                            search: '8096',
                            replace: '/p2p'
                        }
                    ]
                },
            }
        ]
    }
});
