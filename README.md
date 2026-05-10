# 微信自动回复工具（Python）

这是一个可运行的微信自动回复示例，基于 `itchat-uos` 实现：

- 登录微信后，监听好友私聊消息。
- 支持关键词规则自动回复。
- 支持兜底回复（无关键词命中时返回默认文案）。

> ⚠️ 说明：微信生态策略可能变化，第三方库可用性可能受影响，请仅用于个人学习与合规场景。

## 1. 安装依赖

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. 配置规则

编辑 `config.example.json`，然后复制为 `config.json`：

```bash
cp config.example.json config.json
```

配置示例：

- `keywords`：关键词到回复文本的映射。
- `default_reply`：没有命中关键词时的回复。
- `enable_group_reply`：是否开启群聊回复（默认关闭）。

## 3. 启动

```bash
python wechat_auto_reply.py
```

首次启动会弹出二维码（终端中显示），手机微信扫码登录。

## 4. 工作逻辑

1. 收到文本消息。
2. 按关键词顺序匹配（包含即命中）。
3. 命中则回复对应文本；否则回复 `default_reply`。

## 5. 注意事项

- 建议使用小号测试，避免影响正常账号。
- 请勿用于骚扰、营销轰炸等违规行为。
- 需要联网并保持进程运行。
