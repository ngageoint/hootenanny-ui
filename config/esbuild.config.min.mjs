import esbuild from 'esbuild';
import envs from './envs.mjs';
import sharedConfig from './shared.confi.mjs';

esbuild
  .build(Object.assign({
    define: envs,
    minify: true,
    bundle: true,
    entryNames: '[name].min',
    sourcemap: true,
    legalComments: 'none',
    logLevel: 'info',
  }, sharedConfig))
  .catch(() => process.exit(1));
