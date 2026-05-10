"""微信 AI 自动回复 Bot 启动入口.

用法:
    1. 复制 .env.example -> .env，填入 LLM_API_KEY
    2. 复制 config.yaml.example -> config.yaml，配置要监听的联系人
    3. 在 Windows 上打开 PC 微信并登录（不要最小化到托盘）
    4. 运行: python main.py
"""
from __future__ import annotations

import sys

from loguru import logger

from wxbot.adapters.wxauto_adapter import WxAutoAdapter
from wxbot.bot import WeChatBot
from wxbot.config import load_config
from wxbot.llm import LLMClient


def setup_logger() -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level:<7}</level> | {message}",
    )
    logger.add(
        "logs/bot_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="7 days",
        encoding="utf-8",
        level="DEBUG",
    )


def main() -> None:
    setup_logger()

    try:
        cfg = load_config()
    except (FileNotFoundError, ValueError) as e:
        logger.error("配置加载失败: {}", e)
        sys.exit(1)

    logger.info("监听会话: {}", cfg.listen.contacts or "<空>")
    if not cfg.listen.contacts:
        logger.warning(
            "未配置任何监听会话，机器人不会自动回复任何人。"
            "请在 config.yaml 的 listen.contacts 中添加联系人昵称。"
        )

    llm = LLMClient(cfg.llm)
    adapter = WxAutoAdapter(
        listen_contacts=cfg.listen.contacts,
        group_reply_only_at_me=cfg.listen.group_reply_only_at_me,
    )
    bot = WeChatBot(config=cfg, adapter=adapter, llm=llm)
    bot.run()


if __name__ == "__main__":
    main()
