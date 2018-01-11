/* eslint-disable no-console */

var gaze = require('gaze');
var ecstatic = require('ecstatic');
var colors = require('colors/safe');
var express = require('express'),
    app = express(),
    url = require('url'),
    proxy = require('express-http-proxy');

var isDevelopment = process.argv[2] === 'develop';

var buildData = require('./build_data')(isDevelopment);
var buildSrc = require('./build_src')(isDevelopment);
var buildCSS = require('./build_css')(isDevelopment);

buildData()
.then(function () {
    return buildSrc();
});

buildCSS();

if (isDevelopment) {
    gaze(['css/**/*.css'], function(err, watcher) {
        watcher.on('all', function() {
            buildCSS();
        });
    });

    gaze(
        [
            'data/**/*.{js,json}',
            // ignore the output files of `buildData`
            '!data/presets/categories.json',
            '!data/presets/fields.json',
            '!data/presets/presets.json',
            '!data/presets.yaml',
            '!data/taginfo.json',
            '!dist/locales/en.json'
        ],
        function(err, watcher) {
            watcher.on('all', function() {
                buildData()
                    .then(function () {
                        // need to recompute js files when data changes
                        buildSrc();
                    });
            });
        }
    );

    gaze(['modules/**/*.js'], function(err, watcher) {
        watcher.on('all', function() {
            buildSrc();
        });
    });

    var port = 8088;
    var hootHost = 'localhost';
    var hootPort = 8080;
    var hootUrl = 'http://' + hootHost + ':' + hootPort;

    app.use(
        ecstatic({ root: __dirname, cache: 0 })
    ).listen(port);

    app.get('/hootenanny-id', function(req, res) {
        res.writeHead(301,
          { Location: 'http://localhost:8080' }
        );
        res.end();
    });

    app.use('/hoot-services', proxy(hootUrl, {
        forwardPath: function(req) {
            return '/hoot-services' + url.parse(req.url).path;
        }
    }));

    app.use('/static', proxy(hootUrl, {
        forwardPath: function(req) {
            return '/static' + url.parse(req.url).path;
        }
    }));

    console.log(colors.yellow('Listening on ' + port));


}
