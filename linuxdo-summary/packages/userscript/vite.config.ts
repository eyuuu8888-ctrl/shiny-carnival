import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Linux.do 智能总结',
        namespace: 'https://github.com/eyuuu8888-ctrl/shiny-carnival',
        description: 'Linux.do 帖子 AI 智能总结与导出工具',
        author: 'linuxdo-summary',
        icon: 'https://linux.do/uploads/default/optimized/2X/6/64a3b6816cf4b8a3b2b7b5d0c8c6c8c8c8c8c8c8_2_180x180.png',
        match: ['https://linux.do/t/*', 'https://linux.do/t/topic/*'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_xmlhttpRequest', 'GM_openInTab'],
        connect: ['*'],
        'run-at': 'document-idle',
      },
      build: {
        // Use fetch() directly; GM_xmlhttpRequest is only a fallback.
        // Keeping the grant declared lets users switch via a settings UI later.
        fileName: 'linuxdo-summary.user.js',
      },
    }),
  ],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
});
