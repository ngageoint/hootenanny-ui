/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const path         = require( 'path' );
const Merge        = require( 'webpack-merge' );
const CommonConfig = require( './webpack.base.config' );

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
            '/hoot-services': 'http://35.174.111.201:8080',
            '/capabilities': 'http://35.174.111.201:8094',
            '/switcher': {
                target: 'http://35.174.111.201:8094',
                pathRewrite: { '^/switcher': '' }
            },
            '/p2p': {
                target: 'http://35.174.111.201:8096',
                pathRewrite: { '^/switcher': '' }
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
                            search: '8094',
                            replace: '/p2p'
                        }
                    ]
                },
            }
        ]
    }
} );
