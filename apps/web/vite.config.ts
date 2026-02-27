import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: { Buffer: true },
    }),
  ],
  server: {
    port: 3000,
    allowedHosts: ['tournament-passes-watched-wheat.trycloudflare.com'],
  },
  build: {
    target: 'ES2020',
  },
});
