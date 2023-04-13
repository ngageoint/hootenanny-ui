import esbuild from 'esbuild';
import fs from 'node:fs';
import parse from 'minimist';
import envs from './envs.mjs';
import sharedConfig from './shared.confi.mjs';

let args = parse(process.argv.slice(2), {boolean: true});
delete args._;

const context = await esbuild.context(Object.assign({
  define: envs,
  bundle: true,
  entryNames: '[name]',
  sourcemap: true,
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
  // outfile: 'dist/iD.js'
}, sharedConfig))

if (args.watch) {
  await context.watch();
} else {
  const build = await context.rebuild();
  if (args.stats) {
    fs.writeFileSync('./dist/esbuild.json', JSON.stringify(build.metafile, null, 2));
  }
  await context.dispose();
}
