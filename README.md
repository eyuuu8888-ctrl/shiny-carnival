# 微信 AI 自动回复 Bot

接入大模型，为个人微信提供"像真人一样聊天"的自动回复。

- 🤖 **AI 智能回复**：支持 DeepSeek / OpenAI / 通义千问 等兼容 OpenAI 协议的大模型
- 💬 **多轮对话记忆**：每个联系人/群独立上下文
- 🎯 **精准过滤**：白名单联系人、群聊仅 @ 时回复、前缀过滤
- 🎭 **人设可定制**：自定义 system prompt，换一个 Bot 就是另一种性格
- ⌨️ **拟真延迟**：1–4 秒随机延迟，避免"秒回"穿帮

> ⚠️ **重要说明**：个人微信自动化**不是**微信官方功能，使用一切第三方方案都存在被风控/封号的风险。请**只用自己的小号或测试号**，切勿用于营销/骚扰。

---

## 系统要求

| | 要求 |
|---|---|
| 操作系统 | **Windows 10/11** (底层依赖 `wxauto`，控制 PC 微信 UI) |
| Python | 3.9+ |
| 微信 PC 版 | 需要登录并保持窗口可见（**不能最小化到托盘**） |

> Mac 用户：`wxauto` 只支持 Windows。短期的变通方案是用 Windows 虚拟机/云电脑；或等后续我加 macOS 适配器（需付费协议或社区新方案）。

---

## 快速开始

### 1. 克隆 & 安装依赖

```bash
git clone https://github.com/eyuuu8888-ctrl/shiny-carnival.git
cd shiny-carnival
python -m venv .venv
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 2. 配置大模型

复制 `.env.example` 为 `.env`，填入你的 API Key：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-你的key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

**推荐 DeepSeek**：注册送额度，价格便宜 → <https://platform.deepseek.com/>

### 3. 配置 Bot 行为

复制 `config.yaml.example` 为 `config.yaml`，修改：

```yaml
bot:
  system_prompt: |
    你是我的微信小助手...   # 自定义人设

listen:
  contacts:
    - "文件传输助手"         # 先用文件传输助手测试
    - "张三"                 # 要接管的联系人昵称
    - "我的朋友群"
  group_reply_only_at_me: true  # 群聊只在被 @ 时回
```

### 4. 运行

1. 打开 PC 版微信，登录好
2. **保持微信主窗口打开**（可以拖到屏幕一角，别最小化到托盘）
3. 运行：

```bash
python main.py
```

4. 用另一个微信给"文件传输助手"或你配置的联系人发条消息测试

按 `Ctrl+C` 退出。

---

## 配置说明

### `.env` (LLM 凭证)

| 变量 | 说明 |
|---|---|
| `LLM_PROVIDER` | 仅用于日志展示，值可以是 `deepseek` / `openai` / `qwen` |
| `LLM_API_KEY` | API Key |
| `LLM_BASE_URL` | API 基础 URL (各家不同，见 `.env.example`) |
| `LLM_MODEL` | 模型名 |

### `config.yaml` (Bot 行为)

| 字段 | 说明 |
|---|---|
| `bot.system_prompt` | AI 人设，决定回复风格 |
| `bot.memory_rounds` | 每个会话保留多少轮对话上下文 |
| `bot.reply_delay_min/max` | 回复前随机延迟（秒），模拟真人 |
| `listen.contacts` | **白名单**，只有这里列出的昵称/群名才会自动回 |
| `listen.group_reply_only_at_me` | 群聊是否仅 @ 自己时回复 |
| `filter.ignore_prefixes` | 以这些字符开头的消息不回（默认 `#` 和 `/`，方便你手动发消息不被接管） |
| `filter.ignore_non_text` | 忽略非文本消息（图片/语音等） |

---

## 项目结构

```
shiny-carnival/
├── main.py                          # 启动入口
├── requirements.txt
├── .env.example                     # LLM 凭证模板
├── config.yaml.example              # Bot 配置模板
└── wxbot/
    ├── config.py                    # 配置加载
    ├── llm.py                       # 统一 LLM 客户端
    ├── memory.py                    # 多会话对话记忆
    ├── bot.py                       # 主 Bot 逻辑
    └── adapters/
        ├── base.py                  # 适配器抽象接口
        └── wxauto_adapter.py        # Windows wxauto 实现
```

想换其他协议（比如 padlocal / wechaty）？只要实现 `ChatAdapter` 接口即可，业务代码完全不用改。

---

## 常见问题

**Q: wxauto 装不上？**
A: 只支持 Windows。Mac/Linux 下 `pip install` 会跳过（由 `requirements.txt` 里的 platform 标记控制）。

**Q: 为什么不回复？**
- 检查联系人昵称是否**和微信里显示的完全一致**（带备注就用备注名）
- 检查 PC 微信窗口是否被最小化到托盘
- 看终端日志和 `logs/` 目录下的日志文件

**Q: 会封号吗？**
- 新注册的小号风险高；老号、正常使用痕迹多的号风险低
- 建议降低 `reply_delay_min/max`（别太快）、别每条都回、控制回复频率
- 出现异常立即停止

**Q: 怎么临时自己发消息不被接管？**
A: 以 `#` 开头发消息（或 `config.yaml` 中自定义前缀），Bot 会跳过。

---

## License

MIT
