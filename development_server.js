/* eslint-disable no-console */

var fs = require('fs');
var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var gaze = require('gaze');
var ecstatic = require('ecstatic');
var express = require('express'),
    app = express(),
    url = require('url'),
    proxy = require('express-http-proxy');

var building = false;


if (process.argv[2] === 'develop') {
    build();

    gaze(['modules/**/*.js', 'data/**/*.{js,json}'], function(err, watcher) {
        watcher.on('all', function() {
            build();
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

    console.log('Listening on ' + port);

} else {
    build();
}



function unlink(f) {
    try { fs.unlinkSync(f); } catch (e) { /* noop */ }
}

function build() {
    if (building) return;

    // Start clean
    unlink('dist/iD.js');
    unlink('dist/iD.js.map');

    building = true;
    console.log('Rebuilding');
    console.time('Rebuilt');

    rollup.rollup({
        entry: './modules/id.js',
        plugins: [
            nodeResolve({
                jsnext: true, main: true, browser: false
            }),
            commonjs(),
            json()
        ]

    }).then(function (bundle) {
        bundle.write({
            format: 'iife',
            dest: 'dist/iD.js',
            sourceMap: true,
            useStrict: false
        });
        building = false;
        console.timeEnd('Rebuilt');

    }, function(err) {
        building = false;
        console.error(err);
    });
}

