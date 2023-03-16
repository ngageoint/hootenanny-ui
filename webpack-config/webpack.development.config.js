/** ****************************************************************************************************
 * File: webpack.dev.config.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/24/18
 *******************************************************************************************************/

const path         = require( 'path' );
const { merge }    = require( 'webpack-merge' );
const CommonConfig = require('./webpack.base.config');

const HOOT_SERVICES_HOST = process.env.HOOT_SERVICES_HOST || '127.0.0.1'
const HOOT_SERVICES_PORT = process.env.HOOT_SERVICES_PORT || '8888'
const HOOT_TM_HOST = process.env.HOOT_TM_HOST || '127.0.0.1'

module.exports = merge( CommonConfig, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        compress: true,
        server: 'https',
        port: 8080,
        static: {
            directory: path.join(__dirname, '../dist'),
            publicPath: '/',
        },
        proxy: {
            '/hoot-services': `http://${HOOT_SERVICES_HOST}:${HOOT_SERVICES_PORT}`,
            '/static': `http://${HOOT_SERVICES_HOST}:${HOOT_SERVICES_PORT}`,
            '/capabilities': `http:${HOOT_SERVICES_HOST}:8094`,
            '/switcher': {
                target: `http://${HOOT_SERVICES_HOST}:8094`,
                pathRewrite: { '^/switcher': '' }
            },
            '/p2p': {
                target: `http://${HOOT_SERVICES_HOST}:8096`,
                pathRewrite: { '^/p2p': '' }
            },
            '/tasks': {
                target: `http://${HOOT_TM_HOST}:6543`,
                pathRewrite: { '^/tasks': '' }
            },
            '/tm4api': {
                target: `http://${HOOT_TM_HOST}:5000`,
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
        timings: true,
        errorDetails: true
    },
});
