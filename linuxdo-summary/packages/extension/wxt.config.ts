import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: '.',
  // We import everything explicitly; auto-imports mistakenly resolve
  // bare identifiers like `storage` to `wxt/storage`.
  imports: false,
  manifest: {
    name: 'Linux.do 智能总结',
    description: 'Linux.do 帖子 AI 智能总结与导出工具',
    version: '0.1.0',
    permissions: ['storage'],
    host_permissions: ['https://linux.do/*', '<all_urls>'],
    action: {
      default_title: 'Linux.do 智能总结',
    },
  },
  vite: () => ({
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'preact',
    },
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  }),
});
