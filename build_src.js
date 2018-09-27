/* eslint-disable no-console */

const fs = require('fs');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const includePaths = require('rollup-plugin-includepaths');
const nodeResolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const colors = require('colors/safe');
const collectSass = require('rollup-plugin-collect-sass');
const babel = require('rollup-plugin-babel');
const builtins = require('rollup-plugin-node-builtins' );

module.exports = function buildSrc(isDevelopment) {
    //var cache;
    var building = false;

    process.env.BABEL_ENV = !isDevelopment ? 'production' : 'development';

    return function () {
        if (building) return;

        // Start clean
        unlink('dist/iD.min.js');
        unlink('dist/iD.min.js.map');

        console.log('building src');
        console.time(colors.green('src built'));

        building = true;

        const plugins = [
            builtins(),
            includePaths( {
                paths: [
                    'node_modules/d3/node_modules',
                    'modules'
                ],  // npm2 or windows
                include: {
                    'martinez-polygon-clipping': 'node_modules/martinez-polygon-clipping/dist/martinez.umd.js'
                },
                external: []
            }),
            nodeResolve({
                modules: true,
                main: true,
                browser: false,
                jsnext: true
            }),
            collectSass({
                importOnce: true,
                extract: 'dist/hoot.css'
            }),
            commonjs(),
            json( { indent: '' } )
        ];

        if (!isDevelopment) {
            plugins.push(
                babel({
                    exclude: 'node_modules/**'
                })
            );
        }

        return rollup
            .rollup({
                input: './modules/id.js',
                plugins
            })
            .then(function (bundle) {
                return bundle.write({
                    format: 'iife',
                    file: 'dist/iD.min.js',
                    sourcemap: isDevelopment,
                    strict: false,
                    globals: {
                        'events': 'events'
                    }
                });
            })
            .then(function () {
                building = false;
                console.timeEnd(colors.green('src built'));
            })
            .catch(function (err) {
                building = false;
                console.error(err);
                process.exit(1);
            });
    };
};

function unlink(f) {
    try {
        fs.unlinkSync(f);
    } catch (e) { /* noop */ }
}
