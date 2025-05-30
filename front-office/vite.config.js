import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  //base: '/login/qrCode',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_redirects',
          dest: '.' // coloca direto na raiz do dist
        }
      ]
    })
  ],
  server: {
    port: 5173,
  },
});
