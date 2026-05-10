"""主 Bot 逻辑

把 适配器 (收/发消息) + LLM (生成回复) + 记忆 (多轮上下文) 串起来。
"""
from __future__ import annotations

import random
import time
from typing import Optional

from loguru import logger

from .adapters.base import ChatAdapter, IncomingMessage
from .config import AppConfig
from .llm import LLMClient
from .memory import ConversationMemory


class WeChatBot:
    def __init__(
        self,
        config: AppConfig,
        adapter: ChatAdapter,
        llm: LLMClient,
    ):
        self.cfg = config
        self.adapter = adapter
        self.llm = llm
        self.memory = ConversationMemory(
            system_prompt=config.bot.system_prompt,
            max_rounds=config.bot.memory_rounds,
        )

    # ------------------------------------------------------------------
    # 消息过滤：决定这条消息是否要回复
    # ------------------------------------------------------------------
    def _should_reply(self, msg: IncomingMessage) -> bool:
        # 只处理文本消息
        if self.cfg.filter.ignore_non_text and msg.msg_type != "text":
            return False

        # 忽略以特定前缀开头的消息
        text = msg.content.strip()
        for p in self.cfg.filter.ignore_prefixes:
            if p and text.startswith(p):
                logger.debug("忽略前缀 {} 的消息", p)
                return False

        # 群聊：只在被 @ 时回复
        if msg.is_group and self.cfg.listen.group_reply_only_at_me and not msg.is_at_me:
            return False

        # 白名单：只回复在 listen.contacts 里的会话
        allowed = set(self.cfg.listen.contacts)
        if allowed and msg.chat_name not in allowed:
            logger.debug("非白名单会话，忽略: {}", msg.chat_name)
            return False

        return True

    # ------------------------------------------------------------------
    # 核心回调
    # ------------------------------------------------------------------
    def handle_message(self, msg: IncomingMessage) -> None:
        logger.info(
            "收到消息 [{}] {}: {}",
            msg.chat_name,
            msg.sender,
            msg.content,
        )

        if not self._should_reply(msg):
            return

        # 构造会话 id：群聊用 group:<name>，私聊用 user:<name>
        session_id = f"group:{msg.chat_name}" if msg.is_group else f"user:{msg.chat_name}"

        # 预处理用户文本：如果是群聊被 @，去掉 @ 部分让 LLM 看得更干净
        user_text = msg.content
        if msg.is_group:
            user_text = user_text.replace("@", "").strip()

        self.memory.append_user(session_id, user_text)
        messages = self.memory.build_messages(session_id)

        reply = self.llm.chat(messages)
        if not reply:
            logger.warning("LLM 未返回内容，跳过回复")
            return

        self.memory.append_assistant(session_id, reply)

        # 模拟真人回复延迟
        if self.cfg.bot.simulate_typing:
            delay = random.uniform(
                self.cfg.bot.reply_delay_min,
                self.cfg.bot.reply_delay_max,
            )
            time.sleep(delay)

        # 群聊自动 @ 发言人，显得更自然
        at_user: Optional[str] = msg.sender if msg.is_group else None
        self.adapter.send_text(msg.chat_name, reply, at_user=at_user)

    # ------------------------------------------------------------------
    # 启动 / 停止
    # ------------------------------------------------------------------
    def run(self) -> None:
        logger.info("机器人启动中...")
        self.adapter.start(self.handle_message)
        logger.info("机器人已启动，按 Ctrl+C 退出")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("收到退出信号，正在关闭...")
            self.adapter.stop()
