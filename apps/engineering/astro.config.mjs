import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  base: '/engineering/',
  integrations: [
    react(),
  ],
  server: { port: 3002 },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query'],
    },
  },
});
