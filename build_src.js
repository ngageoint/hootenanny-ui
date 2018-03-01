/* eslint-disable no-console */

const fs = require('fs');
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const includePaths = require('rollup-plugin-includepaths');
const colors = require('colors/safe');
const collectSass = require('rollup-plugin-collect-sass');

module.exports = function buildSrc() {
    var cache;
    var building = false;
    return function() {
        if (building) return;

        // Start clean
        unlink('dist/iD.js');
        unlink('dist/iD.js.map');

        console.log('building src');
        console.time(colors.green('src built'));

        building = true;

        return rollup
            .rollup({
                input: './modules/id.js',
                plugins: [
                    includePaths({
                        paths: [
                            'node_modules/d3/node_modules'  // for npm 2
                        ]
                    }),
                    nodeResolve({
                        module: true,
                        main: true,
                        browser: false
                    }),
                    collectSass({
                        importOnce: true,
                        extract: 'dist/hoot.css'
                    }),
                    commonjs(),
                    json()
                ],
                cache: cache
            })
            .then(function(bundle) {
                cache = bundle;
                return bundle.write({
                    format: 'iife',
                    file: 'dist/iD.js',
                    sourcemap: true,
                    strict: false
                });
            })
            .then(function() {
                building = false;
                console.timeEnd(colors.green('src built'));
            })
            .catch(function(err) {
                building = false;
                cache = undefined;
                console.error(err);
                process.exit(1);
            });
    };
};

function unlink(f) {
    try {
        fs.unlinkSync(f);
    } catch (e) { /* noop */
    }
}
