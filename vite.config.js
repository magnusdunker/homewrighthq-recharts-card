// Builds one classic script, dist/recharts-card.js. React is not bundled:
// the script runs inside TheHome, which hands out its own React on
// window.thehome. Recharts and everything else is bundled.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: 'src/index.jsx',
      formats: ['iife'],
      name: 'TheHomeRechartsCard',
      fileName: () => 'recharts-card.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'thehome.React',
          'react-dom': 'thehome.ReactDOM',
          'react/jsx-runtime': 'thehome.jsxRuntime',
        },
      },
    },
    // new enough for class fields, so no helpers end up outside the IIFE
    target: 'es2022',
    minify: true,
    sourcemap: false,
  },
  test: { include: ['src/**/*.test.js'] },
});
