import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';

const previewExtensionLinkPlugin = (): Plugin => ({
  name: 'reachy-preview-extension-link',
  configurePreviewServer(server) {
    server.httpServer?.once('listening', () => {
      const addressInfo = server.httpServer?.address();
      if (!addressInfo || typeof addressInfo === 'string') {
        return;
      }

      const host = addressInfo.address === '::' ? 'localhost' : addressInfo.address;
      const url = `http://${host}:${addressInfo.port}/extension.js`;
      server.config.logger.info(`\n  Extension ready at: ${url}\n`);
    });
  },
});

export default defineConfig({
  plugins: [previewExtensionLinkPlugin()],
  // Build configuration for TurboWarp extension
  build: {
    // Library mode - generates a single JS file
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReachyMiniExtension',
      formats: ['iife'], // Immediately Invoked Function Expression
      fileName: () => 'extension.js',
    },
    // Output directory
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    // Minify for production
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
    // Don't clear the output directory automatically (useful for debugging)
    emptyOutDir: true,
  },

  // Development server configuration
  server: {
    port: 3000,
    // Enable CORS for TurboWarp to load the extension
    cors: true,
    // Open browser automatically
    open: false,
    // Strict port (fail if port is already in use)
    strictPort: true,
  },

  // Preview server configuration (for testing built extension)
  preview: {
    port: 3000,
    cors: true,
    strictPort: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
