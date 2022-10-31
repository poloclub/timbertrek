import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import yaml from '@rollup/plugin-yaml';
import * as fs from 'fs';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    // Development
    return {
      plugins: [yaml(), svelte()]
    };
  } else if (command === 'build') {
    switch (mode) {
      case 'notebook': {
        // Production: notebook widget
        return {
          build: {
            outDir: 'notebook-widget/_timbertrek',
            sourcemap: false,
            lib: {
              entry: 'src/main-notebook.ts',
              formats: ['iife'],
              name: 'timbertrek',
              fileName: format => 'timbertrek.js'
            }
          },
          plugins: [
            yaml(),
            svelte({
              emitCss: false
            }),
            {
              name: 'my-post-build-plugin',
              writeBundle: {
                sequential: true,
                order: 'post',
                handler(options) {
                  // Move target file to the notebook package
                  fs.copyFile(
                    path.resolve(options.dir, 'timbertrek.js'),
                    path.resolve(
                      __dirname,
                      'notebook-widget/timbertrek/timbertrek.js'
                    ),
                    error => {
                      if (error) throw error;
                    }
                  );

                  // Delete all other generated files
                  fs.rm(options.dir, { recursive: true }, error => {
                    if (error) throw error;
                  });
                }
              }
            }
          ]
        };
      }

      case 'production': {
        // Production: standard web page (default mode)
        return {
          build: {
            outDir: 'dist'
          },
          plugins: [yaml(), svelte()]
        };
      }

      case 'github': {
        // Production: github page
        return {
          base: '/timbertrek/',
          build: {
            outDir: 'gh-page'
          },
          plugins: [yaml(), svelte()]
        };
      }

      default: {
        console.error(`Unknown production mode ${mode}`);
        return null;
      }
    }
  }
});
