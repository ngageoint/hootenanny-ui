// Karma configuration
// Generated on Mon Oct 29 2018 14:12:47 GMT-0400 (Eastern Daylight Time)

const { resolve, join } = require( 'path' );
const _ = require( 'lodash' );
const Merge = require( 'webpack-merge' );
const baseConfig = require( './webpack-config/webpack.base.config' );

const webpackConfig = Merge( baseConfig, {
    mode: 'development',
    entry: './test/index.js',
    module: {
        rules: [
            // instrument only testing sources with Istanbul
            {
                test: /\.js$/,
                use: {
                    loader: 'istanbul-instrumenter-loader',
                    options: { esModules: true }
                },
                include: resolve( __dirname, 'modules/Hoot/' ),
                enforce: 'post'
                // exclude: /node_modules|\.spec\.js$/
            }
        ]
    },
    resolve: {
        alias: {
            img: resolve( __dirname, 'img' ),
            lib: resolve( __dirname, 'modules/lib' )
        }
    },
} );

const materialIconFiles = [
    { pattern: 'node_modules/material-design-icons/iconfont/material-icons.css', included: true },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.eot', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.svg', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.ttf', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff2', included: false },
];

module.exports = function( config ) {
    config.set( {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: [ 'mocha' ],


        // list of files / patterns to load in the browser
        files: [
            ...materialIconFiles,
            { pattern: 'img/**/*.svg', included: false },
            { pattern: 'img/**/*.png', included: false },
            { pattern: 'img/**/*.gif', included: false },
            'css/**/*.css',
            'css/**/*.scss',
            'test/index.js'
        ],


        // list of files / patterns to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/index.js': [ 'webpack' ],
            'css/**/*.scss': [ 'scss' ]
        },


        proxies: {
            '/img/': '/base/img/'
        },


        webpack: webpackConfig,


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: [ 'spec', 'coverage-istanbul' ],


        coverageIstanbulReporter: {
            reports: [ 'html', 'lcov', 'text-summary' ],
            dir: join( __dirname, 'coverage' ),
            fixWebpackSourcePaths: true
        },


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [ 'Chrome' ],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 1
    } );
};
