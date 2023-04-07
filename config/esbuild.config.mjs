import esbuild from 'esbuild';
import fs from 'node:fs';
import parse from 'minimist';
import envs from './envs.mjs';
import path from 'path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let args = parse(process.argv.slice(2), {boolean: true});
delete args._;

const context = await esbuild.context({
  define: envs,
  bundle: true,
  sourcemap: true,
  entryPoints: [
    './modules/id.js'
  ],
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
  plugins: [sassPlugin({
    loadPaths:['modules','node-modules'].map(p => path.resolve(__dirname, p)),
  })],
  outfile: 'dist/iD.js'
});

if (args.watch) {
  await context.watch();
} else {
  const build = await context.rebuild();
  if (args.stats) {
    fs.writeFileSync('./dist/esbuild.json', JSON.stringify(build.metafile, null, 2));
  }
  await context.dispose();
}
