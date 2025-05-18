import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: '.',
  build: {
    ssr: 'src/index.ts',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      external: [
        // built-ins & deps you don’t want bundled:
        'crypto', 'fs', 'path', 'cors', 'express', 'dotenv', 'jose',
        // …add any other node_modules you want to stay external
      ],
      output: {
        format: 'esm',               // ESM output
        entryFileNames: '[name].js'  // dist/index.js
      }
    }
  },
  resolve: {
    alias: {
      '@library': resolve(__dirname, 'src/library'),
      // …any other path aliases you use
    }
  },
  plugins: [
    dts({ outputDir: 'dist/types' })
  ]
});

// import { defineConfig } from 'vite';
// import { VitePluginNode } from 'vite-plugin-node';
// import { builtinModules } from 'module';

// export default defineConfig({
//   // plugins: [
//   //   ...VitePluginNode({
//   //     adapter: 'express',
//   //     appPath: './src/index.ts',
//   //     exportName: 'garlicPhone'
//   //   })
//   // ],
//   build: {
//     target: 'node22',
//     outDir: 'dist',
//     lib: {
//       entry: 'src/index.ts',
//       formats: ['es'],
//       fileName: () => 'index.js',
//     },
//     rollupOptions: {
//       external: [
//         // 'jose',
//         // 'pg-cloudflare',
//         '/^cloudflare:.*/',
//         ...builtinModules
//       ],
//     },
//   },
// });

