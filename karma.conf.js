// Karma configuration
// Generated on Mon Oct 29 2018 14:12:47 GMT-0400 (Eastern Daylight Time)

const path = require( 'path' );
const Merge             = require( 'webpack-merge' );
const baseConfig        = require( './webpack-config/webpack.base.config' );

const materialIconFiles = [
    { pattern: 'node_modules/material-design-icons/iconfont/material-icons.css', included: true },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.eot', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.svg', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.ttf', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', included: false },
    { pattern: 'node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff2', included: false },
];

const webpackConfig = Merge( baseConfig, {
    mode: 'development',
    entry: './test/hoot/index.js',
  
  module: {
        rules: [
            // instrument only testing sources with Istanbulvar fs = require('fs')

            {
                test: /\.js$/,
                use: {
                    loader: 'istanbul-instrumenter-loader',
                    options: { esModules: true }
                },
                include: path.resolve( __dirname, 'modules/Hoot/' ),
                enforce: 'post'
                // exclude: /node_modules|\.spec\.js$/
            }
        ]
    },
    resolve: {
        alias: {
            img: path.resolve( __dirname, 'img' ),
            lib: path.resolve( __dirname, 'modules/lib' )
        }
    },
} );

module.exports = function( config ) {
    config.set( {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: [ 'mocha' ],


        client: {
            mocha: {
                timeout: 5000
            }
        },


        // list of files / patterns to load in the browser
        files: [
            ...materialIconFiles,

            { pattern: 'img/**/*.svg', included: false },
            { pattern: 'img/**/*.png', included: false },
            { pattern: 'img/**/*.gif', included: false },

            { pattern: 'test/data/UndividedHighway.osm', included: false },
            { pattern: 'test/data/UnitTestImportMulti.dbf', included: false },
            { pattern: 'test/data/UnitTestImportMulti.shp', included: false },
            { pattern: 'test/data/UnitTestImportMulti.shx', included: false },
            { pattern: 'test/data/RomanColosseum_WV2naturalcolor_clip.tif', included: false},

            'css/**/*.css',
            'css/**/*.scss',
            'test/hoot/index.js'
        ],


        // list of files / patterns to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/hoot/index.js': [ 'webpack' ],
            'test/hoot/helpers.js': [ 'webpack' ],
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
            reports: [ 'html', 'lcov' ],
            dir: path.join( __dirname, 'coverage' ),
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


        // browserConsoleLogOptions: {
        //     terminal: false
        // },


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 1
    } );
};
