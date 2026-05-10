import json
from pathlib import Path
from typing import Dict

import itchat
from itchat.content import TEXT


CONFIG_PATH = Path(__file__).with_name("config.json")
EXAMPLE_CONFIG_PATH = Path(__file__).with_name("config.example.json")


def load_config() -> Dict:
    """Load runtime config from config.json."""
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(
            "未找到 config.json，请先复制 config.example.json 并按需修改。"
        )
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def choose_reply(text: str, cfg: Dict) -> str:
    """Choose reply by keyword matching."""
    keywords: Dict[str, str] = cfg.get("keywords", {})
    for keyword, reply in keywords.items():
        if keyword and keyword in text:
            return reply
    return cfg.get("default_reply", "我已收到消息。")


def main() -> None:
    cfg = load_config()
    enable_group_reply = bool(cfg.get("enable_group_reply", False))

    @itchat.msg_register(TEXT, isFriendChat=True, isGroupChat=False)
    def friend_text_reply(msg):
        text = msg.get("Text", "")
        return choose_reply(text, cfg)

    if enable_group_reply:

        @itchat.msg_register(TEXT, isGroupChat=True)
        def group_text_reply(msg):
            text = msg.get("Text", "")
            return choose_reply(text, cfg)

    print("微信自动回复工具启动中，请扫码登录...")
    itchat.auto_login(hotReload=True, enableCmdQR=2)
    print("登录成功，开始监听消息。")
    itchat.run()


if __name__ == "__main__":
    main()
