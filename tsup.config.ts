import { defineConfig } from 'tsup';
import alias from 'esbuild-plugin-alias';
import path from 'path';

export default defineConfig({
  entry: ['meshBridgeServer.js'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  external: [
    'lz4',
    'better-sqlite3',
    '@noble/curves',
    '@noble/curves/ed25519',
    'crypto',
    'path',
    'url',
  ],
  esbuildPlugins: [
    alias({
      '@': path.resolve(__dirname, 'src'), // 👈 resolves "@/..." to "src/..."
    }),
  ],
});
