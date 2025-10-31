import esbuild from 'esbuild';
import path from 'path';

esbuild.build({
  entryPoints: ['meshBridgeServer.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  outfile: 'bundle.js',
  alias: {
    '@': path.resolve('src'),
    '@meshcore.js': path.resolve('external/meshcore.js/src'),
  },
  external: [
    'lz4',
    'better-sqlite3',
    '@noble/curves',
    '@noble/curves/ed25519',
    'crypto',
    'path',
    'url',
  ],
  logLevel: 'info',
});
