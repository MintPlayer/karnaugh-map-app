import { defineConfig } from 'vite';


export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/products',
  plugins: [],
  test: {
    name: 'products',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../../coverage/libs/api/products',
      provider: 'v8' as const,
    },
  },
}));
