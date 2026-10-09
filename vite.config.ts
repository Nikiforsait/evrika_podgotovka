import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Production CSP: only our own scripts; inline styles are needed by Framer Motion and style props. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:", // Vite inlines small font files as data: URIs
  "connect-src 'self' https:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // frame-ancestors / X-Frame-Options cannot be set via <meta>; add them as HTTP headers on the host.
].join('; ');

/** Dev only: start the account/progress API (server/index.ts) alongside Vite, so `npm run dev` is enough. */
const apiServer = () => ({
  name: 'evrika-api-server',
  apply: 'serve' as const,
  configureServer(server: { httpServer: { once: (ev: string, cb: () => void) => void } | null }) {
    const child = spawn(process.execPath, ['server/index.ts'], { stdio: 'inherit', env: { ...process.env, PORT: '8787' } });
    server.httpServer?.once('close', () => child.kill());
    process.once('exit', () => child.kill());
  },
});

/** Base path: '/' locally and on a server; '/<repo>/' when published as a GitHub project page (set by the workflow). */
const base = process.env.BASE_PATH ?? '/';

export default defineConfig(() => ({
  base,
  plugins: [
    react(),
    apiServer(),
    {
      name: 'csp-meta',
      apply: 'build',
      transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
    },
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // external file, allowed by the CSP (no inline script)
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      workbox: {
        // Precache the app shell and the gzipped content pack for offline use.
        globPatterns: ['**/*.{js,css,html,svg,woff2,gz}'],
        navigateFallback: `${base}index.html`,
      },
      manifest: {
        name: 'Эврика — твой личный тренер по ОГЭ',
        short_name: 'Эврика',
        lang: 'ru',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#1A0B2E',
        theme_color: '#1A0B2E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  server: {
    // The account/progress API (server/index.ts) runs separately during development.
    proxy: { '/api': 'http://localhost:8787' },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    testTimeout: 10000,
  },
}));
