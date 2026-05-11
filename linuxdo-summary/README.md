# linuxdo-summary

Linux.do 帖子 AI 智能总结工具，支持油猴脚本和浏览器扩展双版本。

## 特性

- 一键总结 Linux.do 帖子正文 + 热门回复
- 支持 OpenAI 兼容 API（OpenAI / DeepSeek / 各类中转 / 本地 Ollama 等）
- 支持导出 Markdown、HTML 离线版
- 油猴脚本和浏览器扩展共享同一套业务与 UI 代码（Monorepo）

## 项目结构

本项目采用 pnpm workspaces 管理多包：

| 包 | 说明 |
| ---- | ---- |
| `packages/core` | 核心业务逻辑（API 调用、配置、正文提取、Markdown、导出） |
| `packages/ui` | 共享 Preact UI 组件（浮动按钮、总结弹窗、设置面板） |
| `packages/userscript` | 油猴脚本，使用 Vite + `vite-plugin-monkey` |
| `packages/extension` | 浏览器扩展，使用 WXT 框架（Chrome / Firefox / Safari） |

## 技术栈

| 版本 | 技术 |
| ---- | ---- |
| 通用 | TypeScript + Preact + pnpm workspaces |
| 油猴脚本 | Vite + `vite-plugin-monkey`（Tampermonkey API） |
| 浏览器扩展 | [WXT](https://wxt.dev)（Chrome / Firefox / Safari） |

## 快速开始

```bash
pnpm install

# 构建油猴脚本 → packages/userscript/dist/*.user.js
pnpm build:userscript

# 构建浏览器扩展（Chrome/Edge，MV3） → packages/extension/.output/chrome-mv3
pnpm build:extension

# 构建 Firefox 扩展 → packages/extension/.output/firefox-mv2
pnpm build:extension:firefox

# 同时构建全部
pnpm build

# 开发模式
pnpm dev:userscript
pnpm dev:extension
```

## 配置

首次使用需要在设置页填写：

- **API Base URL** 例：`https://api.openai.com/v1` / `https://api.deepseek.com/v1`
- **Model** 例：`gpt-4o-mini` / `deepseek-chat`
- **API Key**

油猴脚本版使用 `GM_setValue` / `GM_getValue` 存储，浏览器扩展版使用 `chrome.storage.local`。

## License

MIT
