import { resolve } from 'path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { pageData } from './src/data/pages.js';
import serve404 from './src/plugins/serve-404.js';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  appType: 'mpa',
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'partials'),
      context(pagePath) {
        return pageData[pagePath];
      },
    }),
    serve404(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        projects: resolve(__dirname, 'projects.html'),
        links: resolve(__dirname, 'links.html'),
        statements: resolve(__dirname, 'statements.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        aigc: resolve(__dirname, 'AIGC-Statement.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
});
