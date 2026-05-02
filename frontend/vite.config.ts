import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — siempre cargado, separarlo evita que cambie hash innecesariamente
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router')
          ) {
            return 'react-vendor';
          }
          // Lucide — ~300KB minificado, vale la pena separarlo
          if (id.includes('/node_modules/lucide-react')) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
});
