/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const path         = require( 'path' );
const { merge }    = require( 'webpack-merge' );
const CommonConfig = require('./webpack.base.config');

module.exports = merge( CommonConfig, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        compress: true,
        port: 8080,
        static: {
            directory: path.join(__dirname, '../dist'),
            publicPath: './',
        },
        proxy: {
            '/hoot-services': 'http://localhost:8888',
            '/static': 'http://localhost:8888',
            '/capabilities': 'http://localhost:8094',
            '/switcher': {
                target: 'http://localhost:8094',
                pathRewrite: { '^/switcher': '' }
            },
            '/p2p': {
                target: 'http://localhost:8096',
                pathRewrite: { '^/p2p': '' }
            },
            '/tasks': {
                target: 'http://localhost:6543',
                pathRewrite: { '^/tasks': '' }
            },
            '/tm4api': {
                target: 'http://localhost:5000',
                pathRewrite: { '^/tm4api': '/api' }
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
    },
    stats: {
        timings: true
    },
});
